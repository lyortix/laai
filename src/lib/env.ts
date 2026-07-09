/**
 * Centralized environment access. Everything is optional at build time so the
 * app can compile without secrets; runtime code guards on the flags below and
 * fails with actionable errors instead of crashing at import time.
 */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",

  // AI — Gemini is the default provider; any OpenAI-compatible API works as
  // an alternative. See src/lib/ai/provider.ts for selection rules.
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiBaseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  /** Optional explicit provider override: "gemini" | "openai" | "mock". */
  aiProvider: process.env.AI_PROVIDER ?? "",
  /** Optional model override; each provider applies its own default. */
  aiModel: process.env.AI_MODEL ?? "",
  mockAi: process.env.MOCK_AI === "true",

  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePriceIdPro: process.env.STRIPE_PRICE_ID_PRO ?? "",
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
};

export const isSupabaseConfigured = () =>
  Boolean(env.supabaseUrl && env.supabaseAnonKey);

export const isAiConfigured = () =>
  env.mockAi || Boolean(env.geminiApiKey) || Boolean(env.openaiApiKey);

export const isStripeConfigured = () =>
  Boolean(env.stripeSecretKey && env.stripePriceIdPro);
