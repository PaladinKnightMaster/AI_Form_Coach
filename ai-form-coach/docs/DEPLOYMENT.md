# Deployment & Configuration Guide

Updated: March 31, 2026

## Architecture Overview

```
Local Dev (.env.local)  →  Vercel Preview (auto)  →  Vercel Production (env vars)
       ↓                          ↓                           ↓
  localhost:3000          branch-name-xxx.vercel.app   fitnessaiformcoach.vercel.app
       ↓                          ↓                           ↓
  Supabase (shared)       Supabase (shared)            Supabase (shared)
```

All three environments share the same Supabase project. Environment-specific behavior is controlled by `NEXT_PUBLIC_SITE_URL` for auth redirects and `NEXT_PUBLIC_UMAMI_WEBSITE_ID` for analytics scoping.

## Environment Files

| File | Committed | Purpose |
|------|-----------|---------|
| `.env.example` | Yes | Template with documentation. Copy to `.env.local` for local dev. |
| `.env.local` | No | Local development secrets and overrides. |
| `.env.production` | No | Production defaults. Overridden by Vercel env vars. |

**Rule:** Only `.env.example` is committed to git. All other `.env*` files are gitignored.

## Vercel Configuration

### Environment Variables (Dashboard → Settings → Environment Variables)

Set these in Vercel Dashboard, scoped to the correct environment:

#### Production Only
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://fitnessaiformcoach.vercel.app` |
| `NEXT_PUBLIC_BASE_URL` | `https://aiformcoach.com` |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | `15f5f7e8-138e-4e7a-844a-3accfb6698e3` |
| `NEXT_PUBLIC_UMAMI_SRC` | `https://analytics.umami.is/script.js` |

#### All Environments (Production + Preview + Development)
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kqmjhjtfogplhmzzbxnw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(your anon key)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(your service role key)* |
| `NEXT_PUBLIC_SENTRY_DSN` | *(your Sentry DSN)* |

#### Preview Only
No special variables needed. `getSiteURL()` auto-detects `NEXT_PUBLIC_VERCEL_URL` for preview deployments.

### Production Domains
- `fitnessaiformcoach.vercel.app` (primary)
- `aiformcoach.com` (custom domain, when configured)

## Supabase Configuration

### Auth → URL Configuration (Dashboard)
| Setting | Value |
|---------|-------|
| **Site URL** | `https://fitnessaiformcoach.vercel.app` |
| **Redirect URLs** | `https://fitnessaiformcoach.vercel.app/**` |
| | `https://*-paladinknightmasters-projects.vercel.app/**` |
| | `http://localhost:3000/**` |

### How Auth Redirects Work

The app uses `getSiteURL()` from `src/lib/auth/utils.ts`:

```
NEXT_PUBLIC_SITE_URL  →  NEXT_PUBLIC_VERCEL_URL  →  http://localhost:3000
     (first match wins)
```

- **Local dev:** `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local`
- **Preview:** No `SITE_URL` set → falls back to `NEXT_PUBLIC_VERCEL_URL` (auto-injected by Vercel)
- **Production:** `NEXT_PUBLIC_SITE_URL=https://fitnessaiformcoach.vercel.app` in Vercel env vars

This means all three redirect allow-list patterns are hit correctly without any code changes.

## Analytics (Umami)

| Environment | Website ID | Tracking |
|-------------|------------|----------|
| Local dev | *(empty)* | Disabled |
| Preview | *(empty)* | Disabled |
| Production | `15f5f7e8-138e-4e7a-844a-3accfb6698e3` | Active |

To enable dev tracking: Create a second Umami site (e.g., "AI-FORM-COACH-DEV") and set its ID in `.env.local`.

## Deployment Flow

### Production (main branch)
1. Merge PR to `main`
2. Vercel auto-deploys to production
3. Vercel env vars override any `.env.production` defaults

### Preview (any branch with open PR)
1. Push branch or open PR
2. Vercel auto-deploys a preview URL
3. Auth redirects work via `NEXT_PUBLIC_VERCEL_URL` fallback

### Local Development
1. Copy `.env.example` to `.env.local`
2. Fill in Supabase keys
3. `npm run dev` → `http://localhost:3000`

## Checklist for New Environments

When adding a new deployment target:

1. Add its domain to Supabase → Auth → Redirect URLs: `https://new-domain.com/**`
2. Set `NEXT_PUBLIC_SITE_URL` in that environment's Vercel env vars
3. Verify auth callback works: sign up → check email → click link → lands on correct domain
