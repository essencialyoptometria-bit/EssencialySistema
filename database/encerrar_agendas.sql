-- Aplicar antes de publicar o frontend. Script idempotente.
-- Mantém as políticas RLS e as permissões existentes de cada loja.
begin;
alter table public.schedules add column if not exists closed_at timestamptz;

create or replace function private.guard_schedule_closure()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if TG_OP = 'DELETE' then
    if old.closed_at is not null then
      raise exception 'Agenda encerrada: o histórico deve ser preservado.';
    end if;
    return old;
  end if;
  if TG_OP = 'INSERT' then
    if new.closed_at is not null then raise exception 'Crie a agenda aberta antes de encerrar.'; end if;
    return new;
  end if;
  if old.closed_at is not null and new.closed_at is not null then
    raise exception 'Agenda encerrada: alterações bloqueadas.';
  end if;
  if old.closed_at is null and new.closed_at is not null then
    if not exists (select 1 from public.appointments where schedule_id = new.id) then
      raise exception 'Esta agenda ainda não possui agendamentos.';
    end if;
    if exists (select 1 from public.appointments where schedule_id = new.id and status::text not in ('ATENDIDO','FALTOSO','CANCELADO')) then
      raise exception 'Ainda há atendimentos pendentes. Finalize as consultas ou registre faltas/cancelamentos antes de encerrar.';
    end if;
    new.closed_at := now();
  end if;
  return new;
end $$;
revoke all on function private.guard_schedule_closure() from public, anon, authenticated;
drop trigger if exists guard_schedule_closure on public.schedules;
create trigger guard_schedule_closure before insert or update or delete on public.schedules
for each row execute function private.guard_schedule_closure();

create or replace function private.guard_closed_schedule_appointments()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare schedule_record record; target_id uuid;
begin
  if TG_OP = 'DELETE' then target_id := old.schedule_id;
  else target_id := new.schedule_id; end if;
  -- O mesmo bloqueio de linha serializa o encerramento e a inclusão de pacientes.
  -- Ao mudar de agenda, bloqueia origem e destino na mesma ordem.
  if TG_OP = 'UPDATE' then
    for schedule_record in
      select id, closed_at from public.schedules
      where id in (old.schedule_id, new.schedule_id) order by id for no key update
    loop
      if schedule_record.closed_at is not null then
        raise exception 'Agenda encerrada: novos agendamentos e alterações estão bloqueados.';
      end if;
    end loop;
  else
    for schedule_record in
      select id, closed_at from public.schedules where id = target_id for no key update
    loop
      if schedule_record.closed_at is not null then
        raise exception 'Agenda encerrada: novos agendamentos e alterações estão bloqueados.';
      end if;
    end loop;
  end if;
  return case when TG_OP = 'DELETE' then old else new end;
end $$;
revoke all on function private.guard_closed_schedule_appointments() from public, anon, authenticated;
drop trigger if exists guard_closed_schedule_appointments on public.appointments;
create trigger guard_closed_schedule_appointments before insert or update or delete on public.appointments
for each row execute function private.guard_closed_schedule_appointments();
commit;
