-- Manual pass creation script
-- Run this in Supabase SQL Editor to create the missing pass

-- First, let's see what pass types are available
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

-- Get your user ID (replace with your actual user ID if needed)
SELECT auth.uid() as current_user_id;

-- Create the missing pass manually
-- Replace 'YOUR_USER_ID' with your actual user ID from the query above
-- Replace 'PASS_TYPE_ID' with the ID of the "5 Great Class Pass" from the first query

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
  auth.uid(), -- Your user ID
  pt.id,     -- Pass type ID
  pt.credits, -- Number of credits
  NOW(),     -- Valid from now
  NOW() + INTERVAL '1 day' * pt.duration_days, -- Valid until
  true,      -- Is active
  'active'   -- Status
FROM pass_types pt
WHERE pt.name ILIKE '%5 Great Class Pass%'
  AND pt.active = true
  AND NOT EXISTS (
    SELECT 1 FROM user_passes up 
    WHERE up.user_id = auth.uid() 
      AND up.pass_type_id = pt.id
      AND up.is_active = true
  );

-- Check if the pass was created
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

-- Test the get_active_pass function
SELECT get_active_pass();
