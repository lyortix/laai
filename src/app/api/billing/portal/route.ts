import { NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripe";
import { createClient } from "@/lib/supabase/server";
import { env, isStripeConfigured } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Opens the Stripe customer portal so Pro users can manage or cancel their
 * subscription without support tickets.
 */
export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing isn't enabled on this deployment yet." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing profile found. Subscribe first." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${env.appUrl}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
