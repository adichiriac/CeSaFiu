create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  age_band text not null default 'unknown'
    check (age_band in ('unknown', '14-15', '16-17', '18+', 'parent')),
  consent_status text not null default 'self'
    check (consent_status in ('self', 'pending_parent', 'parent_confirmed', 'revoked')),
  parent_email_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_careers (
  user_id uuid not null references auth.users(id) on delete cascade,
  career_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, career_id)
);

create table if not exists public.parent_consent_tokens (
  token text primary key,
  child_user_id uuid not null references auth.users(id) on delete cascade,
  parent_email_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.consent_records (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  event text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.saved_careers enable row level security;
alter table public.parent_consent_tokens enable row level security;
alter table public.consent_records enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "saved_careers_select_own" on public.saved_careers;
create policy "saved_careers_select_own"
on public.saved_careers for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "saved_careers_insert_own" on public.saved_careers;
create policy "saved_careers_insert_own"
on public.saved_careers for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "saved_careers_delete_own" on public.saved_careers;
create policy "saved_careers_delete_own"
on public.saved_careers for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "consent_records_select_own" on public.consent_records;
create policy "consent_records_select_own"
on public.consent_records for select
to authenticated
using (auth.uid() = user_id);

grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.saved_careers to authenticated;
grant select on public.consent_records to authenticated;
grant usage, select on sequence public.consent_records_id_seq to authenticated;
