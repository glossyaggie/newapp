-- Fix Check-in RPC Functions
-- Run this manually in Supabase SQL Editor

-- QR Code Check-in Functions
CREATE OR REPLACE FUNCTION check_in_with_qr(qr_code_text TEXT, user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_class_id UUID;
  v_booking_id UUID;
  v_expires_at TIMESTAMP;
  v_result JSON;
BEGIN
  -- Find the class for this QR code
  SELECT class_id, expires_at INTO v_class_id, v_expires_at
  FROM class_qr_codes 
  WHERE qr_code = qr_code_text AND expires_at > NOW()
  LIMIT 1;
  
  IF v_class_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired QR code');
  END IF;
  
  -- Find the user's booking for this class
  SELECT id INTO v_booking_id
  FROM class_bookings 
  WHERE user_id = check_in_with_qr.user_id 
    AND class_id = v_class_id 
    AND status = 'booked'
    AND checked_in = false;
  
  IF v_booking_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No active booking found for this class');
  END IF;
  
  -- Update the booking as checked in
  UPDATE class_bookings 
  SET checked_in = true, 
      check_in_time = NOW(), 
      check_in_method = 'qr'
  WHERE id = v_booking_id;
  
  RETURN json_build_object('success', true, 'message', 'Successfully checked in!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Generate QR code for a class
CREATE OR REPLACE FUNCTION generate_class_qr(class_id UUID)
RETURNS JSON AS $$
DECLARE
  v_qr_code TEXT;
  v_expires_at TIMESTAMP;
BEGIN
  -- Verify the user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Generate unique QR code
  v_qr_code := 'CLASS_' || class_id::TEXT || '_' || EXTRACT(EPOCH FROM NOW())::TEXT;
  
  -- Set expiration (15 minutes from now)
  v_expires_at := NOW() + INTERVAL '15 minutes';
  
  -- Insert the QR code
  INSERT INTO class_qr_codes (class_id, qr_code, expires_at)
  VALUES (class_id, v_qr_code, v_expires_at);
  
  RETURN json_build_object('success', true, 'qr_code', v_qr_code, 'expires_at', v_expires_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get class roster for check-in
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
    AND cb.status = 'booked'
  ORDER BY p.fullname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
