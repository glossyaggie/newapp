-- Fix book_class to handle cancelled bookings properly
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION book_class(p_class_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_class_record RECORD;
  v_booking_count INTEGER;
  v_user_booking_exists BOOLEAN;
  v_pass_record RECORD;
  v_booking_id UUID;
  v_booking_status booking_status;
  v_existing_booking_id UUID;
BEGIN
  -- Check if user exists and has signed waiver
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_user_id AND waiver_signed_at IS NOT NULL
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'waiver_required'
    );
  END IF;
  
  -- Get class details
  SELECT * INTO v_class_record
  FROM class_schedule
  WHERE id = p_class_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'class_not_found'
    );
  END IF;
  
  -- Check if class is in the past (with 5 min buffer)
  IF (v_class_record.date + v_class_record.start_time) < (NOW() + INTERVAL '5 minutes') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'class_started'
    );
  END IF;
  
  -- Check if user already has an active booking for this class (not cancelled)
  SELECT EXISTS(
    SELECT 1 FROM class_bookings
    WHERE user_id = v_user_id 
      AND class_id = p_class_id 
      AND status IN ('booked', 'waitlist')
  ) INTO v_user_booking_exists;
  
  IF v_user_booking_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'already_booked'
    );
  END IF;
  
  -- Check current booking count
  SELECT COUNT(*) INTO v_booking_count
  FROM class_bookings
  WHERE class_id = p_class_id AND status = 'booked';
  
  -- Get user's active pass (same logic as get_active_pass)
  SELECT up.*, pt.kind INTO v_pass_record
  FROM user_passes up
  JOIN pass_types pt ON up.pass_type_id = pt.id
  WHERE up.user_id = v_user_id
    AND up.valid_until > NOW()
    AND up.remaining_credits > 0
    AND pt.active = true
  ORDER BY up.created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'no_credits'
    );
  END IF;
  
  -- Determine booking status based on capacity
  IF v_booking_count >= v_class_record.capacity THEN
    v_booking_status := 'waitlist'::booking_status;
  ELSE
    v_booking_status := 'booked'::booking_status;
  END IF;
  
  -- Check if there's a cancelled booking for this user/class and update it instead of creating new
  SELECT id INTO v_existing_booking_id
  FROM class_bookings
  WHERE user_id = v_user_id 
    AND class_id = p_class_id 
    AND status = 'cancelled';
  
  IF v_existing_booking_id IS NOT NULL THEN
    -- Update the existing cancelled booking
    UPDATE class_bookings
    SET 
      status = v_booking_status,
      consumed_pass_id = v_pass_record.id,
      updated_at = NOW()
    WHERE id = v_existing_booking_id
    RETURNING id INTO v_booking_id;
  ELSE
    -- Create a new booking
    INSERT INTO class_bookings (
      user_id,
      class_id,
      status,
      consumed_pass_id
    ) VALUES (
      v_user_id,
      p_class_id,
      v_booking_status,
      v_pass_record.id
    ) RETURNING id INTO v_booking_id;
  END IF;
  
  -- Deduct credit if it's a confirmed booking (not waitlist)
  IF v_booking_status = 'booked' THEN
    UPDATE user_passes
    SET remaining_credits = remaining_credits - 1
    WHERE id = v_pass_record.id;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'status', v_booking_status,
    'message', CASE 
      WHEN v_booking_status = 'waitlist' THEN 'Added to waitlist'
      ELSE 'Class booked successfully'
    END
  );
END;
$$;
