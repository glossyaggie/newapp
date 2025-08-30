-- Check Database Contents
-- Run this in Supabase SQL Editor to see what's in your database

-- Check pass_types table
SELECT 'PASS_TYPES' as table_name, COUNT(*) as count FROM pass_types
UNION ALL
SELECT 'PASS_TYPES DETAILS' as table_name, COUNT(*) as count FROM pass_types WHERE price_amount_cents = 0
UNION ALL
SELECT 'CLASS_SCHEDULE' as table_name, COUNT(*) as count FROM class_schedule
UNION ALL
SELECT 'CLASS_BOOKINGS' as table_name, COUNT(*) as count FROM class_bookings
UNION ALL
SELECT 'PROFILES' as table_name, COUNT(*) as count FROM profiles;

-- Show all pass types with their prices
SELECT 
  id,
  name,
  kind,
  credits,
  duration_days,
  price_amount_cents,
  currency,
  active,
  sort_order
FROM pass_types 
ORDER BY sort_order;

-- Show all classes in schedule
SELECT 
  id,
  title,
  instructor,
  date,
  start_time,
  end_time,
  capacity,
  created_by
FROM class_schedule 
ORDER BY date, start_time
LIMIT 20;

-- Show all bookings
SELECT 
  cb.id,
  cb.user_id,
  cb.class_id,
  cb.status,
  cb.checked_in,
  p.fullname,
  cs.title as class_title,
  cs.date,
  cs.start_time
FROM class_bookings cb
JOIN profiles p ON cb.user_id = p.id
JOIN class_schedule cs ON cb.class_id = cs.id
ORDER BY cs.date, cs.start_time;
