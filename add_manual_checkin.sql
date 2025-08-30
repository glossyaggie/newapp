-- Add missing manual_check_in function
-- Run this in Supabase SQL Editor

-- Manual check-in function for teachers
CREATE OR REPLACE FUNCTION manual_check_in(booking_id UUID, check_in_status BOOLEAN)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verify the user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Get the booking
  SELECT user_id INTO v_user_id
  FROM class_bookings 
  WHERE id = booking_id;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;
  
  -- Update the booking
  UPDATE class_bookings 
  SET checked_in = check_in_status,
      check_in_time = CASE WHEN check_in_status THEN NOW() ELSE NULL END,
      check_in_method = CASE WHEN check_in_status THEN 'manual' ELSE NULL END
  WHERE id = booking_id;
  
  RETURN json_build_object('success', true, 'message', 'Check-in status updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function (optional)
-- SELECT * FROM manual_check_in('your-booking-id-here', true);
