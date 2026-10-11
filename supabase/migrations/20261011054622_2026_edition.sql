-- 2026 edition schema (TODO section 2) plus the conversion of the 2025 data
-- that is still in the live project. The original 2025 rows stay in
-- supabase/seed.sql (old schema).
--
-- What this does:
--   * class enum gets 'Jugend'.
--   * halls and teams become tables (public read, realtime). games.location
--     turns into text referencing halls; the location enum is dropped. The
--     old team enum stays for standings.team until standings is dropped.
--   * games gets number, stage, label, home_ref, away_ref, scorer_class and
--     checks for the three row kinds (event, group game, placement game).
--   * duplicate unique index games_id_key is dropped.
--   * items.price becomes numeric(6,2).
--   * faq gets sort, link_url, link_label.
--   * anon loses all write privileges on the public tables; authenticated
--     keeps insert/update/delete for a future admin page (ADR-0007).
--   * pg_graphql is dropped in the next migration (own file, so a privilege
--     problem there can't roll back this one).
--
-- Decisions:
--   * A team is name + class. games.hometeam/awayteam stay text columns and
--     get composite FKs (name, class) -> teams, on update cascade, so typos
--     are rejected and renames propagate. Changing a team's class is rejected
--     while it has games (unless every opponent also exists in the new
--     class; then games.class would follow); delete and re-add instead.
--   * scorer references a team of any class through (scorer, scorer_class).
--     2025: scorer_class = the game's class if a team of that name exists
--     there, else the (single) other class with that name. The T-Ball team
--     "Bretten" kept score in Schüler games.
--   * teams.group_name is a single capital letter (A-Z), matching the ref
--     grammar below and the design's "A1" / "5. Gruppe A". 2025 groups come
--     from the hand-entered standings positions (A1, B2, ...).
--   * Hall sort: Halle 1-3 = 1-3, Essensraum = 99 (events only, sorts last
--     and leaves room for more halls).
--   * games.number: one sequence per event, 1..n, unique, required for games,
--     optional for events (2025 events get none). 2025 games are numbered in
--     schedule order (time, then hall sort, then id) across both classes,
--     not by the old ids: the old ids look random in the schedule, which is
--     what the number is meant to fix. winner:/loser: refs use number.
--     The unique constraint is plain (not deferrable): swapping two numbers
--     in the table editor needs a temporary value in between.
--   * Ref grammar (home_ref / away_ref), enforced by games_ref_format:
--       seed:<n>         seed n of the game's class across all groups
--                        (ADR-0006), e.g. seed:4
--       group:<G>:<n>    place n of group G of the game's class, e.g.
--                        group:A:5 ("5. Gruppe A", shown as "A5")
--       winner:<number>  winner of the game with that games.number
--       loser:<number>   loser of the game with that games.number
--     A mini round robin (2025: Schüler 11-13, T-Ball 5-7) is a set of
--     placement games sharing one label, each referencing seeds (seed:11 v
--     seed:12, ...); the app ranks them like a group table. Whether a
--     winner:/loser: target exists, is a placement game and is of the same
--     class is not checked in SQL (a ref is text, not an FK); the app has to
--     validate it.
--   * Placement games: hometeam/awayteam are always NULL. Resolved teams are
--     computed in the app only and never written back (decided 2026-10-11).
--   * Strict by design: a placement game needs both refs and a label from
--     the start (no "half done" rows); the schedule is written in one go.
--   * Placement games can't end tied (games_placement_no_tie). Scores >= 0.
--   * 2025 placement games are matched by content (class, time, hall, home,
--     away), not by id, so the conversion is a no-op on an empty database.
--     The migration fails if only some of the 17 known placement games match.

-- 1. Jugend -------------------------------------------------------------------
-- Not used in this migration (a new enum value can't be used in the same
-- transaction).
alter type public.class add value if not exists 'Jugend';

-- 2. Halls --------------------------------------------------------------------
create table public.halls (
  name text primary key check (name <> '' and name = btrim(name)),
  sort smallint not null unique
);
comment on table public.halls is 'Places where games and events happen; sort = display order';
alter table public.halls enable row level security;
create policy "Enable read access for all users" on public.halls
  for select to public using (true);

insert into public.halls (name, sort) values
  ('Halle 1', 1),
  ('Halle 2', 2),
  ('Halle 3', 3),
  ('Essensraum', 99);

alter table public.games
  alter column location type text using location::text;
alter table public.games
  add constraint games_location_fkey foreign key (location)
    references public.halls (name) on update cascade;
drop type public.location;

-- 3. Teams --------------------------------------------------------------------
create table public.teams (
  name text not null check (name <> '' and name = btrim(name)),
  class public.class not null,
  group_name text check (group_name ~ '^[A-Z]$'),
  primary key (name, class)
);
comment on table public.teams is 'A team is name + class; group_name = group letter for the group stage';
alter table public.teams enable row level security;
create policy "Enable read access for all users" on public.teams
  for select to public using (true);

-- Every team that plays a game (existing data). Scorer-only names that never
-- play would have no team; the scorer check below fails in that case.
insert into public.teams (name, class)
select distinct t.name, g.class
from public.games g
cross join lateral (values (g.hometeam), (g.awayteam)) as t (name)
where t.name is not null;

-- Groups from the hand-entered standings positions (A1, B2, ...).
update public.teams t
set group_name = left(s.position, 1)
from public.standings s
where s.team::text = t.name
  and s.class = t.class
  and s.position ~ '^[A-Z][0-9]+$';

alter table public.games
  add constraint games_hometeam_fkey foreign key (hometeam, class)
    references public.teams (name, class) on update cascade,
  add constraint games_awayteam_fkey foreign key (awayteam, class)
    references public.teams (name, class) on update cascade;

-- Scorer: team of any class.
alter table public.games add column scorer_class public.class;

update public.games g
set scorer_class = coalesce(
  (select t.class from public.teams t where t.name = g.scorer and t.class = g.class),
  -- scalar subquery: errors if the name exists in more than one other class
  (select t.class from public.teams t where t.name = g.scorer and t.class <> g.class)
)
where g.scorer is not null;

-- Fails if a scorer matched no team.
alter table public.games
  add constraint games_scorer_pair_check
    check ((scorer is null) = (scorer_class is null)),
  add constraint games_scorer_fkey foreign key (scorer, scorer_class)
    references public.teams (name, class) on update cascade;

-- 4. Game number, stage, label, refs -------------------------------------------
alter table public.games
  add column number smallint check (number > 0),
  add column stage text check (stage in ('group', 'placement')),
  add column label text check (label <> ''),
  add column home_ref text,
  add column away_ref text,
  add constraint games_number_key unique (number);

-- 2025: number games in schedule order across the whole event.
update public.games g
set number = n.number
from (
  select g2.id, row_number() over (order by g2.time, h.sort, g2.id) as number
  from public.games g2
  join public.halls h on h.name = g2.location
  where g2.eventname is null
) n
where g.id = n.id;

-- 2025 placement games, worked out from ADR-0006 "What the 2025 data shows".
-- Seeds: group place, then win rate, then run difference. Refs written as
-- winner:{label} / loser:{label} are replaced by that game's number below.
create temporary table placement_2025 (
  class public.class not null,
  time time not null,
  location text not null,
  hometeam text not null,
  awayteam text not null,
  label text not null,
  home_ref text not null,
  away_ref text not null
);

insert into placement_2025 values
  ('Schüler', '18:00', 'Halle 1', 'Mannheim', 'Nagold', 'Halbfinale 1', 'seed:1', 'seed:4'),
  ('Schüler', '18:00', 'Halle 2', 'Herrenberg', 'Darmstadt 1', 'Halbfinale 2', 'seed:3', 'seed:2'),
  ('Schüler', '18:30', 'Halle 1', 'Nagold', 'Darmstadt 1', 'Finale', 'winner:{Halbfinale 1}', 'winner:{Halbfinale 2}'),
  ('Schüler', '18:30', 'Halle 2', 'Mannheim', 'Herrenberg', 'Spiel um Platz 3', 'loser:{Halbfinale 1}', 'loser:{Halbfinale 2}'),
  ('Schüler', '17:00', 'Halle 1', 'Heidelberg', 'Schriesheim', 'Platz 5/6', 'seed:5', 'seed:6'),
  ('Schüler', '17:30', 'Halle 1', 'Bretten 1', 'Remchingen', 'Platz 7/8', 'seed:7', 'seed:8'),
  ('Schüler', '17:30', 'Halle 2', 'Stuttgart 1', 'Darmstadt 2', 'Platz 9/10', 'seed:9', 'seed:10'),
  ('Schüler', '17:00', 'Halle 3', 'Karlsruhe', 'Stuttgart 2', 'Platzierungsrunde 11–13', 'seed:11', 'seed:12'),
  ('Schüler', '17:30', 'Halle 3', 'Stuttgart 2', 'Bretten 2', 'Platzierungsrunde 11–13', 'seed:12', 'seed:13'),
  ('Schüler', '18:00', 'Halle 3', 'Bretten 2', 'Karlsruhe', 'Platzierungsrunde 11–13', 'seed:13', 'seed:11'),
  ('T-Ball', '12:00', 'Halle 1', 'Nagold', 'Remchingen', 'Halbfinale 1', 'seed:1', 'seed:4'),
  ('T-Ball', '12:00', 'Halle 2', 'Karlsruhe', 'Schriesheim', 'Halbfinale 2', 'seed:2', 'seed:3'),
  ('T-Ball', '12:30', 'Halle 1', 'Nagold', 'Karlsruhe', 'Finale', 'winner:{Halbfinale 1}', 'winner:{Halbfinale 2}'),
  ('T-Ball', '12:30', 'Halle 2', 'Remchingen', 'Schriesheim', 'Spiel um Platz 3', 'loser:{Halbfinale 1}', 'loser:{Halbfinale 2}'),
  ('T-Ball', '12:00', 'Halle 3', 'Stuttgart 2', 'Stuttgart 1', 'Platzierungsrunde 5–7', 'seed:5', 'seed:6'),
  ('T-Ball', '12:30', 'Halle 3', 'Stuttgart 1', 'Bretten', 'Platzierungsrunde 5–7', 'seed:6', 'seed:7'),
  ('T-Ball', '13:00', 'Halle 3', 'Bretten', 'Stuttgart 2', 'Platzierungsrunde 5–7', 'seed:7', 'seed:5');

update public.games g
set stage = 'placement', label = p.label, home_ref = p.home_ref, away_ref = p.away_ref
from placement_2025 p
where g.eventname is null
  and g.class = p.class
  and g.time = p.time
  and g.location = p.location
  and g.hometeam = p.hometeam
  and g.awayteam = p.awayteam;

do $$
declare
  matched int;
begin
  select count(*) into matched from public.games where stage = 'placement';
  if matched not in (0, 17) then
    raise exception '2025 conversion: % of 17 placement games matched', matched;
  end if;
end $$;

-- winner:{label} / loser:{label} -> winner:<number> / loser:<number>
update public.games g
set home_ref = regexp_replace(g.home_ref, '\{.*\}', t.number::text)
from public.games t
where g.home_ref like '%{%'
  and t.class = g.class
  and t.stage = 'placement'
  and t.label = substring(g.home_ref from '\{(.*)\}');

update public.games g
set away_ref = regexp_replace(g.away_ref, '\{.*\}', t.number::text)
from public.games t
where g.away_ref like '%{%'
  and t.class = g.class
  and t.stage = 'placement'
  and t.label = substring(g.away_ref from '\{(.*)\}');

drop table placement_2025;

-- Resolved teams are computed in the app, never stored.
update public.games
set hometeam = null, awayteam = null
where stage = 'placement';

update public.games
set stage = 'group'
where eventname is null and stage is null;

alter table public.games
  add constraint games_ref_format_check check (
    (home_ref is null or home_ref ~ '^(seed:[1-9][0-9]{0,2}|group:[A-Z]:[1-9][0-9]{0,2}|(winner|loser):[1-9][0-9]{0,4})$')
    and (away_ref is null or away_ref ~ '^(seed:[1-9][0-9]{0,2}|group:[A-Z]:[1-9][0-9]{0,2}|(winner|loser):[1-9][0-9]{0,4})$')
  ),
  -- Every row is either an event or a game with a stage.
  add constraint games_event_or_stage_check
    check ((eventname is null) = (stage is not null)),
  add constraint games_event_shape_check check (
    eventname is null
    or (hometeam is null and awayteam is null and home_ref is null and away_ref is null
        and homescore is null and awayscore is null and scorer is null and label is null)
  ),
  add constraint games_number_required_check
    check (eventname is not null or number is not null),
  add constraint games_group_shape_check check (
    stage is distinct from 'group'
    or (hometeam is not null and awayteam is not null and hometeam <> awayteam
        and home_ref is null and away_ref is null)
  ),
  add constraint games_placement_shape_check check (
    stage is distinct from 'placement'
    or (hometeam is null and awayteam is null
        and home_ref is not null and away_ref is not null and home_ref <> away_ref
        and label is not null)
  ),
  add constraint games_placement_no_tie_check check (
    stage is distinct from 'placement' or homescore is null or awayscore is null
    or homescore <> awayscore
  ),
  add constraint games_scores_nonnegative_check
    check (homescore >= 0 and awayscore >= 0);

-- 5. Duplicate index ------------------------------------------------------------
alter table public.games drop constraint games_id_key;

-- 6. Money ------------------------------------------------------------------------
alter table public.items
  alter column price type numeric(6, 2) using round(price::numeric, 2);
alter table public.items
  add constraint items_price_nonnegative_check check (price >= 0);

-- 7. FAQ sort and link ----------------------------------------------------------
-- The app should order by sort (nulls last), then question. Existing links
-- stay in the HTML answers for now.
alter table public.faq
  add column sort smallint,
  add column link_url text,
  add column link_label text,
  add constraint faq_link_pair_check
    check ((link_url is null) = (link_label is null)),
  add constraint faq_link_url_check
    check (link_url ~ '^https://[^[:space:]]+$'),
  add constraint faq_link_label_check
    check (link_label <> '');

update public.faq f
set sort = s.sort
from (select id, row_number() over (order by question, id) as sort from public.faq) s
where f.id = s.id;

-- 8. Access and realtime ----------------------------------------------------------
-- RLS and the read policies are set right after each create table above.
-- Defence in depth on top of RLS: anon never writes; authenticated keeps
-- insert/update/delete for a future admin page (ADR-0007).
revoke insert, update, delete, truncate, trigger, references
  on public.halls, public.teams, public.games, public.standings, public.items, public.faq
  from anon;
revoke truncate, trigger, references
  on public.halls, public.teams, public.games, public.standings, public.items, public.faq
  from authenticated;

alter publication supabase_realtime add table public.halls, public.teams;
