-- Fix profiles table and ensure schema is correct
-- Run this to fix any schema cache issues

-- First, let's make sure the profiles table exists with correct columns
DO $$ 
BEGIN
    -- Check if profiles table exists and has the right structure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'first_name'
        AND table_schema = 'public'
    ) THEN
        -- If the column doesn't exist, add it
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'last_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'fullname'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fullname TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'phone'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'waiver_signed_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS waiver_signed_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'waiver_signature_data'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS waiver_signature_data TEXT;
    END IF;
END $$;

-- Refresh the schema cache by updating the table comment
COMMENT ON TABLE profiles IS 'User profiles - updated ' || NOW();

-- Make sure the trigger function is correct
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, fullname, phone)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();