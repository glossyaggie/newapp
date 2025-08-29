-- Update Stripe Price IDs with your actual Price IDs from Stripe Dashboard
-- Replace the placeholder values below with your real Stripe Price IDs

-- STEP 1: Go to your Stripe Dashboard → Products
-- STEP 2: Copy the Price ID (starts with 'price_') for each product
-- STEP 3: Replace the values below and run this SQL

UPDATE pass_types SET stripe_price_id = 'price_YOUR_SINGLE_CLASS_PRICE_ID' WHERE name = 'Single Class';
UPDATE pass_types SET stripe_price_id = 'price_YOUR_8_CLASS_PACK_PRICE_ID' WHERE name = '8-Class Pack';
UPDATE pass_types SET stripe_price_id = 'price_YOUR_16_CLASS_PACK_PRICE_ID' WHERE name = '16-Class Pack';
UPDATE pass_types SET stripe_price_id = 'price_YOUR_UNLIMITED_MONTHLY_PRICE_ID' WHERE name = 'Unlimited Monthly';

-- Verify the updates
SELECT name, stripe_price_id FROM pass_types ORDER BY sort_order;