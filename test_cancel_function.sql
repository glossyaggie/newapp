-- Test if cancel_booking function exists
-- Run this in Supabase SQL Editor

-- Check if the function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'cancel_booking';

-- Test the function (replace with a real booking ID)
-- SELECT * FROM cancel_booking('your-booking-id-here');
