'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import {
  Trophy, Plus, X, ChevronLeft, Flag, Users, Loader, Edit2, Trash2,
  ArrowUp, ArrowDown, Check, Calendar
} from 'lucide-react'

interface GolfScorecardProps {
  tripId: string
  members: {
    id: string
    member_id: string | null
    invite_email: string | null
    guest_name?: string | null
    first_name?: string | null
    last_name?: string | null
  }[]
}

interface GolfRound {
  id: string
  trip_id: string
  course_name: string
  round_date: string
  holes: number
  pars: number[]
  created_by: string
  created_at: string
  golf_players?: GolfPlayer[]
}

interface GolfPlayer {
  id: string
  round_id: string
  trip_member_id: string
  player_name: string
  handicap: number
  created_at: string
}

interface GolfScore {
  id: string
  round_id: string
  player_id: string
  hole_number: number
  strokes: number
  created_at: string
}

interface RoundWithData extends GolfRound {
  players: (GolfPlayer & { scores?: GolfScore[] })[]
}

function getMemberName(member: any): string {
  if (member.first_name && member.last_name) return `${member.first_name} ${member.last_name}`
  if (member.guest_name) return member.guest_name
  if (member.first_name) return member.first_name
  return 'Unknown'
}

function ScoreColor({ strokes, par }: { strokes: number | null; par: number }) {
  if (strokes === null) return 'bg-white border-border'
  if (strokes < par) return 'bg-green-100 border-green-300 text-green-900'
  if (strokes === par) return 'bg-white border-border'
  return 'bg-red-100 border-red-300 text-red-900'
}

export default function GolfScorecard({ tripId, members }: GolfScorecardProps) {
  const supabase = createClient()
  const [view, setView] = useState<'rounds' | 'scorecard' | 'leaderboard'>('rounds')
  const [selectedRound, setSelectedRound] = useState<RoundWithData | null>(null)
  const [rounds, setRounds] = useState<RoundWithData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Add round form state
  const [showAddRound, setShowAddRound] = useState(false)
  const [formCourseName, setFormCourseName] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formHoles, setFormHoles] = useState<9 | 18>(18)
  const [formPars, setFormPars] = useState<number[]>(Array(18).fill(4))
  const [formSelectedPlayers, setFormSelectedPlayers] = useState<Set<string>>(new Set())
  const [formHandicaps, setFormHandicaps] = useState<Record<string, number>>({})
  const [addRoundLoading, setAddRoundLoading] = useState(false)

  // Score editing state
  const [scoreEdits, setScoreEdits] = useState<Record<string, Record<string, number>>>({})

  useEffect(() => {
    fetchRounds()
  }, [tripId])

  async function fetchRounds() {
    try {
      setLoading(true)
      setError(null)

      const { data: roundsData, error: roundsError } = await (supabase
        .from('golf_rounds') as any)
        .select('*')
        .eq('trip_id', tripId)
        .order('round_date', { ascending: false })

      if (roundsError) throw roundsError

      // Fetch players and scores for each round
      const roundsWithData = await Promise.all(
        (roundsData || []).map(async (round) => {
          const { data: playersData, error: playersError } = await (supabase
            .from('golf_players') as any)
            .select('*')
            .eq('round_id', round.id)

          if (playersError) throw playersError

          // Fetch scores for each player
          const playersWithScores = await Promise.all(
            (playersData || []).map(async (player) => {
              const { data: scoresData, error: scoresError } = await (supabase
                .from('golf_scores') as any)
                .select('*')
                .eq('round_id', round.id)
                .eq('player_id', player.id)

              if (scoresError) throw scoresError

              return {
                ...player,
                scores: scoresData || []
              }
            })
          )

          return {
            ...round,
            players: playersWithScores
          }
        })
      )

      setRounds(roundsWithData)
    } catch (err) {
      console.error('Error fetching golf rounds:', err)
      setError('Failed to load golf rounds')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddRound() {
    if (!formCourseName.trim()) {
      setError('Please enter a course name')
      return
    }

    if (formSelectedPlayers.size === 0) {
      setError('Please select at least one player')
      return
    }

    try {
      setAddRoundLoading(true)
      setError(null)

      // Create round
      const { data: newRound, error: roundError } = await (supabase
        .from('golf_rounds') as any)
        .insert({
          trip_id: tripId,
          course_name: formCourseName,
          round_date: formDate,
          holes: formHoles,
          pars: formPars.slice(0, formHoles),
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (roundError) throw roundError

      // Create players
      const playerIds: Record<string, string> = {}
      const selectedPlayerIds = Array.from(formSelectedPlayers)

      const { data: playersData, error: playersError } = await (supabase
        .from('golf_players') as any)
        .insert(
          selectedPlayerIds.map((memberId: string) => {
            const member = members.find(m => m.id === memberId)
            return {
              round_id: newRound.id,
              trip_member_id: memberId,
              player_name: getMemberName(member),
              handicap: formHandicaps[memberId] || 0
            }
          })
        )
        .select()

      if (playersError) throw playersError

      playersData?.forEach(p => {
        playerIds[p.trip_member_id] = p.id
      })

      // Create score records for all holes
      const scoreInserts: any[] = []
      selectedPlayerIds.forEach((memberId) => {
        const playerId = playerIds[memberId]
        for (let hole = 1; hole <= formHoles; hole++) {
          scoreInserts.push({
            round_id: newRound.id,
            player_id: playerId,
            hole_number: hole,
            strokes: null
          })
        }
      })

      if (scoreInserts.length > 0) {
        const { error: scoresError } = await (supabase
          .from('golf_scores') as any)
          .insert(scoreInserts)

        if (scoresError) throw scoresError
      }

      // Reset form and refresh
      setFormCourseName('')
      setFormDate(new Date().toISOString().split('T')[0])
      setFormHoles(18)
      setFormPars(Array(18).fill(4))
      setFormSelectedPlayers(new Set())
      setFormHandicaps({})
      setShowAddRound(false)

      await fetchRounds()
    } catch (err) {
      console.error('Error creating golf round:', err)
      setError('Failed to create round')
    } finally {
      setAddRoundLoading(false)
    }
  }

  async function handleSaveScores() {
    try {
      setLoading(true)
      setError(null)

      if (!selectedRound) return

      // Flatten edits and save
      for (const playerId in scoreEdits) {
        for (const holeNum in scoreEdits[playerId]) {
          const strokes = scoreEdits[playerId][holeNum]
          const { error } = await (supabase
            .from('golf_scores') as any)
            .update({ strokes })
            .eq('round_id', selectedRound.id)
            .eq('player_id', playerId)
            .eq('hole_number', parseInt(holeNum))

          if (error) throw error
        }
      }

      setScoreEdits({})
      await fetchRounds()

      // Reload selected round
      const updatedRound = rounds.find(r => r.id === selectedRound.id)
      if (updatedRound) {
        setSelectedRound(updatedRound)
      }
    } catch (err) {
      console.error('Error saving scores:', err)
      setError('Failed to save scores')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteRound(roundId: string) {
    if (!confirm('Are you sure you want to delete this round?')) return

    try {
      setLoading(true)
      setError(null)

      // Delete scores
      const { error: scoresError } = await (supabase
        .from('golf_scores') as any)
        .delete()
        .eq('round_id', roundId)

      if (scoresError) throw scoresError

      // Delete players
      const { error: playersError } = await (supabase
        .from('golf_players') as any)
        .delete()
        .eq('round_id', roundId)

      if (playersError) throw playersError

      // Delete round
      const { error: roundError } = await (supabase
        .from('golf_rounds') as any)
        .delete()
        .eq('id', roundId)

      if (roundError) throw roundError

      setSelectedRound(null)
      await fetchRounds()
    } catch (err) {
      console.error('Error deleting round:', err)
      setError('Failed to delete round')
    } finally {
      setLoading(false)
    }
  }

  function getLeaderboardData() {
    const leaderboard: Record<string, any> = {}

    rounds.forEach((round) => {
      round.players.forEach((player) => {
        if (!leaderboard[player.id]) {
          leaderboard[player.id] = {
            playerId: player.id,
            playerName: player.player_name,
            handicap: player.handicap,
            rounds: [],
            totalStrokes: 0,
            totalPar: 0,
            roundCount: 0
          }
        }

        const roundScores = player.scores || []
        let roundStrokes = 0
        let roundPar = 0
        let completedHoles = 0

        roundScores.forEach((score) => {
          if (score.strokes !== null) {
            roundStrokes += score.strokes
            roundPar += round.pars[score.hole_number - 1] || 0
            completedHoles++
          }
        })

        if (completedHoles > 0) {
          leaderboard[player.id].rounds.push({
            courseId: round.id,
            courseName: round.course_name,
            strokes: roundStrokes,
            par: roundPar,
            differential: roundStrokes - roundPar
          })
          leaderboard[player.id].totalStrokes += roundStrokes
          leaderboard[player.id].totalPar += roundPar
          leaderboard[player.id].roundCount += 1
        }
      })
    })

    return Object.values(leaderboard)
      .sort((a, b) => {
        const aDiff = a.totalStrokes - a.totalPar
        const bDiff = b.totalStrokes - b.totalPar
        return aDiff - bDiff
      })
      .map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
        avgPerRound: entry.roundCount > 0 ? (entry.totalStrokes / entry.roundCount).toFixed(1) : 'N/A',
        bestRound: entry.rounds.length > 0 ? Math.min(...entry.rounds.map(r => r.strokes)) : 'N/A',
        netScore: entry.totalStrokes - entry.handicap
      }))
  }

  if (loading && rounds.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-primary">Golf Scorecard</h1>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-card p-4 flex items-start justify-between">
          <div className="text-red-800 text-sm">{error}</div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* View tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setView('rounds')}
          className={`px-4 py-2 font-medium transition-colors ${
            view === 'rounds'
              ? 'text-accent border-b-2 border-accent'
              : 'text-text-secondary hover:text-primary'
          }`}
        >
          Rounds
        </button>
        <button
          onClick={() => setView('leaderboard')}
          className={`px-4 py-2 font-medium transition-colors ${
            view === 'leaderboard'
              ? 'text-accent border-b-2 border-accent'
              : 'text-text-secondary hover:text-primary'
          }`}
        >
          Leaderboard
        </button>
      </div>

      {/* ROUNDS VIEW */}
      {view === 'rounds' && !selectedRound && (
        <div className="space-y-6">
          <button
            onClick={() => setShowAddRound(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-input font-medium hover:bg-accent-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Round
          </button>

          {rounds.length === 0 ? (
            <div className="text-center py-12 bg-bg-soft rounded-card">
              <Flag className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">No rounds recorded yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {rounds.map((round) => {
                const leader = round.players.reduce((best, player) => {
                  const playerTotal = (player.scores || []).reduce(
                    (sum, s) => sum + (s.strokes || 0),
                    0
                  )
                  if (!best) return { player, total: playerTotal }
                  const bestTotal = (best.player.scores || []).reduce(
                    (sum, s) => sum + (s.strokes || 0),
                    0
                  )
                  return playerTotal < bestTotal ? { player, total: playerTotal } : best
                }, null as any)

                return (
                  <div
                    key={round.id}
                    onClick={() => setSelectedRound(round)}
                    className="bg-white border border-border rounded-card p-6 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-primary">{round.course_name}</h3>
                        <p className="text-sm text-text-secondary flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(round.round_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-accent-light text-accent px-3 py-1 rounded-full text-sm font-medium">
                          {round.holes} holes
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-text-secondary" />
                        <span className="text-sm text-text-secondary">{round.players.length} players</span>
                      </div>
                      {leader && (
                        <div className="text-sm">
                          <p className="text-text-muted">Leader</p>
                          <p className="font-bold text-primary">{leader.player.player_name} ({leader.total})</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* SCORECARD VIEW */}
      {view === 'rounds' && selectedRound && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedRound(null)}
              className="flex items-center gap-2 text-accent hover:text-accent-hover transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Rounds
            </button>
            <button
              onClick={() => handleDeleteRound(selectedRound.id)}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-input transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>

          <div className="bg-white border border-border rounded-card p-6">
            <h2 className="text-2xl font-bold text-primary mb-2">{selectedRound.course_name}</h2>
            <p className="text-text-secondary">{format(new Date(selectedRound.round_date), 'MMMM d, yyyy')} • {selectedRound.holes} holes</p>
          </div>

          {/* Scorecard Grid */}
          <div className="bg-white border border-border rounded-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-bold text-primary bg-bg-soft sticky left-0 z-10 w-32">Player</th>
                  {Array.from({ length: selectedRound.holes }).map((_, i) => (
                    <th key={i} className="p-2 text-center font-bold text-primary bg-bg-soft text-xs">
                      {i + 1}
                    </th>
                  ))}
                  <th className="p-2 text-center font-bold text-primary bg-bg-soft">OUT</th>
                  {selectedRound.holes === 18 && (
                    <th className="p-2 text-center font-bold text-primary bg-bg-soft">IN</th>
                  )}
                  <th className="p-2 text-center font-bold text-primary bg-bg-soft">Total</th>
                  <th className="p-2 text-center font-bold text-primary bg-bg-soft">vs Par</th>
                </tr>
              </thead>
              <tbody>
                {/* Par row */}
                <tr className="border-b border-border bg-accent-light">
                  <td className="p-3 font-bold text-primary sticky left-0 z-10 bg-accent-light">Par</td>
                  {selectedRound.pars.map((par, i) => (
                    <td key={i} className="p-2 text-center font-bold text-primary">
                      {par}
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold text-primary">
                    {selectedRound.pars.slice(0, 9).reduce((a, b) => a + b, 0)}
                  </td>
                  {selectedRound.holes === 18 && (
                    <td className="p-2 text-center font-bold text-primary">
                      {selectedRound.pars.slice(9, 18).reduce((a, b) => a + b, 0)}
                    </td>
                  )}
                  <td className="p-2 text-center font-bold text-primary">
                    {selectedRound.pars.reduce((a, b) => a + b, 0)}
                  </td>
                  <td className="p-2 text-center"></td>
                </tr>

                {/* Player rows */}
                {selectedRound.players.map((player) => {
                  const scoresMap: Record<number, GolfScore | undefined> = {}
                  player.scores?.forEach(s => {
                    scoresMap[s.hole_number] = s
                  })

                  let frontTotal = 0
                  let backTotal = 0
                  let frontPar = 0
                  let backPar = 0

                  Array.from({ length: Math.min(9, selectedRound.holes) }).forEach((_, i) => {
                    const score = scoresMap[i + 1]?.strokes
                    if (score !== null && score !== undefined) {
                      frontTotal += score
                      frontPar += selectedRound.pars[i]
                    }
                  })

                  if (selectedRound.holes === 18) {
                    Array.from({ length: 9 }).forEach((_, i) => {
                      const score = scoresMap[i + 10]?.strokes
                      if (score !== null && score !== undefined) {
                        backTotal += score
                        backPar += selectedRound.pars[i + 9]
                      }
                    })
                  }

                  const total = frontTotal + backTotal
                  const totalPar = frontPar + backPar
                  const vsPar = total > 0 ? total - totalPar : 0

                  return (
                    <tr key={player.id} className="border-b border-border hover:bg-bg-soft transition-colors">
                      <td className="p-3 font-semibold text-primary sticky left-0 z-10 bg-white">
                        <div>
                          <p>{player.player_name}</p>
                          <p className="text-xs text-text-secondary">HCP: {player.handicap}</p>
                        </div>
                      </td>
                      {Array.from({ length: selectedRound.holes }).map((_, i) => {
                        const score = scoresMap[i + 1]?.strokes ?? null
                        const par = selectedRound.pars[i]
                        const edited = scoreEdits[player.id]?.[i + 1]
                        const displayScore = edited !== undefined ? edited : score

                        return (
                          <td key={i} className="p-2">
                            <input
                              type="number"
                              min="0"
                              max="15"
                              value={displayScore ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : parseInt(e.target.value)
                                setScoreEdits(prev => ({
                                  ...prev,
                                  [player.id]: {
                                    ...(prev[player.id] || {}),
                                    [i + 1]: val
                                  }
                                }))
                              }}
                              className={`w-full text-center p-1 border rounded-input font-semibold ${ScoreColor({ strokes: displayScore, par })}`}
                            />
                          </td>
                        )
                      })}
                      <td className="p-2 text-center font-bold text-primary bg-bg-soft">
                        {frontTotal || '—'}
                      </td>
                      {selectedRound.holes === 18 && (
                        <td className="p-2 text-center font-bold text-primary bg-bg-soft">
                          {backTotal || '—'}
                        </td>
                      )}
                      <td className={`p-2 text-center font-bold ${
                        total === 0 ? 'bg-bg-soft' : total < totalPar ? 'bg-green-100 text-green-900' : total === totalPar ? 'bg-bg-soft' : 'bg-red-100 text-red-900'
                      }`}>
                        {total || '—'}
                      </td>
                      <td className={`p-2 text-center font-bold ${
                        vsPar === 0 ? 'bg-bg-soft' : vsPar < 0 ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
                      }`}>
                        {total === 0 ? '—' : vsPar > 0 ? `+${vsPar}` : vsPar}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {Object.keys(scoreEdits).length > 0 && (
            <button
              onClick={handleSaveScores}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-input font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors w-full justify-center"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Scores
            </button>
          )}
        </div>
      )}

      {/* LEADERBOARD VIEW */}
      {view === 'leaderboard' && (
        <div className="space-y-6">
          {rounds.length === 0 ? (
            <div className="text-center py-12 bg-bg-soft rounded-card">
              <Trophy className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">No rounds to display</p>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-soft">
                    <th className="text-left p-4 font-bold text-primary">Rank</th>
                    <th className="text-left p-4 font-bold text-primary">Player</th>
                    <th className="text-center p-4 font-bold text-primary text-sm">HCP</th>
                    <th className="text-center p-4 font-bold text-primary text-sm">Gross</th>
                    <th className="text-center p-4 font-bold text-primary text-sm">Net</th>
                    <th className="text-center p-4 font-bold text-primary text-sm">Rounds</th>
                    <th className="text-center p-4 font-bold text-primary text-sm">Avg/Rnd</th>
                    <th className="text-center p-4 font-bold text-primary text-sm">Best</th>
                  </tr>
                </thead>
                <tbody>
                  {getLeaderboardData().map((entry, idx) => (
                    <tr key={entry.playerId} className="border-b border-border hover:bg-bg-soft transition-colors">
                      <td className="p-4">
                        <div className="flex items-center justify-center">
                          {idx === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                          {idx === 1 && <Trophy className="w-5 h-5 text-gray-400" />}
                          {idx === 2 && <Trophy className="w-5 h-5 text-orange-600" />}
                          {idx > 2 && <span className="font-bold text-primary">{entry.rank}</span>}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-primary">{entry.playerName}</td>
                      <td className="p-4 text-center text-text-secondary">{entry.handicap}</td>
                      <td className={`p-4 text-center font-bold ${
                        entry.totalStrokes === 0 ? '' :
                        entry.totalStrokes - entry.totalPar < 0 ? 'text-green-600' :
                        entry.totalStrokes - entry.totalPar === 0 ? '' :
                        'text-red-600'
                      }`}>
                        {entry.totalStrokes}
                      </td>
                      <td className={`p-4 text-center font-bold ${
                        entry.totalStrokes === 0 ? '' :
                        entry.netScore - entry.totalPar < 0 ? 'text-green-600' :
                        entry.netScore - entry.totalPar === 0 ? '' :
                        'text-red-600'
                      }`}>
                        {entry.netScore}
                      </td>
                      <td className="p-4 text-center text-text-secondary">{entry.roundCount}</td>
                      <td className="p-4 text-center text-text-secondary">{entry.avgPerRound}</td>
                      <td className="p-4 text-center text-text-secondary">{entry.bestRound}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADD ROUND MODAL */}
      {showAddRound && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">Add Golf Round</h2>
              <button
                onClick={() => setShowAddRound(false)}
                className="text-text-secondary hover:text-primary transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Course Name */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">Course Name</label>
                <input
                  type="text"
                  value={formCourseName}
                  onChange={(e) => setFormCourseName(e.target.value)}
                  placeholder="e.g., Pebble Beach Golf Links"
                  className="w-full px-4 py-2 border border-border rounded-input focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">Round Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-input focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Holes */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-3">Holes</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setFormHoles(9)
                      setFormPars(Array(18).fill(4))
                    }}
                    className={`flex-1 px-4 py-2 rounded-input font-medium transition-colors ${
                      formHoles === 9
                        ? 'bg-accent text-white'
                        : 'bg-bg-soft text-primary border border-border hover:border-accent'
                    }`}
                  >
                    9 Holes
                  </button>
                  <button
                    onClick={() => {
                      setFormHoles(18)
                      setFormPars(Array(18).fill(4))
                    }}
                    className={`flex-1 px-4 py-2 rounded-input font-medium transition-colors ${
                      formHoles === 18
                        ? 'bg-accent text-white'
                        : 'bg-bg-soft text-primary border border-border hover:border-accent'
                    }`}
                  >
                    18 Holes
                  </button>
                </div>
              </div>

              {/* Par Configuration */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-3">Par per Hole</label>
                <div className="grid grid-cols-9 gap-2">
                  {Array.from({ length: formHoles }).map((_, i) => (
                    <div key={i}>
                      <label className="text-xs text-text-secondary block mb-1 text-center">#{i + 1}</label>
                      <input
                        type="number"
                        min="3"
                        max="6"
                        value={formPars[i]}
                        onChange={(e) => {
                          const newPars = [...formPars]
                          newPars[i] = parseInt(e.target.value) || 4
                          setFormPars(newPars)
                        }}
                        className="w-full px-2 py-1 border border-border rounded-input text-center font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Players */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-3">Players</label>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                      <div className="flex-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formSelectedPlayers.has(member.id)}
                            onChange={(e) => {
                              const newSelected = new Set(formSelectedPlayers)
                              if (e.target.checked) {
                                newSelected.add(member.id)
                              } else {
                                newSelected.delete(member.id)
                              }
                              setFormSelectedPlayers(newSelected)
                            }}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="font-medium text-primary">{getMemberName(member)}</span>
                        </label>
                      </div>
                      {formSelectedPlayers.has(member.id) && (
                        <div className="w-20">
                          <label className="text-xs text-text-secondary block mb-1">Handicap</label>
                          <input
                            type="number"
                            min="0"
                            max="54"
                            value={formHandicaps[member.id] ?? 0}
                            onChange={(e) => {
                              setFormHandicaps({
                                ...formHandicaps,
                                [member.id]: parseInt(e.target.value) || 0
                              })
                            }}
                            className="w-full px-2 py-1 border border-border rounded-input text-center text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setShowAddRound(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-input font-medium text-primary hover:bg-bg-soft transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRound}
                  disabled={addRoundLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-input font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
                >
                  {addRoundLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Create Round
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
