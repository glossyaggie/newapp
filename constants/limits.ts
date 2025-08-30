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

// Stripe price IDs - used for reference only, prices fetched directly from Stripe
export const STRIPE_PRICE_IDS = {
  SINGLE_CLASS: 'price_1S0r9bARpqh0Ut1y4lHGGuAT',
  FIVE_CLASS_PACK: 'price_1S0vfBARpqh0Ut1ybKjeqehJ',
  TEN_CLASS_PACK: 'price_1S0rHLARpqh0Ut1ybWGa3ocf',
  TWENTY_FIVE_CLASS_PACK: 'price_1S0rHqARpqh0Ut1ygGGaoqac',
  WEEKLY_UNLIMITED: 'price_1S0rIRARpqh0Ut1yQkmz18xc',
  MONTHLY_UNLIMITED: 'price_1S0rJlARpqh0Ut1yaeBEQVRf',
  VIP_MONTHLY: 'price_1S0rKbARpqh0Ut1ydYwnH2Zy',
  VIP_YEARLY: 'price_1S0rLOARpqh0Ut1y2lbJ17g7'
} as const