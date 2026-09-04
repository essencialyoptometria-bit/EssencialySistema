alter table public.crm_contacts
  add column if not exists return_completed_at timestamptz;

create index if not exists crm_contacts_pending_return_idx
  on public.crm_contacts (scheduled_return_at)
  where scheduled_return_at is not null and return_completed_at is null;

-- Remove registros cancelados antigos para liberar seus horários. O cadastro
-- dos pacientes permanece intacto por causa da chave estrangeira restritiva.
delete from public.appointments
where status = 'CANCELADO';
