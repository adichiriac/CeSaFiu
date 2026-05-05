# Viral Sharing and Referral Tracking Plan

Status: draft plan.
Owner: Adi.
Scope: sharing loops, referral attribution, friend onboarding/test-completion tracking, leaderboard/admin reporting.
Non-goal for this slice: implementation, rewards economy, payment integration.

## 1. Product Goal

Turn CeSaFiu results into a lightweight social challenge:

- A student finishes a test or sees a result.
- They share a challenge link on WhatsApp / Instagram / TikTok bio / copy link.
- A friend opens the link, takes a test, and optionally creates an account.
- The original student sees aggregate progress: invites sent, friends joined, friends who completed a test.
- Admin sees virality metrics and top referrers.

The core principle: make sharing feel like "vezi ce iese și prietenilor tăi", not a spammy growth loop.

## 2. UX Surfaces

### Results page share card

Placed after the main result and top options:

- Title: `Vrei să vezi ce sunt și prietenii tăi?`
- Body: `Dă-le provocarea și vedeți cum vă potriviți în viitor.`
- Primary CTA: `Trimite pe WhatsApp`
- Secondary actions: `Copiază link`, `Share`
- Referral ID visible in small text only after sign-in: `Referral ID: STUDENT_2024`

Share text:

```text
Eu am făcut testul Ce Să Fiu și mi-a ieșit {archetype}. Fă-l și tu:
{referralUrl}
```

### Landing page referral banner

If the visitor arrives with `?ref=CODE`:

- Small badge near hero: `Provocare de la {displayNameOrFriend}`
- CTA remains first test, not account creation.
- Store referral code locally before the user chooses age/sign-in.

### Profile / Vibe-uri referral panel

For signed-in users:

- `Invitații trimise`
- `Prieteni intrați`
- `Prieteni care au terminat un test`
- `Linkul meu`
- `Top referrers` teaser if leaderboard is enabled.

Default view is aggregate counts, not named friend tracking.

### Admin dashboard

Metrics:

- Total referral clicks
- Onboarded from referral
- Completed at least one test
- Virality coefficient: `completed_referred_users / sharing_users`
- Top sources: WhatsApp, copy link, native share, Instagram bio/manual
- Top referrers by completed users, not clicks.

## 3. Privacy and Minor-Safe Rules

This feature touches child-user behavior, so treat it as product telemetry + social graph data.

Rules:

- No raw friend list import.
- No contacts upload.
- No public real-name leaderboard by default.
- No test result visible to the referrer.
- No "Maria took IPIP" event visible to another student.
- No named friend tracking unless the referred friend explicitly opts in after account creation.
- For under-16 `pending_parent`, do not persist referral conversions tied to that child until parent consent is confirmed.
- Anonymous click attribution can be stored as aggregate event data, but it must not include raw IP, raw user-agent, or clear personal identifiers.

Legal baseline to validate with counsel:

- GDPR Article 8 sets the default digital-consent threshold at 16 for information society services offered directly to children, unless a member state lowers it; it also requires reasonable efforts to verify parental authorization for children below the threshold.
- ANSPDCP confirms Romania's Law 190/2018 implements GDPR nationally; keep the current product assumption that under-16 users need parent authorization unless counsel says otherwise.

Sources:

- EUR-Lex, Regulation (EU) 2016/679, Article 8: https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=celex%3A32016R0679
- ANSPDCP, Law no. 190/2018 notice: https://www.dataprotection.ro/?lang=en&page=Legea_nr_190_2018

## 4. Attribution Model

Use three attribution levels:

1. `click`: referral link opened.
2. `onboarded`: referred visitor created a profile or signed in.
3. `test_completed`: referred visitor completed at least one test.

Only `test_completed` should count for leaderboard and serious virality reporting.

Attribution window:

- Store `referral_code` in localStorage for 30 days.
- First-touch wins for a session.
- If user signs in later, attach the stored referral code once.
- Never allow self-referral.

Recommended URL format:

```text
https://cesafiu.ro/ro?ref=abc123&utm_source=whatsapp&utm_campaign=student_share
https://cesafiu.ro/ro/test/scenarii?ref=abc123
```

## 5. Data Model

Proposed Supabase tables:

```sql
create table referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  display_name text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null references referral_codes(code),
  referred_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('click', 'onboarded', 'test_completed')),
  source text,
  landing_path text,
  anonymous_visitor_hash text,
  created_at timestamptz not null default now()
);

create table referral_opt_ins (
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null references auth.users(id) on delete cascade,
  show_name_to_referrer boolean not null default false,
  show_on_leaderboard boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (referrer_user_id, referred_user_id)
);
```

RLS:

- Users can read their own `referral_codes`.
- Users can read aggregate counts for their own referral code via RPC/view, not raw event rows.
- Admin/service role can read full rows.
- Referred users can update their own `referral_opt_ins`.

## 6. API / RPC Shape

Client endpoints:

- `POST /api/referrals/click`
- `POST /api/referrals/onboarded`
- `POST /api/referrals/test-completed`
- `GET /api/referrals/me`

Server-side helpers:

- `getOrCreateReferralCode(user_id)`
- `recordReferralEvent({code, eventType, source, landingPath, referredUserId})`
- `getReferralStats(user_id)` returns aggregate counts only.
- `getTopReferrers()` returns public leaderboard entries only.

For under-16 pending users:

- Save click locally.
- Do not write `onboarded` / `test_completed` with `referred_user_id` until `parent_confirmed`.
- Optionally write anonymous aggregate `click` without identity.

## 7. Events and Metrics

Umami / analytics events:

- `referral_share_clicked`
- `referral_native_share_opened`
- `referral_copy_link_clicked`
- `referral_whatsapp_clicked`
- `referral_landing_opened`
- `referral_onboarded`
- `referral_test_completed`

Admin KPIs:

- Share rate: users who click share / users who complete a test.
- Referral click-through: referral landing visits / share clicks.
- Referral activation: referred test completions / referral landing visits.
- Viral coefficient: referred test completions / sharing users.
- Fraud rate: blocked duplicate/self-referral attempts / total referral attempts.

## 8. Anti-Abuse

- Rate-limit referral event writes by IP hash + code.
- Prevent self-referrals by comparing `referral_codes.user_id` with `referred_user_id`.
- Deduplicate `test_completed` per referred user per referrer.
- Leaderboard ranks by unique completed referred users, not clicks.
- Hide suspicious codes from public leaderboard until reviewed.
- Add admin export for audit.

## 9. Implementation Phases

### Phase A — Share UX, no database

- Add share card after result.
- Generate referral link only for signed-in users; anonymous users see `Autentifică-te ca să ai linkul tău`.
- Use Web Share API when available, WhatsApp fallback, copy link fallback.
- Store inbound `ref` in localStorage.
- Track only existing Umami aggregate events.

Acceptance:

- Share works on mobile.
- Inbound referral code survives navigation and test completion locally.
- No new personal-data persistence.

### Phase B — Referral code and aggregate conversion tracking

- Add `referral_codes` and `referral_events`.
- Add API endpoints/RPCs.
- Attribute sign-up/onboarding to stored referral code.
- Attribute test completion only when consent state allows cloud writes.
- Add Profile referral panel with aggregate counts.

Acceptance:

- A signed-in referrer sees aggregate counts.
- Under-16 pending users do not produce named/persistent conversion rows.
- Self-referral blocked.

### Phase C — Leaderboard and admin dashboard

- Add top referrers panel.
- Add public opt-in pseudonym/display name.
- Add admin metrics dashboard.
- Add abuse filters.

Acceptance:

- Leaderboard uses public opt-in names only.
- Admin can see top codes and conversion funnel.
- Public users cannot infer which friend took which test.

### Phase D — Rewards / growth experiments

Possible experiments:

- `Invită 3 prieteni și deblochează badge-ul "Navigator"`.
- Class challenge: aggregate class completion, no named friend list.
- Shareable result image card.
- Referral campaign links for ads/schools/influencers.

Keep rewards non-financial until legal review, especially for minors.

## 10. Open Questions

- Should under-16 referred users count only after parent confirmation, or can we count anonymous aggregate test completions?
- Do we want a public top-referrers leaderboard, or admin-only until we see abuse patterns?
- Is a class/team challenge safer and more useful than friend-level tracking?
- Should referral attribution be first-touch or last-touch?
- What is the retention window for referral events: 90 days, 180 days, or 24 months?
