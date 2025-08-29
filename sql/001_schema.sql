-- Hot Temple Database Schema
-- Run this first to create all tables and types

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE pass_kind AS ENUM ('pack', 'unlimited');
CREATE TYPE pass_status AS ENUM ('active', 'exhausted', 'expired');
CREATE TYPE booking_status AS ENUM ('booked', 'cancelled', 'attended', 'no_show', 'waitlist');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  fullname TEXT,
  phone TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  waiver_signed_at TIMESTAMPTZ,
  waiver_signature_data TEXT, -- Base64 signature image
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Pass types (catalog of available passes)
CREATE TABLE pass_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  kind pass_kind NOT NULL,
  credits INTEGER, -- NULL for unlimited passes
  duration_days INTEGER NOT NULL,
  stripe_price_id TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User passes (purchased passes with remaining credits)
CREATE TABLE user_passes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pass_type_id UUID NOT NULL REFERENCES pass_types(id) ON DELETE CASCADE,
  remaining_credits INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  status pass_status DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure credits never go negative
  CONSTRAINT user_passes_credits_check CHECK (remaining_credits >= 0)
);

-- Class schedule
CREATE TABLE class_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  instructor TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 20,
  duration_min INTEGER NOT NULL,
  heat_c INTEGER,
  level TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Class bookings
CREATE TABLE class_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES class_schedule(id) ON DELETE CASCADE,
  status booking_status DEFAULT 'booked' NOT NULL,
  booked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  consumed_pass_id UUID REFERENCES user_passes(id),
  
  -- Prevent duplicate bookings
  UNIQUE(user_id, class_id)
);

-- Pass purchases (Stripe transaction log)
CREATE TABLE pass_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pass_type_id UUID NOT NULL REFERENCES pass_types(id),
  stripe_session_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Stripe webhook log (for idempotency)
CREATE TABLE stripe_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Favorites (optional)
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES class_schedule(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, class_id)
);

-- Device tokens for push notifications (optional)
CREATE TABLE device_tokens (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  PRIMARY KEY(user_id, token)
);

-- Indexes for performance
CREATE INDEX idx_user_passes_user_id ON user_passes(user_id);
CREATE INDEX idx_user_passes_active ON user_passes(user_id, is_active, valid_until);
CREATE INDEX idx_class_schedule_date ON class_schedule(date);
CREATE INDEX idx_class_bookings_user_id ON class_bookings(user_id);
CREATE INDEX idx_class_bookings_class_id ON class_bookings(class_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- Insert some default pass types
INSERT INTO pass_types (name, kind, credits, duration_days, stripe_price_id, sort_order) VALUES
  ('Single Class', 'pack', 1, 30, 'price_single_class', 1),
  ('8-Class Pack', 'pack', 8, 90, 'price_8_class_pack', 2),
  ('16-Class Pack', 'pack', 16, 120, 'price_16_class_pack', 3),
  ('Unlimited Monthly', 'unlimited', NULL, 30, 'price_unlimited_monthly', 4);

-- Create a trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO profiles (id, first_name, last_name, fullname, phone)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();