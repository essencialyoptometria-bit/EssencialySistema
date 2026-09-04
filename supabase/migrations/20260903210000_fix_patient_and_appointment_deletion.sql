-- Cancelar um horário remove apenas o agendamento. Usuários da agenda
-- podem excluir agendamentos da própria ótica e a equipe clínica pode excluir todos.
drop policy if exists "appointments_delete_cancelled" on public.appointments;
drop policy if exists "appointments_delete" on public.appointments;

create policy "appointments_delete"
on public.appointments
for delete
to authenticated
using (
  (select private.is_clinical())
  or (select private.same_store(store_id))
);

-- O cadastro do paciente só pode ser excluído pelo administrador e quando
-- não existe nenhum agendamento vinculado a ele.
drop policy if exists "patients_delete" on public.patients;

create policy "patients_delete"
on public.patients
for delete
to authenticated
using (
  (select private.is_admin())
  and not exists (
    select 1
    from public.appointments
    where appointments.patient_id = patients.id
  )
);

-- Quando o paciente não possui agendamentos, seus registros clínicos e de
-- CRM são apagados junto para não deixarem o cadastro preso por chave externa.
alter table public.consultations
  drop constraint if exists consultations_patient_id_fkey;
alter table public.consultations
  add constraint consultations_patient_id_fkey
  foreign key (patient_id) references public.patients(id) on delete cascade;

alter table public.prescriptions
  drop constraint if exists prescriptions_patient_id_fkey;
alter table public.prescriptions
  add constraint prescriptions_patient_id_fkey
  foreign key (patient_id) references public.patients(id) on delete cascade;

alter table public.crm_contacts
  drop constraint if exists crm_contacts_patient_id_fkey;
alter table public.crm_contacts
  add constraint crm_contacts_patient_id_fkey
  foreign key (patient_id) references public.patients(id) on delete cascade;
