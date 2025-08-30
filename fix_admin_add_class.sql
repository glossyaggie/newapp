-- Fix RLS policy to allow admins to add classes
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON class_schedule;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON class_schedule;
DROP POLICY IF EXISTS "Enable update for users based on email" ON class_schedule;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON class_schedule;

-- Create new policies that allow admins to add classes
CREATE POLICY "Enable read access for all users" ON class_schedule
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for admins" ON class_schedule
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Enable update for admins" ON class_schedule
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Enable delete for admins" ON class_schedule
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Test that you're an admin
SELECT 
  p.id,
  p.fullname,
  p.role,
  u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = auth.uid();
