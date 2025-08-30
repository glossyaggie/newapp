-- Check admin status and test roster function
-- Run this in Supabase SQL Editor

-- 1. Check if you're an admin
SELECT 
  p.id,
  p.fullname,
  p.role,
  u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = auth.uid();

-- 2. Test the roster function with the actual class ID
SELECT * FROM get_class_roster('569b5312-3719-4599-8bde-0af02b5a9d34');
