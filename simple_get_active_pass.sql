-- Simple, robust get_active_pass function
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_active_pass()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Get the most recent valid pass with credits
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
  
  RETURN result;
END;
$$;
