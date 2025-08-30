-- Simple setup - skip types that already exist
-- Run this in Supabase SQL Editor

-- Create tables (skip if they exist)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  fullname TEXT,
  phone TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  waiver_signed_at TIMESTAMPTZ,
  waiver_signature_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pass_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kind pass_kind NOT NULL,
  credits INTEGER,
  duration_days INTEGER NOT NULL,
  stripe_price_id TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  price_amount_cents INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'aud',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS user_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pass_type_id UUID NOT NULL REFERENCES pass_types(id) ON DELETE CASCADE,
  remaining_credits INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  status pass_status DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Clear and insert pass types
DELETE FROM pass_types;
INSERT INTO pass_types (name, kind, credits, duration_days, stripe_price_id, sort_order, price_amount_cents) VALUES
  ('5-Class Pack', 'pack', 5, 90, 'price_1S0vfBARpqh0Ut1ybKjeqehJ', 1, 5000),
  ('10-Class Pack', 'pack', 10, 120, 'price_1S0rHLARpqh0Ut1ybWGa3ocf', 2, 9000),
  ('Monthly Unlimited', 'unlimited', NULL, 30, 'price_1S0rJlARpqh0Ut1yaeBEQVRf', 3, 10000);

-- Create RPC function
CREATE OR REPLACE FUNCTION get_active_pass()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'remaining_credits', up.remaining_credits,
    'valid_until', up.valid_until,
    'is_unlimited', pt.kind = 'unlimited',
    'pass_name', pt.name
  )
  INTO result
  FROM user_passes up
  JOIN pass_types pt ON up.pass_type_id = pt.id
  WHERE up.user_id = auth.uid()
    AND up.is_active = true
    AND up.valid_until > NOW()
    AND (up.remaining_credits > 0 OR pt.kind = 'unlimited')
  ORDER BY up.valid_until ASC
  LIMIT 1;
  
  RETURN result;
END;
$$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pass_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_passes ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view active pass types" ON pass_types;
DROP POLICY IF EXISTS "Users can view own passes" ON user_passes;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Anyone can view active pass types" ON pass_types FOR SELECT USING (active = true);
CREATE POLICY "Users can view own passes" ON user_passes FOR SELECT USING (auth.uid() = user_id);
