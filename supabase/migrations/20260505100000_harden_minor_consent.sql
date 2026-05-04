alter table public.profiles
  drop constraint if exists profiles_age_band_check;

update public.profiles
set age_band = '13-15'
where age_band = '14-15';

alter table public.profiles
  add constraint profiles_age_band_check
  check (age_band in ('unknown', '10-12', '13-15', '16-17', '18+', 'parent'));

revoke insert, update on public.profiles from authenticated;
grant select on public.profiles to authenticated;

drop policy if exists "saved_careers_insert_own" on public.saved_careers;
create policy "saved_careers_insert_own"
on public.saved_careers for insert
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

drop policy if exists "saved_careers_delete_own" on public.saved_careers;
create policy "saved_careers_delete_own"
on public.saved_careers for delete
to authenticated
using (auth.uid() = user_id);

revoke usage, select on sequence public.consent_records_id_seq from authenticated;
