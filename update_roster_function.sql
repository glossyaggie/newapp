-- Update get_class_roster to exclude cancelled bookings
-- Run this in Supabase SQL Editor

-- Update the function to exclude cancelled bookings
CREATE OR REPLACE FUNCTION get_class_roster(class_id UUID)
RETURNS TABLE (
  booking_id UUID,
  user_name TEXT,
  user_email VARCHAR(255),
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
    COALESCE(cb.checked_in, false) as checked_in,
    cb.check_in_time,
    cb.check_in_method
  FROM class_bookings cb
  JOIN profiles p ON cb.user_id = p.id
  JOIN auth.users u ON cb.user_id = u.id
  WHERE cb.class_id = get_class_roster.class_id 
    AND cb.status = 'booked'  -- Only show confirmed bookings, not cancelled or waitlist
  ORDER BY p.fullname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
