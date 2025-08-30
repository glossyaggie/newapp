-- Add monthly_goal column to profiles table
-- Run this in Supabase SQL Editor

-- Add monthly_goal column with default value of 25
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS monthly_goal INTEGER DEFAULT 25;

-- Update existing profiles to have the default goal if they don't have one
UPDATE profiles 
SET monthly_goal = 25 
WHERE monthly_goal IS NULL;

-- Add a check constraint to ensure reasonable goal values
-- Note: We'll handle the case where constraint might already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'monthly_goal_check' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT monthly_goal_check 
        CHECK (monthly_goal >= 1 AND monthly_goal <= 100);
    END IF;
END $$;

-- Refresh schema cache
COMMENT ON TABLE profiles IS 'User profiles with monthly goals';
