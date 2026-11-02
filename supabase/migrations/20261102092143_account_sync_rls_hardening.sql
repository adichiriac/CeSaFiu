-- Keep the consent check inside RLS instead of exposing a SECURITY DEFINER
-- helper through the Data API.

drop policy if exists "test_results_insert_own" on public.test_results;
create policy "test_results_insert_own"
on public.test_results for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.age_band <> 'unknown'
      and p.consent_status in ('self', 'parent_confirmed')
  )
);

drop policy if exists "test_results_update_own" on public.test_results;
create policy "test_results_update_own"
on public.test_results for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.age_band <> 'unknown'
      and p.consent_status in ('self', 'parent_confirmed')
  )
);

drop policy if exists "saved_universities_insert_own" on public.saved_universities;
create policy "saved_universities_insert_own"
on public.saved_universities for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.age_band <> 'unknown'
      and p.consent_status in ('self', 'parent_confirmed')
  )
);

drop function if exists public.can_persist_account_data();
