# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vibe Code Market** — an AI product marketplace where creators sell apps, tools, automations, and agents built with AI coding assistants (Claude Code, Cursor, Lovable, etc.).

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit (no emit, just type checking)
npm run db:types     # Regenerate Supabase TypeScript types after schema changes
npm run db:push      # Push local migrations to Supabase
```

No test runner is configured — verify changes with `typecheck` + `lint` + manual testing.

## Architecture

**Stack:** Next.js 14.2 (App Router), TypeScript, Supabase (Postgres + Auth + Storage), Stripe Connect, Resend email, OpenAI (gpt-4o-mini for listing checks), Tailwind CSS + Radix UI.

### Directory Layout

```
app/
  (auth)/             # Login, signup, callback pages
  (marketing)/        # Public browse/landing pages
  api/                # REST API routes
    listings/[id]/check/  # Gatekeeper quality check endpoint
    payments/         # Stripe checkout
    github/           # OAuth connect + callback
    webhooks/stripe/  # Stripe webhook handler
  dashboard/          # Protected creator pages (listings, earnings, settings)
  actions/            # Server Actions (auth.ts, listing.ts)
components/           # Reusable UI components
lib/
  supabase/           # Client factories: client.ts (browser), server.ts (RSC), middleware.ts
  listing-check/      # Gatekeeper: ingest.ts, worker.ts, prompt.ts, types.ts
  stripe/             # Fee calculation, webhook helpers
  analytics.ts        # Creator earnings aggregation (JS-side, not SQL)
supabase/migrations/  # SQL schema files
types/supabase.ts     # Auto-generated — do not edit manually
middleware.ts         # Session refresh + route guards
```

### Supabase Client Rules

There are three separate clients — use the right one for the context:
- `lib/supabase/client.ts` — browser components (`createBrowserClient`)
- `lib/supabase/server.ts` — Server Components and Server Actions (`createServerClient` with `cookies()`)
- `lib/supabase/middleware.ts` — middleware only (`updateSession`)

### Authentication & Route Protection

Middleware (`middleware.ts`) runs on every non-static request:
- Refreshes Supabase JWT via `updateSession()`
- Redirects unauthenticated users away from `/dashboard/*` → `/login`
- Redirects authenticated users away from `/login`, `/signup`

### Listing Lifecycle

1. **Draft creation** — `app/actions/listing.ts: createListing()` inserts a draft with auto-generated slug
2. **ZIP upload** — `uploadListingZip()` uploads to Supabase Storage bucket `listing-files` at `{listingId}/product.zip`
3. **Quality check** — `POST /api/listings/[id]/check` runs the Gatekeeper synchronously (important on Vercel — no background jobs)
4. **Publish** — creator manually publishes after passing the check

### Gatekeeper (Listing Quality Check)

Located in `lib/listing-check/`. Flow:
- `ingest.ts` extracts up to 3 files from the ZIP (max 200 lines / 20 KB each), prioritizing docs
- `worker.ts` builds the prompt, calls OpenAI gpt-4o-mini with `tool_choice` forced JSON output
- Scores: `completeness`, `security`, `clarity`, `overall` (0–10 scale)
- Hard constraint: if `security < 4` → `overall ≤ 5` and `outcome = "flagged"`
- Stuck check detection: resets checks older than 5 minutes back to allow retry
- Results stored in `listing_checks` table; `listings.review_status` updated accordingly

### Payments (Stripe Connect)

- Platform takes a configurable fee (default 10%, env `STRIPE_PLATFORM_FEE_PERCENT`)
- Creators must complete Stripe Connect onboarding (`profiles.stripe_onboarded`)
- Webhook at `/api/webhooks/stripe` handles `checkout.session.completed` → creates `purchases` record

### GitHub OAuth (Repository Import)

- CSRF token stored in HTTP-only cookie; flow: `/api/github/connect` → GitHub → `/api/github/callback`
- Access tokens stored AES-256 encrypted in `user_github_connections`

### Analytics

`lib/analytics.ts` aggregates creator earnings entirely in JavaScript (no SQL aggregation queries). It fills in zero-revenue days for the 30-day chart client-side.

## Key Database Tables

| Table | Notes |
|---|---|
| `profiles` | Extends Supabase auth users; has `role`, `stripe_account_id`, `stripe_onboarded` |
| `listings` | `review_status` enum: `pending` / `approved` / `flagged`; `price_type`: `free` / `paid` |
| `listing_checks` | One row per check run; `status`: `running` / `completed` / `failed` |
| `purchases` | Tracks `platform_fee_cents` and `creator_payout_cents` separately |
| `listing_views` | Insert-only analytics; RLS allows anonymous inserts |
| `user_github_connections` | Encrypted token storage |

After any schema migration, run `npm run db:types` to regenerate `types/supabase.ts`.

## Environment Variables

Required vars (see `.env.example`): Supabase URL/keys (anon + service role), Stripe keys + webhook secret, `GITHUB_CLIENT_ID/SECRET/TOKEN_ENCRYPTION_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `ADMIN_EMAIL`, `NEXT_PUBLIC_APP_URL`.

`lib/supabase/env.ts` validates and exports all env vars at startup — add new required vars there.

## Design System

Tailwind with Material-3 color tokens (`primary`, `secondary`, `surface`, `error`, etc.) and dark mode via class strategy. Three fonts: Inter (body), Space Grotesk (headlines), JetBrains Mono (code). Custom component tokens are in `tailwind.config.ts`.
