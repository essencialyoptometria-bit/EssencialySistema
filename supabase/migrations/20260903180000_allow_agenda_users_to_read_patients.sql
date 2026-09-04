create or replace function private.can_read_all_patients()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.active
      and p.role in ('ADMIN', 'OPTOMETRISTA', 'RECEPCAO', 'AGENDA')
  );
$$;

revoke all on function private.can_read_all_patients() from public, anon;
grant execute on function private.can_read_all_patients() to authenticated;

drop policy if exists "patients_read" on public.patients;
create policy "patients_read"
on public.patients
for select
to authenticated
using ((select private.can_read_all_patients()));
