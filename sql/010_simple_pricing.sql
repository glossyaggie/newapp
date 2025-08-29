-- Simple pricing pattern: store prices in DB, no Stripe API calls needed
-- DB = source of truth for display, Stripe price_id = source of truth for charging

-- Add price columns to pass_types
ALTER TABLE public.pass_types
  ADD COLUMN IF NOT EXISTS price_amount_cents INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'AUD',
  ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS interval TEXT,            -- 'week' | 'month' | 'year'
  ADD COLUMN IF NOT EXISTS interval_count INT DEFAULT 1;

-- Ensure price_id is unique per pass
CREATE UNIQUE INDEX IF NOT EXISTS uniq_pass_price ON public.pass_types (stripe_price_id);

-- Fill the values to match your Stripe prices
-- Update these with your actual prices from Stripe
UPDATE public.pass_types SET price_amount_cents=2500,  currency='AUD', is_subscription=false WHERE name='Single Class';
UPDATE public.pass_types SET price_amount_cents=50,    currency='AUD', is_subscription=false WHERE name='5-Class Pack';  -- $0.50 as you mentioned
UPDATE public.pass_types SET price_amount_cents=20000, currency='AUD', is_subscription=false WHERE name='10-Class Pack'; -- $200 as you mentioned
UPDATE public.pass_types SET price_amount_cents=40000, currency='AUD', is_subscription=false WHERE name='25-Class Pack';

UPDATE public.pass_types SET price_amount_cents=4500,  currency='AUD', is_subscription=true, interval='week',  interval_count=1 WHERE name='Weekly Unlimited';
UPDATE public.pass_types SET price_amount_cents=20000, currency='AUD', is_subscription=true, interval='month', interval_count=1 WHERE name='Monthly Unlimited';
UPDATE public.pass_types SET price_amount_cents=30000, currency='AUD', is_subscription=true, interval='month', interval_count=1 WHERE name='VIP Monthly';
UPDATE public.pass_types SET price_amount_cents=250000,currency='AUD', is_subscription=true, interval='year',  interval_count=1 WHERE name='VIP Yearly';

-- Enable RLS for read access
ALTER TABLE public.pass_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "read pass types" ON public.pass_types
FOR SELECT TO anon, authenticated USING (active = true);