-- Fix get_class_roster function to show all active bookings
-- Run this in Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS get_class_roster(UUID);

-- Create a more inclusive version that shows all active bookings
CREATE OR REPLACE FUNCTION get_class_roster(class_id UUID)
RETURNS TABLE (
  booking_id UUID,
  user_name TEXT,
  user_email TEXT,
  checked_in BOOLEAN,
  check_in_time TIMESTAMP,
  check_in_method TEXT,
  booking_status TEXT
) AS $$
BEGIN
  -- Verify the user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE NOTICE 'User is not an admin: %', auth.uid();
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    cb.id as booking_id,
    p.fullname as user_name,
    u.email as user_email,
    cb.checked_in,
    cb.check_in_time,
    cb.check_in_method,
    cb.status::TEXT as booking_status
  FROM class_bookings cb
  JOIN profiles p ON cb.user_id = p.id
  JOIN auth.users u ON cb.user_id = u.id
  JOIN class_schedule cs ON cb.class_id = cs.id
  WHERE cb.class_id = get_class_roster.class_id 
    AND cb.status != 'cancelled'  -- Only exclude cancelled bookings
  ORDER BY p.fullname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
-- Replace 'CLASS_ID_HERE' with an actual class ID
-- SELECT * FROM get_class_roster('CLASS_ID_HERE');

-- Add a comment to document the function
COMMENT ON FUNCTION get_class_roster(UUID) IS 'Returns roster for class check-in, excluding only cancelled bookings';
