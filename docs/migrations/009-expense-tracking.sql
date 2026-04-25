-- Migration: Expense tracking (Splitwise-style)
-- Run this in Supabase SQL Editor

-- 1. Trip expenses — each row is one expense logged by someone
CREATE TABLE IF NOT EXISTS trip_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'GBP',
  category TEXT DEFAULT 'other',
  expense_date DATE DEFAULT CURRENT_DATE,
  split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Expense splits — how each expense is divided among members
CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES trip_expenses(id) ON DELETE CASCADE,
  trip_member_id UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  amount_owed DECIMAL(10,2) NOT NULL CHECK (amount_owed >= 0),
  is_settled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(expense_id, trip_member_id)
);

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip_id ON trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_paid_by ON trip_expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_member_id ON expense_splits(trip_member_id);

-- 4. RLS policies
ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- Trip expenses: anyone who is a member of the trip can read/insert/update/delete
CREATE POLICY "Trip members can view expenses" ON trip_expenses
  FOR SELECT USING (
    trip_id IN (
      SELECT trip_id FROM trip_members WHERE member_id = auth.uid()
    )
  );

CREATE POLICY "Trip members can add expenses" ON trip_expenses
  FOR INSERT WITH CHECK (
    trip_id IN (
      SELECT trip_id FROM trip_members WHERE member_id = auth.uid()
    )
  );

CREATE POLICY "Expense creator can update" ON trip_expenses
  FOR UPDATE USING (
    paid_by IN (
      SELECT id FROM trip_members WHERE member_id = auth.uid()
    )
  );

CREATE POLICY "Expense creator or organiser can delete" ON trip_expenses
  FOR DELETE USING (
    paid_by IN (SELECT id FROM trip_members WHERE member_id = auth.uid())
    OR trip_id IN (SELECT id FROM trips WHERE organiser_id = auth.uid())
  );

-- Expense splits: same trip membership check
CREATE POLICY "Trip members can view splits" ON expense_splits
  FOR SELECT USING (
    expense_id IN (
      SELECT id FROM trip_expenses WHERE trip_id IN (
        SELECT trip_id FROM trip_members WHERE member_id = auth.uid()
      )
    )
  );

CREATE POLICY "Trip members can add splits" ON expense_splits
  FOR INSERT WITH CHECK (
    expense_id IN (
      SELECT id FROM trip_expenses WHERE trip_id IN (
        SELECT trip_id FROM trip_members WHERE member_id = auth.uid()
      )
    )
  );

CREATE POLICY "Trip members can update splits" ON expense_splits
  FOR UPDATE USING (
    expense_id IN (
      SELECT id FROM trip_expenses WHERE trip_id IN (
        SELECT trip_id FROM trip_members WHERE member_id = auth.uid()
      )
    )
  );

CREATE POLICY "Trip members can delete splits" ON expense_splits
  FOR DELETE USING (
    expense_id IN (
      SELECT id FROM trip_expenses WHERE trip_id IN (
        SELECT trip_id FROM trip_members WHERE member_id = auth.uid()
      )
    )
  );

COMMENT ON TABLE trip_expenses IS 'Individual expenses logged by trip members';
COMMENT ON TABLE expense_splits IS 'How each expense is split among members';
COMMENT ON COLUMN trip_expenses.split_type IS 'equal = split evenly among all selected members, custom = manual amounts per person';
COMMENT ON COLUMN trip_expenses.category IS 'food, drinks, transport, activities, accommodation, shopping, other';
