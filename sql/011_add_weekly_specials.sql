-- Weekly Specials Table
CREATE TABLE IF NOT EXISTS weekly_specials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE weekly_specials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_specials
CREATE POLICY "Anyone can view active specials" ON weekly_specials
  FOR SELECT USING (is_active = true AND CURRENT_DATE BETWEEN valid_from AND valid_until);

CREATE POLICY "Admins can manage specials" ON weekly_specials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for weekly_specials
CREATE TRIGGER update_weekly_specials_updated_at 
  BEFORE UPDATE ON weekly_specials 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
