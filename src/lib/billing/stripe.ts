import Stripe from "stripe";
import { env, isStripeConfigured } from "@/lib/env";

let stripe: Stripe | null = null;

/**
 * Stripe-ready billing: the checkout + webhook routes and the `plan` column
 * on profiles are wired end-to-end. Add STRIPE_* env vars and a Pro price to
 * turn billing on — no code changes required.
 */
export function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID_PRO.");
  }
  stripe ??= new Stripe(env.stripeSecretKey);
  return stripe;
}
