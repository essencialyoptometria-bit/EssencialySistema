alter table public.schedules
  add column if not exists slot_times text[];
