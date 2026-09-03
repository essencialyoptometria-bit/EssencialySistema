-- Execute esta migração no Supabase antes de publicar o novo frontend.
alter table public.schedules add column if not exists professional_id uuid references public.profiles(id);

create table if not exists public.triage_history (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  recorded_by uuid references public.profiles(id) on delete set null,
  recorded_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.triage_history enable row level security;
alter table public.notifications enable row level security;
grant select, insert on public.triage_history to authenticated;
grant select, update on public.notifications to authenticated;

drop policy if exists "clinical staff read triage history" on public.triage_history;
create policy "clinical staff read triage history" on public.triage_history for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.active and p.role in ('ADMIN','OPTOMETRISTA','RECEPCAO')));
drop policy if exists "staff record triage history" on public.triage_history;
create policy "staff record triage history" on public.triage_history for insert to authenticated
with check (recorded_by=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.active and p.role in ('ADMIN','OPTOMETRISTA','RECEPCAO')));
drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications" on public.notifications for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications" on public.notifications for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create or replace function private.notify_optometrist_on_booking() returns trigger language plpgsql security definer set search_path='' as $$
declare v_user uuid; v_patient text;
begin
  select s.professional_id into v_user from public.schedules s where s.id=new.schedule_id;
  select p.full_name into v_patient from public.patients p where p.id=new.patient_id;
  if v_user is not null then
    insert into public.notifications(user_id,appointment_id,title,message)
    values(v_user,new.id,'Nova consulta marcada',coalesce(v_patient,'Paciente')||' foi agendado(a) para '||to_char(new.starts_at at time zone 'America/Sao_Paulo','DD/MM/YYYY às HH24:MI'));
  end if;
  return new;
end $$;
drop trigger if exists appointment_notify_optometrist on public.appointments;
create trigger appointment_notify_optometrist after insert on public.appointments for each row execute function private.notify_optometrist_on_booking();

-- Compatibilidade com bancos onde role é enum ou validado por CHECK.
do $$ declare enum_name text; begin
  select t.typname into enum_name from pg_attribute a join pg_type t on t.oid=a.atttypid where a.attrelid='public.profiles'::regclass and a.attname='role' and t.typtype='e';
  if enum_name is not null then execute format('alter type public.%I add value if not exists %L',enum_name,'AGENDA'); end if;
end $$;
do $$ declare c record; is_enum boolean; begin
  select t.typtype='e' into is_enum from pg_attribute a join pg_type t on t.oid=a.atttypid where a.attrelid='public.profiles'::regclass and a.attname='role';
  if is_enum then return; end if;
  for c in select conname from pg_constraint where conrelid='public.profiles'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%role%' loop
    execute format('alter table public.profiles drop constraint %I',c.conname);
  end loop;
  alter table public.profiles add constraint profiles_role_check check (role in ('ADMIN','OPTOMETRISTA','RECEPCAO','AGENDA'));
end $$;

create index if not exists triage_history_patient_date_idx on public.triage_history(patient_id,recorded_at desc);
create index if not exists triage_history_appointment_idx on public.triage_history(appointment_id);
create index if not exists triage_history_recorded_by_idx on public.triage_history(recorded_by);
create index if not exists notifications_user_date_idx on public.notifications(user_id,created_at desc);
create index if not exists notifications_appointment_idx on public.notifications(appointment_id);

drop policy if exists "schedules_delete" on public.schedules;
create policy "schedules_delete" on public.schedules for delete to authenticated
using ((select private.is_clinical()) or (select private.same_store(store_id)));
