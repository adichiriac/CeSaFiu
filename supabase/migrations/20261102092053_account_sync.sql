-- Cross-device sync for logged-in students:
--   * test_results         — latest result per instrument (mirrors localStorage
--                            `cesafiu:test:<slug>:latest`)
--   * saved_universities   — mirrors localStorage `cesafiu:saved-universities`
--
-- Same minor-consent gate as saved_careers / saved_paths: writes are only
-- allowed when the profile is 'self' or 'parent_confirmed'. Under-16 students
-- waiting for parent consent keep everything local-only.

create or replace function public.can_persist_account_data()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.age_band <> 'unknown'
      and p.consent_status in ('self', 'parent_confirmed')
  );
$$;

revoke all on function public.can_persist_account_data() from public;
grant execute on function public.can_persist_account_data() to authenticated;

-- ── test_results ────────────────────────────────────────────────────────────

create table if not exists public.test_results (
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null
    check (slug in ('scenarii', 'personalitate', 'ipip-neo-60', 'vocational', 'vocational-deep', 'valori')),
  payload jsonb not null
    check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) < 65536),
  completed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, slug)
);

drop trigger if exists test_results_set_updated_at on public.test_results;
create trigger test_results_set_updated_at
before update on public.test_results
for each row execute function public.set_updated_at();

alter table public.test_results enable row level security;

drop policy if exists "test_results_select_own" on public.test_results;
create policy "test_results_select_own"
on public.test_results for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "test_results_insert_own" on public.test_results;
create policy "test_results_insert_own"
on public.test_results for insert
to authenticated
with check ((select auth.uid()) = user_id and (select public.can_persist_account_data()));

drop policy if exists "test_results_update_own" on public.test_results;
create policy "test_results_update_own"
on public.test_results for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and (select public.can_persist_account_data()));

drop policy if exists "test_results_delete_own" on public.test_results;
create policy "test_results_delete_own"
on public.test_results for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.test_results to authenticated;

-- ── saved_universities ──────────────────────────────────────────────────────

create table if not exists public.saved_universities (
  user_id uuid not null references auth.users(id) on delete cascade,
  institution_id text not null check (char_length(institution_id) between 1 and 128),
  created_at timestamptz not null default now(),
  primary key (user_id, institution_id)
);

alter table public.saved_universities enable row level security;

drop policy if exists "saved_universities_select_own" on public.saved_universities;
create policy "saved_universities_select_own"
on public.saved_universities for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "saved_universities_insert_own" on public.saved_universities;
create policy "saved_universities_insert_own"
on public.saved_universities for insert
to authenticated
with check ((select auth.uid()) = user_id and (select public.can_persist_account_data()));

drop policy if exists "saved_universities_delete_own" on public.saved_universities;
create policy "saved_universities_delete_own"
on public.saved_universities for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, delete on public.saved_universities to authenticated;
