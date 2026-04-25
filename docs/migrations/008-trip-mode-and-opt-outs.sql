-- Migration: Trip mode, date options, and attendee opt-outs
-- Run this in Supabase SQL Editor

-- 1. Add trip_mode to trips table (collaborative = group votes, organiser_decides = no voting)
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS trip_mode TEXT DEFAULT 'collaborative',
  ADD COLUMN IF NOT EXISTS date_options JSONB DEFAULT NULL;

-- 2. Add opt-out flags to member_preferences (attendees can skip flights or hotel)
ALTER TABLE member_preferences
  ADD COLUMN IF NOT EXISTS needs_flights BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS needs_hotel BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS passport_confirmed BOOLEAN DEFAULT FALSE;

-- 3. Add passport_confirmed to trip_members too (for guest submissions)
ALTER TABLE trip_members
  ADD COLUMN IF NOT EXISTS passport_confirmed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN trips.trip_mode IS 'collaborative = group votes on destinations/dates, organiser_decides = organiser picks everything';
COMMENT ON COLUMN trips.date_options IS 'JSON array of {start, end} date options for attendees to vote on';
COMMENT ON COLUMN member_preferences.needs_flights IS 'Whether this attendee wants flights booked for them';
COMMENT ON COLUMN member_preferences.needs_hotel IS 'Whether this attendee wants hotel booked for them';
COMMENT ON COLUMN member_preferences.passport_confirmed IS 'Attendee confirmed their name matches passport';
