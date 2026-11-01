-- Placement games can name their scorer by role (the loser of "Spiel um Platz
-- 3" scores the Finale), because the teams aren't known until the groups
-- finish. games.scorer is a real team (FK), so the role gets its own column.
--
-- Decisions:
--   * scorer_ref has the grammar of home_ref / away_ref (see
--     20261011054622_2026_edition.sql) and always means a team of the game's
--     own class, so there is no class column for it and scorer_class stays
--     NULL (games_scorer_pair_check).
--   * A game has a fixed scorer or a role, never both; only placement games
--     can have a role.
--   * Resolved teams are computed in the app only and never written back,
--     like home_ref / away_ref (ADR-0006). Whether a winner:/loser: target
--     exists is not checked in SQL; the schedule checker does that.
alter table public.games add column scorer_ref text;

comment on column public.games.scorer_ref is 'Scorer by role on a placement game (seed:<n>, group:<G>:<n>, winner:<number>, loser:<number>), a team of the game''s class; resolved in the app';

alter table public.games
  add constraint games_scorer_ref_format_check check (
    scorer_ref is null
    or scorer_ref ~ '^(seed:[1-9][0-9]{0,2}|group:[A-Z]:[1-9][0-9]{0,2}|(winner|loser):[1-9][0-9]{0,4})$'
  ),
  add constraint games_scorer_or_ref_check
    check (scorer is null or scorer_ref is null),
  add constraint games_scorer_ref_placement_check
    check (scorer_ref is null or stage = 'placement');
