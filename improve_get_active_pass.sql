-- Improved get_active_pass function
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_active_pass()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- First try to get the most recently created active pass
  SELECT json_build_object(
    'remaining_credits', up.remaining_credits,
    'valid_until', up.valid_until,
    'is_unlimited', pt.kind = 'unlimited',
    'pass_name', pt.name,
    'pass_id', up.id
  )
  INTO result
  FROM user_passes up
  JOIN pass_types pt ON up.pass_type_id = pt.id
  WHERE up.user_id = auth.uid()
    AND up.valid_until > NOW()
    AND up.remaining_credits > 0
    AND pt.active = true
  ORDER BY up.created_at DESC
  LIMIT 1;
  
  -- If no pass found with credits, try to find any valid pass
  IF result IS NULL THEN
    SELECT json_build_object(
      'remaining_credits', up.remaining_credits,
      'valid_until', up.valid_until,
      'is_unlimited', pt.kind = 'unlimited',
      'pass_name', pt.name,
      'pass_id', up.id
    )
    INTO result
    FROM user_passes up
    JOIN pass_types pt ON up.pass_type_id = pt.id
    WHERE up.user_id = auth.uid()
      AND up.valid_until > NOW()
      AND pt.active = true
    ORDER BY up.created_at DESC
    LIMIT 1;
  END IF;
  
  RETURN result;
END;
$$;
