create table if not exists public.saved_paths (
  user_id uuid primary key references auth.users(id) on delete cascade,
  path_id text not null,
  path_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists saved_paths_set_updated_at on public.saved_paths;
create trigger saved_paths_set_updated_at
before update on public.saved_paths
for each row execute function public.set_updated_at();

alter table public.saved_paths enable row level security;

drop policy if exists "saved_paths_select_own" on public.saved_paths;
create policy "saved_paths_select_own"
on public.saved_paths for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "saved_paths_insert_own" on public.saved_paths;
create policy "saved_paths_insert_own"
on public.saved_paths for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.consent_status in ('self', 'parent_confirmed')
  )
);

drop policy if exists "saved_paths_update_own" on public.saved_paths;
create policy "saved_paths_update_own"
on public.saved_paths for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.consent_status in ('self', 'parent_confirmed')
  )
);

drop policy if exists "saved_paths_delete_own" on public.saved_paths;
create policy "saved_paths_delete_own"
on public.saved_paths for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.saved_paths to authenticated;
