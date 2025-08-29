-- Update pass types with actual Stripe Price IDs
-- This will clear existing data and insert the correct pass types

-- Clear existing pass types
DELETE FROM pass_types;

-- Insert pass types with actual Stripe Price IDs
INSERT INTO pass_types (name, kind, credits, duration_days, stripe_price_id, active, sort_order) VALUES
-- Single class passes
('Single Class', 'pack', 1, 7, 'price_1S0r9bARpqh0Ut1y4lHGGuAT', true, 1),
('5-Class Pack', 'pack', 5, 60, 'price_1S0vfBARpqh0Ut1ybKjeqehJ', true, 2),
('10-Class Pack', 'pack', 10, 90, 'price_1S0rHLARpqh0Ut1ybWGa3ocf', true, 3),
('25-Class Pack', 'pack', 25, 120, 'price_1S0rHqARpqh0Ut1ygGGaoqac', true, 4),

-- Unlimited subscriptions
('Weekly Unlimited', 'unlimited', null, 7, 'price_1S0rIRARpqh0Ut1yQkmz18xc', true, 5),
('Monthly Unlimited', 'unlimited', null, 30, 'price_1S0rJlARpqh0Ut1yaeBEQVRf', true, 6),
('VIP Monthly', 'unlimited', null, 30, 'price_1S0rKbARpqh0Ut1ydYwnH2Zy', true, 7),
('VIP Yearly', 'unlimited', null, 365, 'price_1S0rLOARpqh0Ut1y2lbJ17g7', true, 8);

-- Verify the updates
SELECT name, kind, credits, duration_days, stripe_price_id FROM pass_types ORDER BY sort_order;