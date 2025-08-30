-- Check for cancelled bookings and verify roster function
-- Run this in Supabase SQL Editor

-- Check all bookings for the current user
SELECT 
  cb.id as booking_id,
  cb.status,
  cb.checked_in,
  cb.check_in_time,
  cs.title as class_title,
  cs.date,
  cs.start_time,
  p.fullname as user_name
FROM class_bookings cb
JOIN class_schedule cs ON cb.class_id = cs.id
JOIN profiles p ON cb.user_id = p.id
WHERE cb.user_id = auth.uid()
ORDER BY cs.date DESC, cs.start_time DESC;

-- Check what the get_class_roster function returns for a specific class
-- Replace 'your-class-id-here' with an actual class ID from above
-- SELECT * FROM get_class_roster('your-class-id-here');

-- Check if there are any bookings with status 'cancelled' that might be causing issues
SELECT 
  COUNT(*) as cancelled_bookings_count,
  COUNT(CASE WHEN checked_in = true THEN 1 END) as cancelled_but_checked_in
FROM class_bookings 
WHERE status = 'cancelled';

-- Verify the get_class_roster function filters correctly
-- This should return 0 rows for cancelled bookings
SELECT 
  cb.id,
  cb.status,
  p.fullname
FROM class_bookings cb
JOIN profiles p ON cb.user_id = p.id
WHERE cb.status = 'cancelled' 
  AND cb.class_id IN (
    SELECT id FROM class_schedule 
    WHERE date = CURRENT_DATE
  );
