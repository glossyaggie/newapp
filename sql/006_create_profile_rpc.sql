-- Create a manual profile creation RPC function
-- This bypasses any schema cache issues

CREATE OR REPLACE FUNCTION create_profile_manual(
  user_id UUID,
  first_name_param TEXT DEFAULT NULL,
  last_name_param TEXT DEFAULT NULL,
  fullname_param TEXT DEFAULT NULL,
  phone_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    fullname, 
    phone, 
    role
  ) VALUES (
    user_id,
    first_name_param,
    last_name_param,
    fullname_param,
    phone_param,
    'user'
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile manually for user %: %', user_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;