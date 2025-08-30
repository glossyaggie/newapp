-- Fix pass visibility issue
-- Run this in Supabase SQL Editor

-- First, let's see all your passes
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

-- Check what get_active_pass() currently returns
SELECT get_active_pass();

-- Check pass types to understand the structure
SELECT 
  id,
  name,
  kind,
  credits,
  active
FROM pass_types 
WHERE active = true
ORDER BY sort_order;

-- Fix: Update all user passes to be active and have proper status
UPDATE user_passes 
SET 
  is_active = true,
  status = 'active'
WHERE user_id = auth.uid() 
  AND valid_until > NOW()
  AND remaining_credits > 0;

-- Check again after the fix
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

-- Check what get_active_pass() returns after the fix
SELECT get_active_pass();
