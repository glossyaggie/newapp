-- Create missing pass for user
-- Run this in Supabase SQL Editor

-- First, let's see what pass types exist
SELECT 
  id,
  name,
  kind,
  credits,
  duration_days,
  active
FROM pass_types 
WHERE active = true
ORDER BY sort_order;

-- Create the missing pass for the current user
INSERT INTO user_passes (
  user_id,
  pass_type_id,
  remaining_credits,
  valid_from,
  valid_until,
  is_active,
  status
)
SELECT 
  auth.uid(),
  pt.id,
  pt.credits,
  NOW(),
  NOW() + INTERVAL '1 day' * pt.duration_days,
  true,
  'active'
FROM pass_types pt
WHERE pt.name ILIKE '%5 Great Class Pass%'
  AND pt.active = true
  AND NOT EXISTS (
    SELECT 1 FROM user_passes up 
    WHERE up.user_id = auth.uid() 
      AND up.pass_type_id = pt.id
      AND up.remaining_credits > 0
  );

-- Check if it worked
SELECT 
  up.id,
  up.user_id,
  up.pass_type_id,
  up.remaining_credits,
  up.valid_from,
  up.valid_until,
  up.is_active,
  up.status,
  pt.name as pass_name
FROM user_passes up
JOIN pass_types pt ON up.pass_type_id = pt.id
WHERE up.user_id = auth.uid()
ORDER BY up.created_at DESC;

-- Test the function
SELECT get_active_pass();
