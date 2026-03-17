import Stripe from "stripe";

// Keys loaded from environment or config
// On Hostinger: hardcoded in stripe-config (git-ignored)
let STRIPE_SECRET = "";
let STRIPE_PUBLIC = "";

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const config = require("./stripe-config");
  STRIPE_SECRET = config.STRIPE_SECRET_KEY;
  STRIPE_PUBLIC = config.STRIPE_PUBLISHABLE_KEY;
} catch {
  // Fall back to env vars
  STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";
  STRIPE_PUBLIC = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
}

export const stripe = new Stripe(STRIPE_SECRET, {
  apiVersion: "2026-02-25.clover",
});

export const STRIPE_PUBLISHABLE_KEY = STRIPE_PUBLIC;
