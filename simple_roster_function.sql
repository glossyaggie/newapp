-- Simple roster function that shows all booked students
-- Run this in Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS get_class_roster(UUID);

-- Create a simple version that shows all booked students
CREATE OR REPLACE FUNCTION get_class_roster(class_id UUID)
RETURNS TABLE (
  booking_id UUID,
  user_name TEXT,
  user_email CHARACTER VARYING(255),
  checked_in BOOLEAN,
  check_in_time TIMESTAMP,
  check_in_method TEXT
) AS $$
BEGIN
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
    AND cb.status = 'booked'  -- Only show booked students
  ORDER BY p.fullname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test it
SELECT * FROM get_class_roster('569b5312-3719-4599-8bde-0af02b5a9d34');
