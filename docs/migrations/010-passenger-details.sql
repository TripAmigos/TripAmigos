-- Migration: Passenger details for flight bookings (Duffel requirement)
-- Run this in Supabase SQL Editor

-- 1. Add passenger detail columns to trip_members
ALTER TABLE trip_members
  ADD COLUMN IF NOT EXISTS title TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT NULL;

COMMENT ON COLUMN trip_members.title IS 'Passenger title for airline booking: mr, mrs, ms, miss, dr';
COMMENT ON COLUMN trip_members.date_of_birth IS 'Date of birth in YYYY-MM-DD format for airline booking';
COMMENT ON COLUMN trip_members.gender IS 'Gender for airline booking: m or f';
COMMENT ON COLUMN trip_members.phone_number IS 'Phone number for airline contact / e-ticket delivery';

-- 2. Update the guest preferences RPC to accept passenger details
CREATE OR REPLACE FUNCTION submit_guest_preferences(
  p_token TEXT,
  p_guest_name TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_nationality TEXT DEFAULT NULL,
  p_preferred_airport TEXT DEFAULT NULL,
  p_budget_min INT DEFAULT NULL,
  p_budget_max INT DEFAULT NULL,
  p_preferred_destinations TEXT[] DEFAULT NULL,
  p_accommodation_type TEXT DEFAULT NULL,
  p_accommodation_rating_min INT DEFAULT NULL,
  p_transport_preference TEXT DEFAULT NULL,
  p_direct_flights_only BOOLEAN DEFAULT FALSE,
  p_flight_time_preference TEXT DEFAULT NULL,
  p_dealbreakers TEXT[] DEFAULT NULL,
  p_must_haves TEXT[] DEFAULT NULL,
  -- New passenger detail params
  p_title TEXT DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_phone_number TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_member RECORD;
BEGIN
  -- Find the trip member by invite token
  SELECT * INTO v_member FROM trip_members WHERE invite_token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite token';
  END IF;

  -- Update trip_members with guest info + passenger details
  UPDATE trip_members SET
    guest_name = p_guest_name,
    first_name = p_first_name,
    last_name = p_last_name,
    invite_status = 'accepted',
    title = p_title,
    date_of_birth = p_date_of_birth,
    gender = p_gender,
    phone_number = p_phone_number
  WHERE invite_token = p_token;

  -- Upsert member_preferences
  INSERT INTO member_preferences (
    trip_id, trip_member_id, nationality, preferred_airport,
    budget_min, budget_max, preferred_destinations,
    accommodation_type, accommodation_rating_min,
    transport_preference, direct_flights_only, flight_time_preference,
    dealbreakers, must_haves, submitted_at
  ) VALUES (
    v_member.trip_id, v_member.id, p_nationality, p_preferred_airport,
    p_budget_min, p_budget_max, p_preferred_destinations,
    p_accommodation_type, p_accommodation_rating_min,
    p_transport_preference, p_direct_flights_only, p_flight_time_preference,
    p_dealbreakers, p_must_haves, NOW()
  )
  ON CONFLICT (trip_member_id) DO UPDATE SET
    nationality = EXCLUDED.nationality,
    preferred_airport = EXCLUDED.preferred_airport,
    budget_min = EXCLUDED.budget_min,
    budget_max = EXCLUDED.budget_max,
    preferred_destinations = EXCLUDED.preferred_destinations,
    accommodation_type = EXCLUDED.accommodation_type,
    accommodation_rating_min = EXCLUDED.accommodation_rating_min,
    transport_preference = EXCLUDED.transport_preference,
    direct_flights_only = EXCLUDED.direct_flights_only,
    flight_time_preference = EXCLUDED.flight_time_preference,
    dealbreakers = EXCLUDED.dealbreakers,
    must_haves = EXCLUDED.must_haves,
    submitted_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
