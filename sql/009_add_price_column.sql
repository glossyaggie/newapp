-- Add price column to pass_types table for storing Stripe prices
-- This allows us to sync prices from Stripe and display them in the app

ALTER TABLE pass_types 
ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00 NOT NULL;

-- Add an updated_at column to track when prices were last synced
ALTER TABLE pass_types 
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pass_types_updated_at 
    BEFORE UPDATE ON pass_types 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing pass types with your actual Stripe price IDs and set initial prices to 0
-- The sync function will update these with real prices from Stripe
UPDATE pass_types SET 
    stripe_price_id = 'price_1S0r9bARpqh0Ut1y4lHGGuAT',
    price = 0.00
WHERE name = 'Single Class';

UPDATE pass_types SET 
    stripe_price_id = 'price_1S0vfBARpqh0Ut1ybKjeqehJ',
    price = 0.00
WHERE name = '5-Class Pack';

UPDATE pass_types SET 
    stripe_price_id = 'price_1S0rHLARpqh0Ut1ybWGa3ocf',
    price = 0.00
WHERE name = '10-Class Pack';

UPDATE pass_types SET 
    stripe_price_id = 'price_1S0rHqARpqh0Ut1ygGGaoqac',
    price = 0.00
WHERE name = '25-Class Pack';

UPDATE pass_types SET 
    stripe_price_id = 'price_1S0rIRARpqh0Ut1yQkmz18xc',
    price = 0.00
WHERE name = 'Weekly Unlimited';

UPDATE pass_types SET 
    stripe_price_id = 'price_1S0rJlARpqh0Ut1yaeBEQVRf',
    price = 0.00
WHERE name = 'Monthly Unlimited';

UPDATE pass_types SET 
    stripe_price_id = 'price_1S0rKbARpqh0Ut1ydYwnH2Zy',
    price = 0.00
WHERE name = 'VIP Monthly';

UPDATE pass_types SET 
    stripe_price_id = 'price_1S0rLOARpqh0Ut1y2lbJ17g7',
    price = 0.00
WHERE name = 'VIP Yearly';

-- Insert any missing pass types
INSERT INTO pass_types (name, kind, credits, duration_days, stripe_price_id, price, sort_order) 
VALUES 
    ('5-Class Pack', 'pack', 5, 60, 'price_1S0vfBARpqh0Ut1ybKjeqehJ', 0.00, 2),
    ('25-Class Pack', 'pack', 25, 120, 'price_1S0rHqARpqh0Ut1ygGGaoqac', 0.00, 4),
    ('Weekly Unlimited', 'unlimited', NULL, 7, 'price_1S0rIRARpqh0Ut1yQkmz18xc', 0.00, 5),
    ('VIP Monthly', 'unlimited', NULL, 30, 'price_1S0rKbARpqh0Ut1ydYwnH2Zy', 0.00, 7),
    ('VIP Yearly', 'unlimited', NULL, 365, 'price_1S0rLOARpqh0Ut1y2lbJ17g7', 0.00, 8)
ON CONFLICT (stripe_price_id) DO NOTHING;