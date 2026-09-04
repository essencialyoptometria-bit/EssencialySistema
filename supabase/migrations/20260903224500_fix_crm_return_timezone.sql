-- Valores antigos vieram de datetime-local sem fuso e foram interpretados
-- como UTC. Ajusta os lembretes existentes para o horário de Brasília.
update public.crm_contacts
set scheduled_return_at = scheduled_return_at + interval '3 hours'
where scheduled_return_at is not null
  and created_at < timestamptz '2026-09-04 01:00:00+00';
