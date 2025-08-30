-- Test the get_class_roster function with the actual HOT 60 class ID
-- Run this in Supabase SQL Editor

-- Test the roster function with the actual class ID
SELECT * FROM get_class_roster('569b5312-3719-4599-8bde-0af02b5a9d34');

-- Also check what bookings exist for this specific class
SELECT 
  cb.id as booking_id,
  cb.status,
  cb.checked_in,
  cb.user_id,
  p.fullname,
  u.email
FROM class_bookings cb
JOIN profiles p ON cb.user_id = p.id
JOIN auth.users u ON cb.user_id = u.id
WHERE cb.class_id = '569b5312-3719-4599-8bde-0af02b5a9d34'
ORDER BY p.fullname;

-- Check if you're actually booked into this class
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
WHERE cb.user_id = auth.uid()
  AND cs.title = 'HOT 60'
  AND cs.date = '2025-08-31'
ORDER BY cs.start_time;

-- Check if you're an admin (this might be the issue)
SELECT 
  p.id,
  p.fullname,
  p.role,
  u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = auth.uid();
