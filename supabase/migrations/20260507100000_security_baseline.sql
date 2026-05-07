-- Security baseline:
--   * audit_events  — generic, append-only event log for security-sensitive actions
--   * feedback_submissions — student feedback widget storage
--
-- Both tables are write-only from the API (service role) and not directly
-- queryable by authenticated/anon users. Operators triage via the Supabase
-- dashboard or a future admin surface.

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  ip_address_hash text,
  user_agent_hash text,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists audit_events_type_created_idx
on public.audit_events (event_type, created_at desc);

create index if not exists audit_events_user_created_idx
on public.audit_events (user_id, created_at desc)
where user_id is not null;

create index if not exists audit_events_ip_created_idx
on public.audit_events (ip_address_hash, created_at desc)
where ip_address_hash is not null;

alter table public.audit_events enable row level security;
-- No SELECT policy => authenticated/anon get nothing. Only the service
-- role bypasses RLS, which is the only context that should read this table.

-- ------------------------------------------------------------------ --

create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  -- Hashed cookie/session id for anonymous deduplication. Not a strong
  -- identifier — rotates with the cookie, only meaningful for ~24h.
  anon_session_hash text,
  ip_address_hash text not null,
  user_agent_hash text,
  locale text,
  page_path text,
  rating smallint not null check (rating between 1 and 5),
  category text check (category in ('bug', 'confused', 'suggestion', 'praise')),
  -- Feedback text after PII redaction. Hard cap 500 chars, enforced at
  -- the API layer too — the constraint here is belt-and-suspenders.
  message text check (message is null or length(message) <= 500),
  context jsonb not null default '{}'::jsonb,
  app_version text,
  status text not null default 'new'
    check (status in ('new', 'triaged', 'replied', 'spam')),
  spam_score real not null default 0,
  -- Triage metadata
  pii_hits text[] not null default '{}'::text[],
  turnstile_status text not null default 'soft_skip'
    check (turnstile_status in ('verified', 'soft_skip'))
);

create index if not exists feedback_created_idx
on public.feedback_submissions (created_at desc);

create index if not exists feedback_status_created_idx
on public.feedback_submissions (status, created_at desc);

create index if not exists feedback_user_idx
on public.feedback_submissions (user_id, created_at desc)
where user_id is not null;

create index if not exists feedback_rating_idx
on public.feedback_submissions (rating);

alter table public.feedback_submissions enable row level security;
-- No policies — service role only. Even the user who submitted feedback
-- can't read it back (and shouldn't need to: the UI already showed them
-- their own submission, and we don't expose a personal feedback log).
