-- The event day, so the app shows "läuft" and the "Jetzt" line on that day only.
-- One row (id is fixed to 1); no row means every day counts as the event day.
create table public.event (
  id smallint primary key default 1 check (id = 1),
  date date not null
);
comment on table public.event is 'Single row: the date of the event; live status shows on that day only';
alter table public.event enable row level security;
create policy "Enable read access for all users" on public.event
  for select to public using (true);

-- Defence in depth on top of RLS (ADR-0007), as on the other tables.
revoke insert, update, delete, truncate, trigger, references on public.event from anon;
revoke truncate, trigger, references on public.event from authenticated;

alter publication supabase_realtime add table public.event;
