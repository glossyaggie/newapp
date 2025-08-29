-- Seed data for The Hot Temple app
-- Run this in your Supabase SQL editor

-- Insert pass types
INSERT INTO pass_types (name, kind, credits, duration_days, stripe_price_id, active, sort_order) VALUES
('8-Class Pack', 'pack', 8, 60, 'price_8_class_pack_test', true, 1),
('16-Class Pack', 'pack', 16, 90, 'price_16_class_pack_test', true, 2),
('Unlimited Monthly', 'unlimited', null, 30, 'price_unlimited_monthly_test', true, 3),
('Drop-in Class', 'pack', 1, 7, 'price_drop_in_test', true, 4)
ON CONFLICT (stripe_price_id) DO NOTHING;

-- Insert some sample classes for this week
INSERT INTO class_schedule (title, instructor, date, start_time, end_time, capacity, duration_min, heat_c, level, notes, created_by) VALUES
-- Today's classes
('Hot 26', 'Sarah Johnson', CURRENT_DATE, '06:30', '08:00', 25, 90, 40, 'All Levels', 'Traditional Bikram sequence in heated room', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Vinyasa Flow', 'Mike Chen', CURRENT_DATE, '09:00', '10:15', 20, 75, 32, 'Intermediate', 'Dynamic flow with creative sequences', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Yin & Restore', 'Emma Wilson', CURRENT_DATE, '18:00', '19:15', 15, 75, 28, 'All Levels', 'Gentle poses held for longer periods', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Hot Power', 'David Rodriguez', CURRENT_DATE, '19:30', '20:45', 22, 75, 38, 'Advanced', 'Challenging power yoga in heated room', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

-- Tomorrow's classes
('Morning Flow', 'Sarah Johnson', CURRENT_DATE + INTERVAL '1 day', '07:00', '08:15', 20, 75, 30, 'All Levels', 'Energizing morning practice', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Hot 26', 'Lisa Park', CURRENT_DATE + INTERVAL '1 day', '09:30', '11:00', 25, 90, 40, 'All Levels', 'Traditional Bikram sequence', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Sculpt & Burn', 'Mike Chen', CURRENT_DATE + INTERVAL '1 day', '12:00', '13:00', 18, 60, 35, 'Intermediate', 'Yoga with light weights', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Candlelight Yin', 'Emma Wilson', CURRENT_DATE + INTERVAL '1 day', '20:00', '21:15', 15, 75, 26, 'All Levels', 'Relaxing practice by candlelight', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

-- Day after tomorrow
('Sunrise Flow', 'David Rodriguez', CURRENT_DATE + INTERVAL '2 days', '06:00', '07:15', 20, 75, 32, 'All Levels', 'Start your day with intention', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Hot Fusion', 'Sarah Johnson', CURRENT_DATE + INTERVAL '2 days', '10:00', '11:30', 22, 90, 38, 'Intermediate', 'Mix of styles in heated room', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Beginner Basics', 'Lisa Park', CURRENT_DATE + INTERVAL '2 days', '17:00', '18:15', 15, 75, 28, 'Beginner', 'Perfect for new students', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('Hot 26', 'Mike Chen', CURRENT_DATE + INTERVAL '2 days', '19:00', '20:30', 25, 90, 40, 'All Levels', 'Evening traditional practice', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Create an admin user (you'll need to sign up first, then update this)
-- Replace 'your-user-id-here' with your actual user ID from auth.users
-- UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id-here';

-- Optional: Add a test pass for your user (replace user ID)
-- INSERT INTO user_passes (user_id, pass_type_id, remaining_credits, valid_from, valid_until, is_active, status)
-- VALUES (
--   'your-user-id-here',
--   (SELECT id FROM pass_types WHERE name = '8-Class Pack' LIMIT 1),
--   8,
--   CURRENT_DATE,
--   CURRENT_DATE + INTERVAL '60 days',
--   true,
--   'active'
-- );