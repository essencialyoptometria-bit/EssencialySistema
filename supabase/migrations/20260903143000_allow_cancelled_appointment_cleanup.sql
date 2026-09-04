drop policy if exists "appointments_delete_cancelled" on public.appointments;
create policy "appointments_delete_cancelled" on public.appointments
for delete to authenticated
using (
  status = 'CANCELADO'
  and ((select private.is_clinical()) or (select private.same_store(store_id)))
);

