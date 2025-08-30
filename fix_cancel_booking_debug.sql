-- Fixed cancel_booking RPC with better debugging
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_class_id UUID;
  v_class_date DATE;
  v_class_start_time TIME;
  v_class_datetime TIMESTAMP;
  v_two_hours_before TIMESTAMP;
  v_now TIMESTAMP;
  v_is_within_two_hours BOOLEAN;
  v_pass_id UUID;
  v_booking_status TEXT;
  v_waitlist_booking_id UUID;
  v_class_capacity INTEGER;
  v_booked_count INTEGER;
  v_old_credits INTEGER;
  v_new_credits INTEGER;
BEGIN
  -- Get the current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Get booking details
  SELECT 
    cb.class_id,
    cb.status,
    cs.date,
    cs.start_time,
    cs.capacity
  INTO v_class_id, v_booking_status, v_class_date, v_class_start_time, v_class_capacity
  FROM class_bookings cb
  JOIN class_schedule cs ON cb.class_id = cs.id
  WHERE cb.id = p_booking_id AND cb.user_id = v_user_id;
  
  IF v_class_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found or not authorized');
  END IF;
  
  -- Calculate if within 2 hours
  v_class_datetime := (v_class_date || ' ' || v_class_start_time)::TIMESTAMP;
  v_two_hours_before := v_class_datetime - INTERVAL '2 hours';
  v_now := NOW();
  v_is_within_two_hours := v_now > v_two_hours_before;
  
  -- Get the user's active pass (for refund)
  SELECT id, remaining_credits
  INTO v_pass_id, v_old_credits
  FROM user_passes
  WHERE user_id = v_user_id 
    AND is_active = true
    AND valid_until > NOW()
    AND (remaining_credits > 0 OR pass_type_id IN (SELECT id FROM pass_types WHERE kind = 'unlimited'))
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Update booking status to cancelled
  UPDATE class_bookings
  SET status = 'cancelled'
  WHERE id = p_booking_id;
  
  -- Refund credits only if not within 2 hours AND if it was a confirmed booking (not waitlist)
  IF NOT v_is_within_two_hours AND v_pass_id IS NOT NULL AND v_booking_status = 'booked' THEN
    UPDATE user_passes
    SET remaining_credits = remaining_credits + 1
    WHERE id = v_pass_id
    RETURNING remaining_credits INTO v_new_credits;
    
    -- Log the credit update for debugging
    RAISE NOTICE 'Pass %: Credits updated from % to %', v_pass_id, v_old_credits, v_new_credits;
  END IF;
  
  -- Handle waitlist promotion if this was a confirmed booking
  IF v_booking_status = 'booked' THEN
    -- Count current booked users
    SELECT COUNT(*)
    INTO v_booked_count
    FROM class_bookings
    WHERE class_id = v_class_id AND status = 'booked';
    
    -- If there's still capacity, promote the next person from waitlist
    IF v_booked_count < v_class_capacity THEN
      -- Get the next person on waitlist (get the booking ID first)
      SELECT id
      INTO v_waitlist_booking_id
      FROM class_bookings
      WHERE class_id = v_class_id AND status = 'waitlist'
      ORDER BY created_at ASC
      LIMIT 1;
      
      -- Promote them to booked status
      IF v_waitlist_booking_id IS NOT NULL THEN
        UPDATE class_bookings
        SET status = 'booked'
        WHERE id = v_waitlist_booking_id;
      END IF;
    END IF;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', CASE 
      WHEN v_is_within_two_hours THEN 'Booking cancelled. No credit refunded (within 2 hours of class)'
      WHEN v_booking_status = 'waitlist' THEN 'Waitlist position cancelled'
      ELSE 'Booking cancelled. Credit has been refunded to your pass'
    END,
    'refunded', NOT v_is_within_two_hours AND v_booking_status = 'booked',
    'was_waitlist', v_booking_status = 'waitlist',
    'pass_id', v_pass_id,
    'old_credits', v_old_credits,
    'new_credits', v_new_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
