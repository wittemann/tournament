-- Drop the hand-maintained standings table (ADR-0006: computed standings
-- replace it). Its 2025 contents stay in supabase/seed.sql. The old team
-- enum was only used by standings.team, so it goes with the table.
-- Nothing in app/ or lib/ reads the table (checked 2026-10-11).

alter publication supabase_realtime drop table public.standings;

drop table public.standings;

drop type public.team;
