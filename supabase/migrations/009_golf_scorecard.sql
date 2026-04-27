-- Golf Scorecard Feature
-- Rounds, players, and hole-by-hole scores for golf trips

-- A round of golf (e.g. "Day 1 - Vilamoura Old Course")
CREATE TABLE IF NOT EXISTS golf_rounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  round_date DATE NOT NULL,
  holes INTEGER NOT NULL DEFAULT 18 CHECK (holes IN (9, 18)),
  pars INTEGER[] NOT NULL, -- par for each hole, e.g. {4,3,5,4,4,3,5,4,4,4,3,5,4,4,3,5,4,4}
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Players in a round (links to trip members, stores handicap per round)
CREATE TABLE IF NOT EXISTS golf_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID NOT NULL REFERENCES golf_rounds(id) ON DELETE CASCADE,
  trip_member_id UUID REFERENCES trip_members(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  handicap INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scores: one row per player per hole
CREATE TABLE IF NOT EXISTS golf_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID NOT NULL REFERENCES golf_rounds(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES golf_players(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
  strokes INTEGER CHECK (strokes >= 1 AND strokes <= 20),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(round_id, player_id, hole_number)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_golf_rounds_trip ON golf_rounds(trip_id);
CREATE INDEX IF NOT EXISTS idx_golf_players_round ON golf_players(round_id);
CREATE INDEX IF NOT EXISTS idx_golf_scores_round ON golf_scores(round_id);
CREATE INDEX IF NOT EXISTS idx_golf_scores_player ON golf_scores(player_id);

-- RLS policies
ALTER TABLE golf_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_scores ENABLE ROW LEVEL SECURITY;

-- Anyone in the trip can view rounds/players/scores
CREATE POLICY "Trip members can view golf rounds" ON golf_rounds
  FOR SELECT USING (
    trip_id IN (SELECT trip_id FROM trip_members WHERE member_id = auth.uid())
  );

CREATE POLICY "Trip members can view golf players" ON golf_players
  FOR SELECT USING (
    round_id IN (SELECT id FROM golf_rounds WHERE trip_id IN (SELECT trip_id FROM trip_members WHERE member_id = auth.uid()))
  );

CREATE POLICY "Trip members can view golf scores" ON golf_scores
  FOR SELECT USING (
    round_id IN (SELECT id FROM golf_rounds WHERE trip_id IN (SELECT trip_id FROM trip_members WHERE member_id = auth.uid()))
  );

-- Any trip member can insert/update (so anyone can log scores)
CREATE POLICY "Trip members can manage golf rounds" ON golf_rounds
  FOR ALL USING (
    trip_id IN (SELECT trip_id FROM trip_members WHERE member_id = auth.uid())
  );

CREATE POLICY "Trip members can manage golf players" ON golf_players
  FOR ALL USING (
    round_id IN (SELECT id FROM golf_rounds WHERE trip_id IN (SELECT trip_id FROM trip_members WHERE member_id = auth.uid()))
  );

CREATE POLICY "Trip members can manage golf scores" ON golf_scores
  FOR ALL USING (
    round_id IN (SELECT id FROM golf_rounds WHERE trip_id IN (SELECT trip_id FROM trip_members WHERE member_id = auth.uid()))
  );
