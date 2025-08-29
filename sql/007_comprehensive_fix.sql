-- Comprehensive fix for all database issues
-- Run this to fix schema cache and aggregate function issues

-- 1. Fix profiles table schema cache issues
DO $$ 
BEGIN
    -- Ensure all columns exist
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fullname TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS waiver_signed_at TIMESTAMPTZ;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS waiver_signature_data TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user' NOT NULL;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
END $$;

-- 2. Refresh schema cache
COMMENT ON TABLE profiles IS 'User profiles - refreshed';
NOTIFY pgrst, 'reload schema';

-- 3. Create/update the manual profile creation function
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
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    fullname = COALESCE(EXCLUDED.fullname, profiles.fullname),
    phone = COALESCE(EXCLUDED.phone, profiles.phone);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile manually for user %: %', user_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update waiver signature function
CREATE OR REPLACE FUNCTION update_waiver_signature(
  user_id UUID,
  signature_data TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    waiver_signed_at = NOW(),
    waiver_signature_data = signature_data
  WHERE id = user_id;
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to update waiver signature for user %: %', user_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fix the trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, fullname, phone, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_profile_manual TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_waiver_signature TO anon, authenticated;