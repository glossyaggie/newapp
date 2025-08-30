-- Fix get_class_roster to ensure cancelled bookings are excluded
-- Run this in Supabase SQL Editor

-- First, let's check if there are any cancelled bookings that might be causing issues
SELECT 
  cb.id,
  cb.status,
  cb.checked_in,
  cs.title as class_title,
  p.fullname as user_name
FROM class_bookings cb
JOIN class_schedule cs ON cb.class_id = cs.id
JOIN profiles p ON cb.user_id = p.id
WHERE cb.status = 'cancelled'
  AND cs.date >= CURRENT_DATE
ORDER BY cs.date, cs.start_time;

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_class_roster(UUID);

-- Now create the updated function
CREATE OR REPLACE FUNCTION get_class_roster(class_id UUID)
RETURNS TABLE (
  booking_id UUID,
  user_name TEXT,
  user_email TEXT,
  checked_in BOOLEAN,
  check_in_time TIMESTAMP,
  check_in_method TEXT
) AS $$
BEGIN
  -- Verify the user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    cb.id as booking_id,
    p.fullname as user_name,
    u.email as user_email,
    cb.checked_in,
    cb.check_in_time,
    cb.check_in_method
  FROM class_bookings cb
  JOIN profiles p ON cb.user_id = p.id
  JOIN auth.users u ON cb.user_id = u.id
  WHERE cb.class_id = get_class_roster.class_id 
    AND cb.status = 'booked'  -- Only show booked classes
  ORDER BY p.fullname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function with a specific class
-- Replace 'your-class-id-here' with an actual class ID
-- SELECT * FROM get_class_roster('your-class-id-here');

-- Also, let's ensure any cancelled bookings are properly marked
-- This will fix any bookings that might have been cancelled but still show as checked in
UPDATE class_bookings 
SET checked_in = false,
    check_in_time = NULL,
    check_in_method = NULL
WHERE status = 'cancelled' 
  AND checked_in = true;

-- Add a comment to document the function
COMMENT ON FUNCTION get_class_roster(UUID) IS 'Returns roster for class check-in, excluding cancelled and waitlist bookings';
