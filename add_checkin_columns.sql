-- Add missing check-in columns to class_bookings table
-- Run this in Supabase SQL Editor

-- Add check-in tracking columns to class_bookings
ALTER TABLE class_bookings 
ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE;

ALTER TABLE class_bookings 
ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP;

ALTER TABLE class_bookings 
ADD COLUMN IF NOT EXISTS check_in_method TEXT; -- 'qr' or 'manual'

-- Create QR code tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS class_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES class_schedule(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on QR codes table
ALTER TABLE class_qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for QR codes
CREATE POLICY "Anyone can view active QR codes" ON class_qr_codes
  FOR SELECT USING (expires_at > NOW());

CREATE POLICY "Admins can manage QR codes" ON class_qr_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Test that the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'class_bookings' 
AND column_name IN ('checked_in', 'check_in_time', 'check_in_method')
ORDER BY column_name;
