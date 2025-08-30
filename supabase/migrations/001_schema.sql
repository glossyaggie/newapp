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

-- Waiver documents (for admin to upload and manage waivers)
CREATE TABLE waiver_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- The waiver text content
  file_url TEXT, -- Optional: URL to PDF/image file
  is_active BOOLEAN DEFAULT false NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_user_passes_user_id ON user_passes(user_id);
CREATE INDEX idx_user_passes_active ON user_passes(user_id, is_active, valid_until);
CREATE INDEX idx_class_schedule_date ON class_schedule(date);
CREATE INDEX idx_class_bookings_user_id ON class_bookings(user_id);
CREATE INDEX idx_class_bookings_class_id ON class_bookings(class_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- Insert some default pass types with actual Stripe Price IDs
INSERT INTO pass_types (name, kind, credits, duration_days, stripe_price_id, sort_order, active) VALUES
  ('Single Class', 'pack', 1, 30, 'price_1S0r9bARpqh0Ut1y4lHGGuAT', 1, true),
  ('5-Class Pack', 'pack', 5, 90, 'price_1S0vfBARpqh0Ut1ybKjeqehJ', 2, true),
  ('10-Class Pack', 'pack', 10, 120, 'price_1S0rHLARpqh0Ut1ybWGa3ocf', 3, true),
  ('25-Class Pack', 'pack', 25, 180, 'price_1S0rHqARpqh0Ut1ygGGaoqac', 4, true),
  ('Weekly Unlimited', 'unlimited', NULL, 7, 'price_1S0rIRARpqh0Ut1yQkmz18xc', 5, true),
  ('Monthly Unlimited', 'unlimited', NULL, 30, 'price_1S0rJlARpqh0Ut1yaeBEQVRf', 6, true),
  ('VIP Monthly', 'unlimited', NULL, 30, 'price_1S0rKbARpqh0Ut1ydYwnH2Zy', 7, true),
  ('VIP Yearly', 'unlimited', NULL, 365, 'price_1S0rLOARpqh0Ut1y2lbJ17g7', 8, true);

-- Create a trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, fullname, phone)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();