-- Add cancel_booking RPC function
-- Run this in Supabase SQL Editor

-- Cancel booking function with 2-hour rule
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
  v_credits_to_refund INTEGER;
BEGIN
  -- Get the current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Get booking details
  SELECT 
    cb.class_id,
    cs.date,
    cs.start_time
  INTO v_class_id, v_class_date, v_class_start_time
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
  
  -- Get the user's active pass
  SELECT id, remaining_credits
  INTO v_pass_id, v_credits_to_refund
  FROM user_passes
  WHERE user_id = v_user_id AND valid_until > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Update booking status to cancelled
  UPDATE class_bookings
  SET status = 'cancelled'
  WHERE id = p_booking_id;
  
  -- Refund credits only if not within 2 hours
  IF NOT v_is_within_two_hours AND v_pass_id IS NOT NULL THEN
    UPDATE user_passes
    SET remaining_credits = remaining_credits + 1
    WHERE id = v_pass_id;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', CASE 
      WHEN v_is_within_two_hours THEN 'Booking cancelled. No credit refunded (within 2 hours of class)'
      ELSE 'Booking cancelled. Credit has been refunded to your pass'
    END,
    'refunded', NOT v_is_within_two_hours
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
