-- Row Level Security Policies
-- Run this after 001_schema.sql

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pass_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pass_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Profiles: users can manage their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Pass types: everyone can read active ones
CREATE POLICY "Anyone can view active pass types" ON pass_types
  FOR SELECT USING (active = true);

-- User passes: users can only see their own
CREATE POLICY "Users can view own passes" ON user_passes
  FOR SELECT USING (auth.uid() = user_id);

-- Class schedule: everyone can read
CREATE POLICY "Anyone can view class schedule" ON class_schedule
  FOR SELECT USING (true);

-- Class bookings: users can only see their own
CREATE POLICY "Users can view own bookings" ON class_bookings
  FOR SELECT USING (auth.uid() = user_id);

-- Pass purchases: users can only see their own
CREATE POLICY "Users can view own purchases" ON pass_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Favorites: users can manage their own
CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- Device tokens: users can manage their own
CREATE POLICY "Users can manage own device tokens" ON device_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Admin policies (for users with admin role)
-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin can manage class schedule
CREATE POLICY "Admins can manage class schedule" ON class_schedule
  FOR ALL USING (is_admin());

-- Admin can view all bookings
CREATE POLICY "Admins can view all bookings" ON class_bookings
  FOR SELECT USING (is_admin());

-- Admin can update booking status (for attendance)
CREATE POLICY "Admins can update booking status" ON class_bookings
  FOR UPDATE USING (is_admin());

-- Admin can view all user passes
CREATE POLICY "Admins can view all passes" ON user_passes
  FOR SELECT USING (is_admin());

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- Stripe webhooks: only service role can access
CREATE POLICY "Service role can manage webhooks" ON stripe_webhooks
  FOR ALL USING (auth.role() = 'service_role');

-- Pass purchases: service role can insert (from webhooks)
CREATE POLICY "Service role can insert purchases" ON pass_purchases
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- User passes: service role can manage (from webhooks and RPCs)
CREATE POLICY "Service role can manage passes" ON user_passes
  FOR ALL USING (auth.role() = 'service_role');

-- Class bookings: service role can manage (from RPCs)
CREATE POLICY "Service role can manage bookings" ON class_bookings
  FOR ALL USING (auth.role() = 'service_role');