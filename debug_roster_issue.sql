-- Debug why user is not showing in class roster
-- Run this in Supabase SQL Editor

-- 1. Check if the current user is an admin
SELECT 
  p.id,
  p.fullname,
  p.role,
  u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = auth.uid();

-- 2. Check all bookings for the specific HOT 60 class on Aug 31
SELECT 
  cb.id as booking_id,
  cb.status,
  cb.checked_in,
  cb.class_id,
  cs.title,
  cs.date,
  cs.start_time,
  p.fullname,
  p.role
FROM class_bookings cb
JOIN class_schedule cs ON cb.class_id = cs.id
JOIN profiles p ON cb.user_id = p.id
WHERE cs.title = 'HOT 60' 
  AND cs.date = '2025-08-31'
  AND cs.start_time = '16:00:00'
ORDER BY p.fullname;

-- 3. Check all bookings for Aug 31 (to see what classes you're actually booked into)
SELECT 
  cb.id as booking_id,
  cb.status,
  cb.checked_in,
  cs.title,
  cs.date,
  cs.start_time,
  p.fullname
FROM class_bookings cb
JOIN class_schedule cs ON cb.class_id = cs.id
JOIN profiles p ON cb.user_id = p.id
WHERE cs.date = '2025-08-31'
  AND cb.status != 'cancelled'
ORDER BY cs.start_time, p.fullname;

-- 4. Get the class ID for HOT 60 on Aug 31 at 16:00
SELECT 
  id,
  title,
  date,
  start_time
FROM class_schedule 
WHERE title = 'HOT 60' 
  AND date = '2025-08-31' 
  AND start_time = '16:00:00';

-- 5. Test the get_class_roster function with the actual class ID
-- (Replace 'CLASS_ID_HERE' with the actual class ID from step 4)
-- SELECT * FROM get_class_roster('CLASS_ID_HERE');
