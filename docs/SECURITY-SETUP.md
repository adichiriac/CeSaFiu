# Security baseline — setup checklist

This document describes what to provision *before* the security baseline goes
to production. The code ships in **soft mode** when these are missing — it
won't crash, but rate limiting and CAPTCHA will fail open, and you'll see
warnings in `railway logs`. Treat the warnings as a deploy gate.

## 1. Upstash Redis (rate limiting)

Free tier (10k req/day) is plenty for early traffic.

1. Create an account at <https://console.upstash.com/>.
2. Create a Redis database. Pick the region closest to your Railway deploy
   (any EU region — Railway's default is EU West).
3. From the database overview copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Add both to Railway project variables (Settings → Variables).

Rate-limit profiles live in
`apps/web/src/lib/security/rate-limit.ts` → `RATE_LIMIT_PROFILES`.
Edit there if you need to tune limits — they're declared in one place
on purpose.

## 2. Cloudflare Turnstile (invisible CAPTCHA)

Free, privacy-preserving, no third-party tracking.

1. Sign in / create account at <https://dash.cloudflare.com/>.
2. Go to **Turnstile** → **Add site**.
3. Pick widget mode: **Invisible** (or Managed if you want CF to decide).
4. Domain: `cesafiu.ro` (and `localhost` for dev — CF supports both).
5. Copy:
   - **Site key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (public — fine to ship to client).
   - **Secret key** → `TURNSTILE_SECRET_KEY` (server-only).

Add both to Railway project variables.

The widget is declared with `action=feedback` so you can later filter
analytics in the Cloudflare dashboard by action.

## 3. Run the migration

```bash
# from repo root, against your Supabase project
supabase db push
```

This applies `supabase/migrations/20260507100000_security_baseline.sql`
which creates `audit_events` and `feedback_submissions` (both RLS-locked,
service-role only).

## 4. Verify the env vars locally

`apps/web/.env.local`:

```
# already provisioned (consent flow)
CONSENT_HASH_PEPPER=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SECRET_KEY=...

# new — rate limit + Turnstile
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...

# optional — surfaced in feedback row + audit log
NEXT_PUBLIC_APP_VERSION=phase-1.6
```

Then `npm run dev`, open the app, submit feedback. You should see a row
in `feedback_submissions` and a corresponding `feedback_submitted` row
in `audit_events`.

## 5. Triage workflow (manual, early days)

There is no admin UI yet. Triage from the Supabase dashboard:

```sql
-- Recent feedback, newest first
select created_at, rating, category, message, page_path, context->>'pageUrl' as page_url, spam_score, status
from feedback_submissions
order by created_at desc
limit 50;

-- High-rating ungated praise — first wins to share with team
select message, locale, created_at
from feedback_submissions
where rating = 5 and message is not null and spam_score < 0.5
order by created_at desc;

-- Bug reports
select message, page_path, context->>'pageUrl' as page_url, locale, created_at
from feedback_submissions
where category = 'bug' and status = 'new'
order by created_at desc;

-- Things you may want to skip
select count(*), status
from feedback_submissions
group by status;

-- Mark as triaged
update feedback_submissions set status = 'triaged' where id = '...';
```

## 6. Rollback

If anything misbehaves the safe rollback is to remove the widget from
the layout — feedback stops being collected, the rest of the app is
unaffected:

```diff
- <FeedbackWidget />
```

The migration is additive (only `create table`), so it can stay applied
even after a rollback.
