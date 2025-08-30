-- Check webhook logs and recent purchases
-- Run this in Supabase SQL Editor

-- Check recent pass purchases
SELECT 
  pp.id,
  pp.user_id,
  pp.pass_type_id,
  pp.stripe_session_id,
  pp.created_at,
  pt.name as pass_name
FROM pass_purchases pp
JOIN pass_types pt ON pp.pass_type_id = pt.id
WHERE pp.user_id = auth.uid()
ORDER BY pp.created_at DESC
LIMIT 10;

-- Check if there are any webhook logs
SELECT 
  id,
  type,
  received_at,
  payload->>'id' as stripe_id
FROM stripe_webhooks
ORDER BY received_at DESC
LIMIT 10;

-- Check recent user_passes for your account
SELECT 
  up.id,
  up.user_id,
  up.pass_type_id,
  up.remaining_credits,
  up.valid_from,
  up.valid_until,
  up.is_active,
  up.status,
  up.created_at,
  pt.name as pass_name
FROM user_passes up
JOIN pass_types pt ON up.pass_type_id = pt.id
WHERE up.user_id = auth.uid()
ORDER BY up.created_at DESC;
