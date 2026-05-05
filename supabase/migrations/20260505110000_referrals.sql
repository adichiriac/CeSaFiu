create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  display_name text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null references public.referral_codes(code) on delete cascade,
  referred_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('click', 'onboarded', 'test_completed')),
  source text,
  landing_path text,
  anonymous_visitor_hash text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 months')
);

create table if not exists public.referral_opt_ins (
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null references auth.users(id) on delete cascade,
  show_name_to_referrer boolean not null default false,
  show_on_leaderboard boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (referrer_user_id, referred_user_id)
);

create index if not exists referral_events_code_type_created_idx
on public.referral_events (referral_code, event_type, created_at desc);

create index if not exists referral_events_expires_at_idx
on public.referral_events (expires_at);

create unique index if not exists referral_events_unique_user_event_idx
on public.referral_events (referral_code, event_type, referred_user_id)
where referred_user_id is not null;

create unique index if not exists referral_events_unique_visitor_event_idx
on public.referral_events (referral_code, event_type, anonymous_visitor_hash)
where referred_user_id is null and anonymous_visitor_hash is not null;

alter table public.referral_codes enable row level security;
alter table public.referral_events enable row level security;
alter table public.referral_opt_ins enable row level security;

drop policy if exists "referral_codes_select_own" on public.referral_codes;
create policy "referral_codes_select_own"
on public.referral_codes for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "referral_opt_ins_select_related" on public.referral_opt_ins;
create policy "referral_opt_ins_select_related"
on public.referral_opt_ins for select
to authenticated
using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

drop policy if exists "referral_opt_ins_update_referred" on public.referral_opt_ins;
create policy "referral_opt_ins_update_referred"
on public.referral_opt_ins for update
to authenticated
using (auth.uid() = referred_user_id)
with check (auth.uid() = referred_user_id);

grant select on public.referral_codes to authenticated;
grant select, update on public.referral_opt_ins to authenticated;
