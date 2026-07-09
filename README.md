# 🔥 LandingRoast AI

Paste a website URL, get a premium AI-powered landing page audit in under 60 seconds — scores across 8 dimensions, your top problems, a prioritized fix list, and rewritten copy you can ship today.

## Stack

- **Next.js 16** (App Router, React Server Components)
- **TypeScript** end to end
- **Tailwind CSS v4** + **shadcn/ui**-style component library
- **Supabase** — auth (email/password + Google OAuth) and Postgres with RLS
- **Stripe-ready billing** — checkout + webhook wired; flips on with env vars
- **OpenAI-compatible AI layer** — works with OpenAI, Groq, Together, OpenRouter, Azure, Ollama…
- Deploys to **Vercel** with zero config

## What an audit contains

| Scores (0–100) | Deliverables |
| --- | --- |
| Overall score | Top 5 problems (with severity) |
| Hero section | Top 10 improvements (impact × effort) |
| Call to action | Rewritten hero headline + subheadline |
| Trust & social proof | Better primary/secondary CTAs |
| Typography | Suggested pricing section |
| Color & contrast | Suggested FAQ |
| Conversion flow | Suggested testimonials |
| SEO · Mobile | Executive summary |

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration in `supabase/migrations/0001_init.sql` (SQL editor or `supabase db push`). It creates `profiles` + `audits` with RLS and a signup trigger.
3. Copy the project URL and anon key into `.env.local`.
4. (Optional) Enable the Google provider under Auth → Providers for one-click sign-in.

### 2. AI provider

Set `OPENAI_API_KEY` (and optionally `OPENAI_BASE_URL` / `AI_MODEL` for any OpenAI-compatible provider). For local development without a key, set `MOCK_AI=true` to get realistic sample reports.

### 3. Stripe (optional)

Billing is architected in but dormant until configured:

1. Create a recurring price for Pro and set `STRIPE_SECRET_KEY` + `STRIPE_PRICE_ID_PRO`.
2. Point a webhook at `/api/billing/webhook` for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and set `STRIPE_WEBHOOK_SECRET`.
3. Set `SUPABASE_SERVICE_ROLE_KEY` so the webhook can update plans.

Free plan: 3 audits/month. Pro: unlimited. Limits live in `src/lib/billing/plans.ts`. Pro users manage/cancel via the Stripe customer portal (`/api/billing/portal`).

## Rate limiting & abuse protection

All DB-backed, so they hold across serverless instances:

- **Monthly quota** per plan (failed audits don't count against it), with a post-insert recount that closes the concurrent-request race.
- **One audit at a time** per user (stale `running` rows older than 2 minutes are ignored).
- **10 audits/hour** hard cap for every plan.
- **SSRF-guarded scraping**: DNS-resolved private/loopback/link-local/metadata ranges are rejected, redirects are validated hop-by-hop, responses are size-capped at 3 MB.

## Architecture

```
src/
├── app/
│   ├── page.tsx                  # Marketing homepage
│   ├── (auth)/login, signup      # Auth pages
│   ├── (app)/dashboard           # URL submission + stats + recent audits
│   ├── (app)/audit/[id]          # Full report view
│   ├── (app)/history             # All past audits
│   ├── (app)/settings            # Profile, plan & billing
│   ├── auth/callback, signout    # Supabase auth handlers
│   └── api/
│       ├── audits                # POST: run an audit · DELETE: remove one
│       └── billing               # Stripe checkout + webhook
├── components/
│   ├── ui/                       # shadcn-style primitives
│   ├── marketing/                # Homepage sections
│   ├── audit/                    # URL form, score ring, report view…
│   └── app/, auth/, billing/     # Shell, auth form, upgrade button
├── lib/
│   ├── audit/                    # scrape → prompt → validate pipeline
│   ├── ai/                       # OpenAI-compatible client + prompts + mock
│   ├── billing/                  # Plans + Stripe
│   └── supabase/                 # Browser/server/proxy clients
├── proxy.ts                      # Session refresh + route protection
supabase/migrations/              # Database schema (RLS-enabled)
```

**Audit pipeline** (`src/lib/audit/run.ts`): fetch the public page → distill it into a compact structured snapshot (cheerio) → one CRO-tuned completion returning strict JSON → validate with Zod → persist to Postgres. SSRF-guarded (private hosts blocked), time-boxed (15s fetch, 60s function), and every failure path stores a user-readable error on the audit row.

## Deploying to Vercel

Push to GitHub, import in Vercel, add the env vars from `.env.example`, deploy. The audit route declares `maxDuration = 60`, within Vercel's default function limits.
