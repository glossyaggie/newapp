-- Add missing columns to class_bookings table
-- Run this in Supabase SQL Editor

-- Add created_at and updated_at columns to class_bookings table
ALTER TABLE public.class_bookings
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;

-- Create a trigger function to update updated_at on each row modification
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_trigger_class_bookings') THEN
        CREATE TRIGGER set_updated_at_trigger_class_bookings
        BEFORE UPDATE ON public.class_bookings
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;
