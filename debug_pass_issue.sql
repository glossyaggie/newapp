-- Debug script to check user_passes table
-- Run this in Supabase SQL Editor to see what's happening

-- Check current user's passes
SELECT 
  id,
  user_id,
  pass_type_id,
  remaining_credits,
  valid_from,
  valid_until,
  is_active,
  status,
  created_at
FROM user_passes 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- Check what get_active_pass() returns
SELECT get_active_pass();

-- Check recent class bookings for the user
SELECT 
  cb.id,
  cb.class_id,
  cb.status,
  cb.booked_at,
  cs.title,
  cs.date,
  cs.start_time
FROM class_bookings cb
JOIN class_schedule cs ON cb.class_id = cs.id
WHERE cb.user_id = auth.uid()
ORDER BY cb.booked_at DESC
LIMIT 10;
