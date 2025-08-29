-- Remote Procedure Calls (RPCs)
-- Run this after 001_schema.sql and 002_rls.sql

-- Function to get user's active pass
CREATE OR REPLACE FUNCTION get_active_pass()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'remaining_credits', up.remaining_credits,
    'valid_until', up.valid_until,
    'is_unlimited', pt.kind = 'unlimited',
    'pass_name', pt.name
  )
  INTO result
  FROM user_passes up
  JOIN pass_types pt ON up.pass_type_id = pt.id
  WHERE up.user_id = auth.uid()
    AND up.is_active = true
    AND up.valid_until > NOW()
    AND (up.remaining_credits > 0 OR pt.kind = 'unlimited')
  ORDER BY up.valid_until ASC
  LIMIT 1;
  
  RETURN result;
END;
$$;

-- Function to book a class
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
  v_new_balance INTEGER;
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
  
  -- Lock and get class details
  SELECT * INTO v_class_record
  FROM class_schedule
  WHERE id = p_class_id
  FOR UPDATE;
  
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
  
  -- Check if user already booked this class
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
  
  -- Get user's active pass (soonest expiring first)
  SELECT up.*, pt.kind INTO v_pass_record
  FROM user_passes up
  JOIN pass_types pt ON up.pass_type_id = pt.id
  WHERE up.user_id = v_user_id
    AND up.is_active = true
    AND up.valid_until > NOW()
    AND (up.remaining_credits > 0 OR pt.kind = 'unlimited')
  ORDER BY up.valid_until ASC
  LIMIT 1
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'no_credits'
    );
  END IF;
  
  -- Determine booking status based on capacity
  DECLARE
    v_booking_status booking_status;
  BEGIN
    IF v_booking_count >= v_class_record.capacity THEN
      v_booking_status := 'waitlist';
    ELSE
      v_booking_status := 'booked';
    END IF;
  END;
  
  -- Create booking
  INSERT INTO class_bookings (user_id, class_id, status, consumed_pass_id)
  VALUES (v_user_id, p_class_id, v_booking_status, v_pass_record.id)
  RETURNING id INTO v_booking_id;
  
  -- Deduct credit (skip for unlimited passes or waitlist)
  IF v_pass_record.kind = 'pack' AND v_booking_status = 'booked' THEN
    UPDATE user_passes
    SET remaining_credits = remaining_credits - 1
    WHERE id = v_pass_record.id;
    
    v_new_balance := v_pass_record.remaining_credits - 1;
    
    -- Deactivate pass if exhausted
    IF v_new_balance = 0 THEN
      UPDATE user_passes
      SET is_active = false, status = 'exhausted'
      WHERE id = v_pass_record.id;
    END IF;
  ELSE
    v_new_balance := v_pass_record.remaining_credits;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'new_balance', v_new_balance,
    'status', v_booking_status
  );
END;
$$;

-- Function to cancel a booking
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_booking_record RECORD;
  v_class_record RECORD;
  v_pass_record RECORD;
  v_new_balance INTEGER;
BEGIN
  -- Get booking details
  SELECT * INTO v_booking_record
  FROM class_bookings
  WHERE id = p_booking_id AND user_id = v_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'booking_not_found'
    );
  END IF;
  
  IF v_booking_record.status != 'booked' AND v_booking_record.status != 'waitlist' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'cannot_cancel'
    );
  END IF;
  
  -- Get class details
  SELECT * INTO v_class_record
  FROM class_schedule
  WHERE id = v_booking_record.class_id;
  
  -- Check cancellation cutoff (2 hours before class)
  IF (v_class_record.date + v_class_record.start_time) < (NOW() + INTERVAL '2 hours') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'too_late'
    );
  END IF;
  
  -- Cancel the booking
  UPDATE class_bookings
  SET status = 'cancelled'
  WHERE id = p_booking_id;
  
  -- Refund credit if it was a booked class (not waitlist) and consumed a credit
  IF v_booking_record.status = 'booked' AND v_booking_record.consumed_pass_id IS NOT NULL THEN
    -- Get pass details
    SELECT up.*, pt.kind INTO v_pass_record
    FROM user_passes up
    JOIN pass_types pt ON up.pass_type_id = pt.id
    WHERE up.id = v_booking_record.consumed_pass_id;
    
    -- Refund credit for pack passes
    IF v_pass_record.kind = 'pack' THEN
      UPDATE user_passes
      SET remaining_credits = remaining_credits + 1,
          is_active = true,
          status = 'active'
      WHERE id = v_booking_record.consumed_pass_id;
      
      v_new_balance := v_pass_record.remaining_credits + 1;
    ELSE
      v_new_balance := v_pass_record.remaining_credits;
    END IF;
  END IF;
  
  -- Promote waitlist if there's space
  PERFORM promote_waitlist(v_booking_record.class_id);
  
  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance
  );
END;
$$;

-- Helper function to promote waitlist
CREATE OR REPLACE FUNCTION promote_waitlist(p_class_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_capacity INTEGER;
  v_booked_count INTEGER;
  v_waitlist_booking RECORD;
BEGIN
  -- Get class capacity
  SELECT capacity INTO v_capacity
  FROM class_schedule
  WHERE id = p_class_id;
  
  -- Count current bookings
  SELECT COUNT(*) INTO v_booked_count
  FROM class_bookings
  WHERE class_id = p_class_id AND status = 'booked';
  
  -- Promote from waitlist if there's space
  WHILE v_booked_count < v_capacity LOOP
    -- Get oldest waitlist booking
    SELECT * INTO v_waitlist_booking
    FROM class_bookings
    WHERE class_id = p_class_id AND status = 'waitlist'
    ORDER BY booked_at ASC
    LIMIT 1;
    
    EXIT WHEN NOT FOUND;
    
    -- Promote to booked
    UPDATE class_bookings
    SET status = 'booked'
    WHERE id = v_waitlist_booking.id;
    
    -- Deduct credit if it's a pack pass
    IF v_waitlist_booking.consumed_pass_id IS NOT NULL THEN
      UPDATE user_passes up
      SET remaining_credits = remaining_credits - 1
      FROM pass_types pt
      WHERE up.id = v_waitlist_booking.consumed_pass_id
        AND up.pass_type_id = pt.id
        AND pt.kind = 'pack';
      
      -- Deactivate if exhausted
      UPDATE user_passes
      SET is_active = false, status = 'exhausted'
      WHERE id = v_waitlist_booking.consumed_pass_id
        AND remaining_credits = 0;
    END IF;
    
    v_booked_count := v_booked_count + 1;
  END LOOP;
END;
$$;

-- Admin function to upsert class
CREATE OR REPLACE FUNCTION admin_upsert_class(
  p_title TEXT,
  p_instructor TEXT,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_capacity INTEGER,
  p_duration_min INTEGER,
  p_id UUID DEFAULT NULL,
  p_heat_c INTEGER DEFAULT NULL,
  p_level TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_class_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  -- Insert or update
  INSERT INTO class_schedule (
    id, title, instructor, date, start_time, end_time,
    capacity, duration_min, heat_c, level, notes, created_by
  )
  VALUES (
    COALESCE(p_id, uuid_generate_v4()),
    p_title, p_instructor, p_date, p_start_time, p_end_time,
    p_capacity, p_duration_min, p_heat_c, p_level, p_notes, v_user_id
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    instructor = EXCLUDED.instructor,
    date = EXCLUDED.date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    capacity = EXCLUDED.capacity,
    duration_min = EXCLUDED.duration_min,
    heat_c = EXCLUDED.heat_c,
    level = EXCLUDED.level,
    notes = EXCLUDED.notes
  RETURNING id INTO v_class_id;
  
  RETURN v_class_id;
END;
$$;

-- Admin function to cancel class and refund all bookings
CREATE OR REPLACE FUNCTION admin_cancel_class(
  p_class_id UUID,
  p_reason TEXT DEFAULT 'Class cancelled'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_refund_count INTEGER := 0;
  booking_record RECORD;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  -- Cancel all bookings and refund credits
  FOR booking_record IN
    SELECT cb.*, pt.kind
    FROM class_bookings cb
    LEFT JOIN user_passes up ON cb.consumed_pass_id = up.id
    LEFT JOIN pass_types pt ON up.pass_type_id = pt.id
    WHERE cb.class_id = p_class_id 
      AND cb.status IN ('booked', 'waitlist')
  LOOP
    -- Cancel booking
    UPDATE class_bookings
    SET status = 'cancelled'
    WHERE id = booking_record.id;
    
    -- Refund credit for pack passes
    IF booking_record.consumed_pass_id IS NOT NULL AND booking_record.kind = 'pack' THEN
      UPDATE user_passes
      SET remaining_credits = remaining_credits + 1,
          is_active = true,
          status = 'active'
      WHERE id = booking_record.consumed_pass_id;
    END IF;
    
    v_refund_count := v_refund_count + 1;
  END LOOP;
  
  -- Update class with cancellation note
  UPDATE class_schedule
  SET notes = COALESCE(notes || ' | ', '') || p_reason
  WHERE id = p_class_id;
  
  RETURN json_build_object(
    'success', true,
    'refunded_bookings', v_refund_count
  );
END;
$$;

-- Admin function to mark attendance
CREATE OR REPLACE FUNCTION admin_mark_attendance(
  p_booking_id UUID,
  p_status booking_status
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  -- Update booking status
  UPDATE class_bookings
  SET status = p_status
  WHERE id = p_booking_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'booking_not_found'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true
  );
END;
$$;