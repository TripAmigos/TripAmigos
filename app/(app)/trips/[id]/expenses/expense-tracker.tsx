'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import {
  ArrowLeft, Plus, X, Loader, Receipt, Utensils, Wine, Car, Ticket,
  Building2, ShoppingBag, MoreHorizontal, ArrowRight, Check, Trash2,
  ChevronDown, Users, TrendingUp, Wallet
} from 'lucide-react'

interface Member {
  id: string
  member_id: string | null
  invite_status: string
  role: string
  guest_name: string | null
  first_name: string | null
  last_name: string | null
}

interface ExpenseSplit {
  id: string
  trip_member_id: string
  amount_owed: number
  is_settled: boolean
}

interface Expense {
  id: string
  description: string
  amount: number
  currency: string
  category: string
  expense_date: string
  split_type: string
  paid_by: string
  created_at: string
  expense_splits: ExpenseSplit[]
}

interface ExpenseTrackerProps {
  trip: any
  members: Member[]
  expenses: Expense[]
  userId: string
  currentMemberId: string
  userName: string
}

const CATEGORIES = [
  { value: 'food', label: 'Food', icon: Utensils, color: 'text-orange-600 bg-orange-50' },
  { value: 'drinks', label: 'Drinks', icon: Wine, color: 'text-purple-600 bg-purple-50' },
  { value: 'transport', label: 'Transport', icon: Car, color: 'text-blue-600 bg-blue-50' },
  { value: 'activities', label: 'Activities', icon: Ticket, color: 'text-green-600 bg-green-50' },
  { value: 'accommodation', label: 'Accommodation', icon: Building2, color: 'text-indigo-600 bg-indigo-50' },
  { value: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'text-pink-600 bg-pink-50' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'text-gray-600 bg-gray-50' },
]

function getCategoryInfo(category: string) {
  return CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1]
}

function getMemberName(member: Member): string {
  if (member.first_name && member.last_name) return `${member.first_name} ${member.last_name}`
  if (member.guest_name) return member.guest_name
  if (member.first_name) return member.first_name
  return 'Unknown'
}

function getMemberInitials(member: Member): string {
  const name = getMemberName(member)
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// Minimum transactions settlement algorithm
function calculateSettlements(balances: Map<string, number>): { from: string; to: string; amount: number }[] {
  const settlements: { from: string; to: string; amount: number }[] = []
  const debtors: { id: string; amount: number }[] = []
  const creditors: { id: string; amount: number }[] = []

  balances.forEach((balance, id) => {
    if (balance < -0.01) debtors.push({ id, amount: -balance })
    else if (balance > 0.01) creditors.push({ id, amount: balance })
  })

  // Sort descending by amount
  debtors.sort((a, b) => b.amount - a.amount)
  creditors.sort((a, b) => b.amount - a.amount)

  let i = 0, j = 0
  while (i < debtors.length && j < creditors.length) {
    const transfer = Math.min(debtors[i].amount, creditors[j].amount)
    if (transfer > 0.01) {
      settlements.push({
        from: debtors[i].id,
        to: creditors[j].id,
        amount: Math.round(transfer * 100) / 100,
      })
    }
    debtors[i].amount -= transfer
    creditors[j].amount -= transfer
    if (debtors[i].amount < 0.01) i++
    if (creditors[j].amount < 0.01) j++
  }

  return settlements
}

export default function ExpenseTracker({
  trip,
  members,
  expenses: initialExpenses,
  userId,
  currentMemberId,
  userName,
}: ExpenseTrackerProps) {
  const router = useRouter()
  const supabase = createClient()

  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [showAddForm, setShowAddForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settle'>('expenses')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Add expense form state
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [paidBy, setPaidBy] = useState(currentMemberId)
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal')
  const [splitAmong, setSplitAmong] = useState<string[]>(members.filter(m => m.invite_status === 'accepted').map(m => m.id))
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({})

  // Only accepted members participate
  const activeMembers = useMemo(() =>
    members.filter(m => m.invite_status === 'accepted'),
  [members])

  // Calculate balances
  const balances = useMemo(() => {
    const bal = new Map<string, number>()
    activeMembers.forEach(m => bal.set(m.id, 0))

    expenses.forEach(exp => {
      // Person who paid gets credit
      const current = bal.get(exp.paid_by) || 0
      bal.set(exp.paid_by, current + exp.amount)

      // Each person in the split owes their share
      exp.expense_splits.forEach(split => {
        const memberBal = bal.get(split.trip_member_id) || 0
        bal.set(split.trip_member_id, memberBal - split.amount_owed)
      })
    })

    return bal
  }, [expenses, activeMembers])

  const settlements = useMemo(() => calculateSettlements(new Map(balances)), [balances])

  const totalSpent = useMemo(() =>
    expenses.reduce((sum, e) => sum + e.amount, 0),
  [expenses])

  const currency = expenses[0]?.currency || 'GBP'
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£'

  const resetForm = () => {
    setDescription('')
    setAmount('')
    setCategory('food')
    setExpenseDate(format(new Date(), 'yyyy-MM-dd'))
    setPaidBy(currentMemberId)
    setSplitType('equal')
    setSplitAmong(activeMembers.map(m => m.id))
    setCustomSplits({})
    setError('')
  }

  const handleAddExpense = async () => {
    if (!description.trim()) { setError('Add a description'); return }
    if (!amount || parseFloat(amount) <= 0) { setError('Add a valid amount'); return }
    if (splitAmong.length === 0) { setError('Select at least one person to split with'); return }

    setLoading(true)
    setError('')

    const amountNum = parseFloat(amount)

    try {
      // Insert the expense
      const { data: expense, error: expError } = await supabase
        .from('trip_expenses')
        .insert({
          trip_id: trip.id,
          paid_by: paidBy,
          description: description.trim(),
          amount: amountNum,
          currency,
          category,
          expense_date: expenseDate,
          split_type: splitType,
        })
        .select()
        .single()

      if (expError) { setError(expError.message); setLoading(false); return }

      // Calculate splits
      let splits: { expense_id: string; trip_member_id: string; amount_owed: number }[]

      if (splitType === 'equal') {
        const perPerson = Math.round((amountNum / splitAmong.length) * 100) / 100
        splits = splitAmong.map(memberId => ({
          expense_id: expense.id,
          trip_member_id: memberId,
          amount_owed: perPerson,
        }))
      } else {
        splits = splitAmong.map(memberId => ({
          expense_id: expense.id,
          trip_member_id: memberId,
          amount_owed: parseFloat(customSplits[memberId] || '0'),
        }))
      }

      const { error: splitError } = await supabase
        .from('expense_splits')
        .insert(splits)

      if (splitError) { setError(splitError.message); setLoading(false); return }

      // Add to local state
      setExpenses([{
        ...expense,
        expense_splits: splits.map((s, i) => ({ ...s, id: `temp-${i}`, is_settled: false })),
      }, ...expenses])

      resetForm()
      setShowAddForm(false)
    } catch {
      setError('Something went wrong')
    }
    setLoading(false)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    const { error } = await supabase
      .from('trip_expenses')
      .delete()
      .eq('id', expenseId)

    if (!error) {
      setExpenses(expenses.filter(e => e.id !== expenseId))
    }
  }

  const toggleSplitMember = (memberId: string) => {
    if (splitAmong.includes(memberId)) {
      setSplitAmong(splitAmong.filter(id => id !== memberId))
    } else {
      setSplitAmong([...splitAmong, memberId])
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/trips/${trip.id}`}
            className="p-2 rounded-input hover:bg-bg-soft transition-colors"
          >
            <ArrowLeft size={20} className="text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary">Expenses</h1>
            <p className="text-sm text-text-secondary">{trip.name}</p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-input font-medium transition-colors"
        >
          <Plus size={16} /> Add expense
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-border rounded-card p-4 text-center">
          <Receipt size={20} className="text-accent mx-auto mb-1" />
          <p className="text-xl font-bold text-primary">{currencySymbol}{totalSpent.toFixed(2)}</p>
          <p className="text-xs text-text-secondary">Total spent</p>
        </div>
        <div className="bg-white border border-border rounded-card p-4 text-center">
          <Users size={20} className="text-green-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-primary">{activeMembers.length}</p>
          <p className="text-xs text-text-secondary">People</p>
        </div>
        <div className="bg-white border border-border rounded-card p-4 text-center">
          <TrendingUp size={20} className="text-purple-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-primary">
            {currencySymbol}{activeMembers.length > 0 ? (totalSpent / activeMembers.length).toFixed(2) : '0.00'}
          </p>
          <p className="text-xs text-text-secondary">Per person avg</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border border-border rounded-card p-1">
        {(['expenses', 'balances', 'settle'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-input text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-primary'
            }`}
          >
            {tab === 'expenses' ? 'Expenses' : tab === 'balances' ? 'Balances' : 'Settle up'}
          </button>
        ))}
      </div>

      {/* Add expense modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-card shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-primary">Add expense</h2>
              <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-bg-soft rounded">
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-input px-4 py-2 text-sm text-red-700">{error}</div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">What was it for?</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Dinner at the tapas bar"
                  autoFocus
                  className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
                />
              </div>

              {/* Amount and date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-medium">{currencySymbol}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        category === cat.value
                          ? 'border-accent bg-accent-light text-accent'
                          : 'border-border bg-white text-text-secondary hover:border-gray-300'
                      }`}
                    >
                      <cat.icon size={12} />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Who paid */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Who paid?</label>
                <div className="grid grid-cols-2 gap-2">
                  {activeMembers.map(member => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setPaidBy(member.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-input border-2 text-left transition-all ${
                        paidBy === member.id
                          ? 'border-accent bg-accent-light'
                          : 'border-border hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        paidBy === member.id ? 'bg-accent text-white' : 'bg-bg-soft text-text-secondary'
                      }`}>
                        {getMemberInitials(member)}
                      </div>
                      <span className="text-sm font-medium text-primary truncate">
                        {member.id === currentMemberId ? 'You' : getMemberName(member).split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Split type */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Split</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setSplitType('equal')}
                    className={`flex-1 py-2 rounded-input border-2 text-sm font-medium transition-all ${
                      splitType === 'equal'
                        ? 'border-accent bg-accent-light text-accent'
                        : 'border-border text-text-secondary hover:border-gray-300'
                    }`}
                  >
                    Split equally
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitType('custom')}
                    className={`flex-1 py-2 rounded-input border-2 text-sm font-medium transition-all ${
                      splitType === 'custom'
                        ? 'border-accent bg-accent-light text-accent'
                        : 'border-border text-text-secondary hover:border-gray-300'
                    }`}
                  >
                    Custom amounts
                  </button>
                </div>

                {/* Who to split with */}
                <div className="space-y-1.5">
                  {activeMembers.map(member => (
                    <div key={member.id} className="flex items-center gap-3">
                      <label className="flex items-center gap-2 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={splitAmong.includes(member.id)}
                          onChange={() => toggleSplitMember(member.id)}
                          className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                        />
                        <div className="w-6 h-6 rounded-full bg-bg-soft flex items-center justify-center text-[10px] font-bold text-text-secondary">
                          {getMemberInitials(member)}
                        </div>
                        <span className="text-sm text-primary">
                          {member.id === currentMemberId ? 'You' : getMemberName(member)}
                        </span>
                      </label>
                      {splitType === 'equal' && splitAmong.includes(member.id) && amount ? (
                        <span className="text-xs text-text-muted">
                          {currencySymbol}{(parseFloat(amount) / splitAmong.length).toFixed(2)}
                        </span>
                      ) : splitType === 'custom' && splitAmong.includes(member.id) ? (
                        <div className="relative w-24">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted text-xs">{currencySymbol}</span>
                          <input
                            type="number"
                            step="0.01"
                            value={customSplits[member.id] || ''}
                            onChange={(e) => setCustomSplits({ ...customSplits, [member.id]: e.target.value })}
                            placeholder="0.00"
                            className="w-full pl-6 pr-2 py-1 text-xs border border-border rounded-input bg-white text-primary"
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="p-5 border-t border-border">
              <button
                onClick={handleAddExpense}
                disabled={loading}
                className="w-full py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-input font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <><Loader size={16} className="animate-spin" /> Adding...</> : 'Add expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab content */}
      {activeTab === 'expenses' && (
        <div className="space-y-2">
          {expenses.length === 0 ? (
            <div className="bg-white border border-border rounded-card p-8 text-center space-y-3">
              <Receipt size={40} className="text-text-muted mx-auto" />
              <h3 className="text-lg font-bold text-primary">No expenses yet</h3>
              <p className="text-sm text-text-secondary">
                Start logging expenses as they happen — meals, transport, activities, anything.
              </p>
              <button
                onClick={() => { resetForm(); setShowAddForm(true) }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-input font-medium transition-colors"
              >
                <Plus size={16} /> Add first expense
              </button>
            </div>
          ) : (
            expenses.map(expense => {
              const cat = getCategoryInfo(expense.category)
              const payer = activeMembers.find(m => m.id === expense.paid_by)
              const payerName = payer
                ? (payer.id === currentMemberId ? 'You' : getMemberName(payer).split(' ')[0])
                : 'Unknown'
              const isMyExpense = expense.paid_by === currentMemberId
              const CatIcon = cat.icon

              return (
                <div
                  key={expense.id}
                  className="bg-white border border-border rounded-card p-4 flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cat.color}`}>
                    <CatIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{expense.description}</p>
                    <p className="text-xs text-text-secondary">
                      {payerName} paid · {format(new Date(expense.expense_date), 'MMM d')}
                      {expense.expense_splits.length > 0 && (
                        <> · split {expense.expense_splits.length} way{expense.expense_splits.length !== 1 ? 's' : ''}</>
                      )}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <p className="text-sm font-bold text-primary">
                      {currencySymbol}{expense.amount.toFixed(2)}
                    </p>
                    {(isMyExpense || trip.organiser_id === userId) && (
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={14} className="text-text-muted hover:text-red-600" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'balances' && (
        <div className="space-y-2">
          {activeMembers.map(member => {
            const balance = balances.get(member.id) || 0
            const isMe = member.id === currentMemberId
            const isPositive = balance > 0.01
            const isNegative = balance < -0.01

            return (
              <div
                key={member.id}
                className={`bg-white border rounded-card p-4 flex items-center gap-4 ${
                  isMe ? 'border-accent/30 bg-accent-light/30' : 'border-border'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  isMe ? 'bg-accent text-white' : 'bg-bg-soft text-text-secondary'
                }`}>
                  {getMemberInitials(member)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-primary">
                    {isMe ? `You (${getMemberName(member).split(' ')[0]})` : getMemberName(member)}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Paid {currencySymbol}
                    {expenses
                      .filter(e => e.paid_by === member.id)
                      .reduce((sum, e) => sum + e.amount, 0)
                      .toFixed(2)
                    } total
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${
                    isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-text-muted'
                  }`}>
                    {isPositive ? '+' : ''}{currencySymbol}{Math.abs(balance).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {isPositive ? 'is owed' : isNegative ? 'owes' : 'settled'}
                  </p>
                </div>
              </div>
            )
          })}

          {totalSpent === 0 && (
            <div className="bg-white border border-border rounded-card p-6 text-center">
              <p className="text-sm text-text-muted">Add some expenses to see balances</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settle' && (
        <div className="space-y-4">
          {settlements.length === 0 ? (
            <div className="bg-white border border-border rounded-card p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check size={28} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-primary">
                {totalSpent === 0 ? 'Nothing to settle yet' : 'All settled up!'}
              </h3>
              <p className="text-sm text-text-secondary">
                {totalSpent === 0
                  ? 'Once expenses are added, we\'ll calculate who owes whom.'
                  : 'Everyone is even — no transfers needed.'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white border border-border rounded-card p-5 space-y-1">
                <h3 className="text-base font-bold text-primary">
                  {settlements.length} transfer{settlements.length !== 1 ? 's' : ''} to settle up
                </h3>
                <p className="text-xs text-text-secondary">
                  We've calculated the minimum number of payments to square everyone off.
                </p>
              </div>

              {settlements.map((settlement, i) => {
                const fromMember = activeMembers.find(m => m.id === settlement.from)
                const toMember = activeMembers.find(m => m.id === settlement.to)
                if (!fromMember || !toMember) return null

                const fromName = fromMember.id === currentMemberId ? 'You' : getMemberName(fromMember).split(' ')[0]
                const toName = toMember.id === currentMemberId ? 'You' : getMemberName(toMember).split(' ')[0]

                return (
                  <div
                    key={i}
                    className="bg-white border border-border rounded-card p-4 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-xs font-bold text-red-600">
                      {getMemberInitials(fromMember)}
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold text-primary">
                        {currencySymbol}{settlement.amount.toFixed(2)}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-text-secondary">{fromName}</span>
                        <ArrowRight size={14} className="text-accent" />
                        <span className="text-xs text-text-secondary">{toName}</span>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-xs font-bold text-green-600">
                      {getMemberInitials(toMember)}
                    </div>
                  </div>
                )
              })}

              <div className="bg-amber-50 border border-amber-200 rounded-card p-4">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Tip:</strong> The person who owes money can send it via bank transfer, Monzo, or PayPal.
                  Once everyone's squared up, you're all done!
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
