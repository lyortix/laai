import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/billing/stripe";
import { env, isStripeConfigured } from "@/lib/env";

export const runtime = "nodejs";

function adminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for the Stripe webhook.");
  }
  return createAdminClient(env.supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

async function setPlanByCustomer(customerId: string, plan: "free" | "pro") {
  const supabase = adminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ plan })
    .eq("stripe_customer_id", customerId);
  if (error) throw new Error(`Failed to update plan: ${error.message}`);
}

/**
 * Stripe webhook: keeps `profiles.plan` in sync with subscription state.
 * Configure the endpoint for: checkout.session.completed,
 * customer.subscription.updated, customer.subscription.deleted.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured() || !env.stripeWebhookSecret) {
    return NextResponse.json({ error: "Billing not configured." }, { status: 503 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
  } catch (err) {
    console.error("[stripe] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && typeof session.customer === "string") {
          await setPlanByCustomer(session.customer, "pro");
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object;
        if (typeof sub.customer === "string") {
          const active = sub.status === "active" || sub.status === "trialing";
          await setPlanByCustomer(sub.customer, active ? "pro" : "free");
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        if (typeof sub.customer === "string") {
          await setPlanByCustomer(sub.customer, "free");
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`[stripe] handler failed for ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
