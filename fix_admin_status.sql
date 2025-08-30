-- Check and fix admin status
-- Run this in Supabase SQL Editor

-- 1. Check your current role
SELECT 
  p.id,
  p.fullname,
  p.role,
  u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = auth.uid();

-- 2. Update your role to admin (if needed)
UPDATE profiles 
SET role = 'admin' 
WHERE id = auth.uid() 
  AND role != 'admin';

-- 3. Check your role again after update
SELECT 
  p.id,
  p.fullname,
  p.role,
  u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = auth.uid();

-- 4. Test the roster function now
SELECT * FROM get_class_roster('569b5312-3719-4599-8bde-0af02b5a9d34');
