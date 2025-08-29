export const BOOKING_LIMITS = {
  CANCEL_CUTOFF_MINUTES: 120,
  BOOKING_CUTOFF_MINUTES: 5,
  LOW_CREDIT_THRESHOLD: 2,
  CAPACITY_WARNING_THRESHOLD: 5,
  CAPACITY_CRITICAL_THRESHOLD: 2,
} as const

export const PASS_TYPES = {
  PACK: 'pack',
  UNLIMITED: 'unlimited',
} as const

// Direct Stripe price mapping - matches your exact pass type names from database
export const STRIPE_PRICES = {
  'price_1S0r9bARpqh0Ut1y4lHGGuAT': {
    name: 'Single Class',
    credits: 1,
    price: 25.00,
    mode: 'payment'
  },
  'price_1S0vfBARpqh0Ut1ybKjeqehJ': {
    name: '5-Class Pack',
    credits: 5,
    price: 0.50,
    mode: 'payment'
  },
  'price_1S0rHLARpqh0Ut1ybWGa3ocf': {
    name: '10-Class Pack',
    credits: 10,
    price: 180.00,
    mode: 'payment'
  },
  'price_1S0rHqARpqh0Ut1ygGGaoqac': {
    name: '25-Class Pack',
    credits: 25,
    price: 400.00,
    mode: 'payment'
  },
  'price_1S0rIRARpqh0Ut1yQkmz18xc': {
    name: 'Weekly Unlimited',
    durationDays: 7,
    price: 50.00,
    mode: 'subscription'
  },
  'price_1S0rJlARpqh0Ut1yaeBEQVRf': {
    name: 'Monthly Unlimited',
    durationDays: 30,
    price: 150.00,
    mode: 'subscription'
  },
  'price_1S0rKbARpqh0Ut1ydYwnH2Zy': {
    name: 'VIP Monthly',
    durationDays: 30,
    price: 250.00,
    mode: 'subscription'
  },
  'price_1S0rLOARpqh0Ut1y2lbJ17g7': {
    name: 'VIP Yearly',
    durationDays: 365,
    price: 2500.00,
    mode: 'subscription'
  }
} as const