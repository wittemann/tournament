/**
 * The 2025 Xmas-Ball in the 2026 schema, as reference data for the computed
 * standings (ADR-0006).
 *
 * games2025 / teams2025: read-only export of the live Supabase project on
 * 2026-10-11, which holds exactly the 2025 data as converted by
 * supabase/migrations/20261011054622_2026_edition.sql (games numbered in
 * schedule order, placement games with refs and hometeam/awayteam = null).
 * The original rows, in the old schema and with the hand-entered
 * `standings` table, are in supabase/seed.sql. (The literal was generated
 * from seed.sql with the migration's rules and checked to be identical to
 * the live rows.)
 *
 * The expected values below are transcribed from seed.sql.
 */
import type { Game } from '@/app/types';
import type { GameClass, TeamLike } from '@/lib/standings';

export type Fixture2025Game = Omit<Game, 'id'>;

/** The classes that played in 2025. */
export type Class2025 = Extract<GameClass, 'Schüler' | 'T-Ball'>;

export interface PlacementTeams2025 {
  number: number;
  class: GameClass;
  label: string;
  /** The teams that actually played the game (seed.sql hometeam/awayteam). */
  home: string;
  away: string;
}

export interface ExpectedRow {
  team: string;
  wins: number;
  losses: number;
  diff: number;
}

// prettier-ignore
export const games2025: Fixture2025Game[] = [
  { number: null, class: 'Schüler', stage: null, label: null, hometeam: null, awayteam: null, home_ref: null, away_ref: null, homescore: null, awayscore: null, time: '12:30:00', location: 'Essensraum', eventname: '📋 Technische Konferenz', scorer: null, scorer_class: null },
  { number: 16, class: 'Schüler', stage: 'group', label: null, hometeam: 'Bretten 2', awayteam: 'Darmstadt 2', home_ref: null, away_ref: null, homescore: 14, awayscore: 22, time: '13:00:00', location: 'Halle 2', eventname: null, scorer: 'Mannheim', scorer_class: 'Schüler' },
  { number: 18, class: 'Schüler', stage: 'group', label: null, hometeam: 'Bretten 1', awayteam: 'Stuttgart 2', home_ref: null, away_ref: null, homescore: 22, awayscore: 13, time: '13:30:00', location: 'Halle 1', eventname: null, scorer: 'Heidelberg', scorer_class: 'Schüler' },
  { number: 19, class: 'Schüler', stage: 'group', label: null, hometeam: 'Schriesheim', awayteam: 'Karlsruhe', home_ref: null, away_ref: null, homescore: 15, awayscore: 13, time: '13:30:00', location: 'Halle 2', eventname: null, scorer: 'Darmstadt 1', scorer_class: 'Schüler' },
  { number: 20, class: 'Schüler', stage: 'group', label: null, hometeam: 'Mannheim', awayteam: 'Remchingen', home_ref: null, away_ref: null, homescore: 27, awayscore: 11, time: '13:30:00', location: 'Halle 3', eventname: null, scorer: 'Nagold', scorer_class: 'Schüler' },
  { number: 21, class: 'Schüler', stage: 'group', label: null, hometeam: 'Heidelberg', awayteam: 'Herrenberg', home_ref: null, away_ref: null, homescore: 16, awayscore: 15, time: '14:00:00', location: 'Halle 1', eventname: null, scorer: 'Bretten 1', scorer_class: 'Schüler' },
  { number: 22, class: 'Schüler', stage: 'group', label: null, hometeam: 'Darmstadt 2', awayteam: 'Mannheim', home_ref: null, away_ref: null, homescore: 13, awayscore: 26, time: '14:00:00', location: 'Halle 2', eventname: null, scorer: 'Bretten 2', scorer_class: 'Schüler' },
  { number: 23, class: 'Schüler', stage: 'group', label: null, hometeam: 'Nagold', awayteam: 'Bretten 2', home_ref: null, away_ref: null, homescore: 29, awayscore: 3, time: '14:00:00', location: 'Halle 3', eventname: null, scorer: 'Remchingen', scorer_class: 'Schüler' },
  { number: 24, class: 'Schüler', stage: 'group', label: null, hometeam: 'Remchingen', awayteam: 'Nagold', home_ref: null, away_ref: null, homescore: 11, awayscore: 16, time: '14:30:00', location: 'Halle 1', eventname: null, scorer: 'Bretten', scorer_class: 'T-Ball' },
  { number: 25, class: 'Schüler', stage: 'group', label: null, hometeam: 'Darmstadt 1', awayteam: 'Stuttgart 1', home_ref: null, away_ref: null, homescore: 25, awayscore: 8, time: '14:30:00', location: 'Halle 2', eventname: null, scorer: 'Schriesheim', scorer_class: 'Schüler' },
  { number: 26, class: 'Schüler', stage: 'group', label: null, hometeam: 'Mannheim', awayteam: 'Bretten 2', home_ref: null, away_ref: null, homescore: 35, awayscore: 10, time: '14:30:00', location: 'Halle 3', eventname: null, scorer: 'Darmstadt 2', scorer_class: 'Schüler' },
  { number: 27, class: 'Schüler', stage: 'group', label: null, hometeam: 'Stuttgart 2', awayteam: 'Heidelberg', home_ref: null, away_ref: null, homescore: 16, awayscore: 27, time: '15:00:00', location: 'Halle 1', eventname: null, scorer: 'Herrenberg', scorer_class: 'Schüler' },
  { number: 28, class: 'Schüler', stage: 'group', label: null, hometeam: 'Karlsruhe', awayteam: 'Darmstadt 1', home_ref: null, away_ref: null, homescore: 15, awayscore: 16, time: '15:00:00', location: 'Halle 2', eventname: null, scorer: 'Stuttgart 1', scorer_class: 'Schüler' },
  { number: 29, class: 'Schüler', stage: 'group', label: null, hometeam: 'Remchingen', awayteam: 'Darmstadt 2', home_ref: null, away_ref: null, homescore: 23, awayscore: 8, time: '15:00:00', location: 'Halle 3', eventname: null, scorer: 'Bretten 2', scorer_class: 'Schüler' },
  { number: 30, class: 'Schüler', stage: 'group', label: null, hometeam: 'Herrenberg', awayteam: 'Bretten 1', home_ref: null, away_ref: null, homescore: 22, awayscore: 19, time: '15:30:00', location: 'Halle 1', eventname: null, scorer: 'Stuttgart 2', scorer_class: 'Schüler' },
  { number: 31, class: 'Schüler', stage: 'group', label: null, hometeam: 'Stuttgart 1', awayteam: 'Schriesheim', home_ref: null, away_ref: null, homescore: 22, awayscore: 24, time: '15:30:00', location: 'Halle 2', eventname: null, scorer: 'Karlsruhe', scorer_class: 'Schüler' },
  { number: 32, class: 'Schüler', stage: 'group', label: null, hometeam: 'Nagold', awayteam: 'Mannheim', home_ref: null, away_ref: null, homescore: 10, awayscore: 26, time: '15:30:00', location: 'Halle 3', eventname: null, scorer: 'Remchingen', scorer_class: 'Schüler' },
  { number: 33, class: 'Schüler', stage: 'group', label: null, hometeam: 'Herrenberg', awayteam: 'Stuttgart 2', home_ref: null, away_ref: null, homescore: 23, awayscore: 10, time: '16:00:00', location: 'Halle 1', eventname: null, scorer: 'Bretten 1', scorer_class: 'Schüler' },
  { number: 34, class: 'Schüler', stage: 'group', label: null, hometeam: 'Stuttgart 1', awayteam: 'Karlsruhe', home_ref: null, away_ref: null, homescore: 18, awayscore: 10, time: '16:00:00', location: 'Halle 2', eventname: null, scorer: 'Schriesheim', scorer_class: 'Schüler' },
  { number: 35, class: 'Schüler', stage: 'group', label: null, hometeam: 'Bretten 2', awayteam: 'Remchingen', home_ref: null, away_ref: null, homescore: 9, awayscore: 24, time: '16:00:00', location: 'Halle 3', eventname: null, scorer: 'Nagold', scorer_class: 'Schüler' },
  { number: 36, class: 'Schüler', stage: 'group', label: null, hometeam: 'Bretten 1', awayteam: 'Heidelberg', home_ref: null, away_ref: null, homescore: 15, awayscore: 14, time: '16:30:00', location: 'Halle 1', eventname: null, scorer: 'Stuttgart 2', scorer_class: 'Schüler' },
  { number: 37, class: 'Schüler', stage: 'group', label: null, hometeam: 'Schriesheim', awayteam: 'Darmstadt 1', home_ref: null, away_ref: null, homescore: 12, awayscore: 23, time: '16:30:00', location: 'Halle 2', eventname: null, scorer: 'Karlsruhe', scorer_class: 'Schüler' },
  { number: 38, class: 'Schüler', stage: 'group', label: null, hometeam: 'Darmstadt 2', awayteam: 'Nagold', home_ref: null, away_ref: null, homescore: 15, awayscore: 28, time: '16:30:00', location: 'Halle 3', eventname: null, scorer: 'Mannheim', scorer_class: 'Schüler' },
  { number: 39, class: 'Schüler', stage: 'placement', label: 'Platz 5/6', hometeam: null, awayteam: null, home_ref: 'seed:5', away_ref: 'seed:6', homescore: 22, awayscore: 12, time: '17:00:00', location: 'Halle 1', eventname: null, scorer: 'Remchingen', scorer_class: 'Schüler' },
  { number: 40, class: 'Schüler', stage: 'placement', label: 'Platzierungsrunde 11–13', hometeam: null, awayteam: null, home_ref: 'seed:11', away_ref: 'seed:12', homescore: 20, awayscore: 4, time: '17:00:00', location: 'Halle 3', eventname: null, scorer: 'Bretten 2', scorer_class: 'Schüler' },
  { number: 41, class: 'Schüler', stage: 'placement', label: 'Platz 7/8', hometeam: null, awayteam: null, home_ref: 'seed:7', away_ref: 'seed:8', homescore: 18, awayscore: 14, time: '17:30:00', location: 'Halle 1', eventname: null, scorer: 'Schriesheim', scorer_class: 'Schüler' },
  { number: 42, class: 'Schüler', stage: 'placement', label: 'Platz 9/10', hometeam: null, awayteam: null, home_ref: 'seed:9', away_ref: 'seed:10', homescore: 29, awayscore: 6, time: '17:30:00', location: 'Halle 2', eventname: null, scorer: 'Bretten', scorer_class: 'T-Ball' },
  { number: 43, class: 'Schüler', stage: 'placement', label: 'Platzierungsrunde 11–13', hometeam: null, awayteam: null, home_ref: 'seed:12', away_ref: 'seed:13', homescore: 23, awayscore: 9, time: '17:30:00', location: 'Halle 3', eventname: null, scorer: 'Karlsruhe', scorer_class: 'Schüler' },
  { number: 44, class: 'Schüler', stage: 'placement', label: 'Halbfinale 1', hometeam: null, awayteam: null, home_ref: 'seed:1', away_ref: 'seed:4', homescore: 15, awayscore: 20, time: '18:00:00', location: 'Halle 1', eventname: null, scorer: 'Bretten', scorer_class: 'T-Ball' },
  { number: 45, class: 'Schüler', stage: 'placement', label: 'Halbfinale 2', hometeam: null, awayteam: null, home_ref: 'seed:3', away_ref: 'seed:2', homescore: 10, awayscore: 14, time: '18:00:00', location: 'Halle 2', eventname: null, scorer: 'Bretten', scorer_class: 'T-Ball' },
  { number: 46, class: 'Schüler', stage: 'placement', label: 'Platzierungsrunde 11–13', hometeam: null, awayteam: null, home_ref: 'seed:13', away_ref: 'seed:11', homescore: 3, awayscore: 21, time: '18:00:00', location: 'Halle 3', eventname: null, scorer: 'Stuttgart 2', scorer_class: 'Schüler' },
  { number: 47, class: 'Schüler', stage: 'placement', label: 'Finale', hometeam: null, awayteam: null, home_ref: 'winner:44', away_ref: 'winner:45', homescore: 4, awayscore: 30, time: '18:30:00', location: 'Halle 1', eventname: null, scorer: 'Bretten', scorer_class: 'T-Ball' },
  { number: 48, class: 'Schüler', stage: 'placement', label: 'Spiel um Platz 3', hometeam: null, awayteam: null, home_ref: 'loser:44', away_ref: 'loser:45', homescore: 15, awayscore: 14, time: '18:30:00', location: 'Halle 2', eventname: null, scorer: 'Bretten', scorer_class: 'T-Ball' },
  { number: null, class: 'Schüler', stage: null, label: null, hometeam: null, awayteam: null, home_ref: null, away_ref: null, homescore: null, awayscore: null, time: '19:00:00', location: 'Essensraum', eventname: '🏆 Siegerehrung', scorer: null, scorer_class: null },
  { number: null, class: 'T-Ball', stage: null, label: null, hometeam: null, awayteam: null, home_ref: null, away_ref: null, homescore: null, awayscore: null, time: '09:00:00', location: 'Essensraum', eventname: '📋 Technische Konferenz', scorer: null, scorer_class: null },
  { number: 1, class: 'T-Ball', stage: 'group', label: null, hometeam: 'Bretten', awayteam: 'Stuttgart 2', home_ref: null, away_ref: null, homescore: 11, awayscore: 13, time: '09:30:00', location: 'Halle 1', eventname: null, scorer: 'Karlsruhe', scorer_class: 'T-Ball' },
  { number: 2, class: 'T-Ball', stage: 'group', label: null, hometeam: 'Nagold', awayteam: 'Schriesheim', home_ref: null, away_ref: null, homescore: 14, awayscore: 10, time: '09:30:00', location: 'Halle 2', eventname: null, scorer: 'Remchingen', scorer_class: 'T-Ball' },
  { number: 3, class: 'T-Ball', stage: 'group', label: null, hometeam: 'Stuttgart 1', awayteam: 'Karlsruhe', home_ref: null, away_ref: null, homescore: 13, awayscore: 20, time: '10:00:00', location: 'Halle 1', eventname: null, scorer: 'Nagold', scorer_class: 'T-Ball' },
  { number: 4, class: 'T-Ball', stage: 'group', label: null, hometeam: 'Schriesheim', awayteam: 'Bretten', home_ref: null, away_ref: null, homescore: 12, awayscore: 11, time: '10:00:00', location: 'Halle 2', eventname: null, scorer: 'Stuttgart 2', scorer_class: 'T-Ball' },
  { number: 5, class: 'T-Ball', stage: 'group', label: null, hometeam: 'Stuttgart 2', awayteam: 'Nagold', home_ref: null, away_ref: null, homescore: 8, awayscore: 14, time: '10:30:00', location: 'Halle 1', eventname: null, scorer: 'Bretten', scorer_class: 'T-Ball' },
  { number: 6, class: 'T-Ball', stage: 'group', label: null, hometeam: 'Karlsruhe', awayteam: 'Remchingen', home_ref: null, away_ref: null, homescore: 19, awayscore: 11, time: '10:30:00', location: 'Halle 2', eventname: null, scorer: 'Schriesheim', scorer_class: 'T-Ball' },
  { number: 7, class: 'T-Ball', stage: 'group', label: null, hometeam: 'Remchingen', awayteam: 'Stuttgart 1', home_ref: null, away_ref: null, homescore: 20, awayscore: 19, time: '11:00:00', location: 'Halle 1', eventname: null, scorer: 'Karlsruhe', scorer_class: 'T-Ball' },
  { number: 8, class: 'T-Ball', stage: 'group', label: null, hometeam: 'Bretten', awayteam: 'Nagold', home_ref: null, away_ref: null, homescore: 7, awayscore: 15, time: '11:00:00', location: 'Halle 2', eventname: null, scorer: 'Schriesheim', scorer_class: 'T-Ball' },
  { number: 9, class: 'T-Ball', stage: 'group', label: null, hometeam: 'Stuttgart 2', awayteam: 'Schriesheim', home_ref: null, away_ref: null, homescore: 8, awayscore: 15, time: '11:30:00', location: 'Halle 1', eventname: null, scorer: 'Stuttgart 1', scorer_class: 'T-Ball' },
  { number: 10, class: 'T-Ball', stage: 'placement', label: 'Halbfinale 1', hometeam: null, awayteam: null, home_ref: 'seed:1', away_ref: 'seed:4', homescore: 17, awayscore: 16, time: '12:00:00', location: 'Halle 1', eventname: null, scorer: 'Bretten', scorer_class: 'T-Ball' },
  { number: 11, class: 'T-Ball', stage: 'placement', label: 'Halbfinale 2', hometeam: null, awayteam: null, home_ref: 'seed:2', away_ref: 'seed:3', homescore: 8, awayscore: 4, time: '12:00:00', location: 'Halle 2', eventname: null, scorer: 'Bretten', scorer_class: 'T-Ball' },
  { number: 12, class: 'T-Ball', stage: 'placement', label: 'Platzierungsrunde 5–7', hometeam: null, awayteam: null, home_ref: 'seed:5', away_ref: 'seed:6', homescore: 8, awayscore: 9, time: '12:00:00', location: 'Halle 3', eventname: null, scorer: 'Bretten', scorer_class: 'T-Ball' },
  { number: 13, class: 'T-Ball', stage: 'placement', label: 'Finale', hometeam: null, awayteam: null, home_ref: 'winner:10', away_ref: 'winner:11', homescore: 8, awayscore: 12, time: '12:30:00', location: 'Halle 1', eventname: null, scorer: 'Bretten', scorer_class: 'T-Ball' },
  { number: 14, class: 'T-Ball', stage: 'placement', label: 'Spiel um Platz 3', hometeam: null, awayteam: null, home_ref: 'loser:10', away_ref: 'loser:11', homescore: 11, awayscore: 10, time: '12:30:00', location: 'Halle 2', eventname: null, scorer: 'Bretten', scorer_class: 'T-Ball' },
  { number: 15, class: 'T-Ball', stage: 'placement', label: 'Platzierungsrunde 5–7', hometeam: null, awayteam: null, home_ref: 'seed:6', away_ref: 'seed:7', homescore: 16, awayscore: 11, time: '12:30:00', location: 'Halle 3', eventname: null, scorer: 'Stuttgart 2', scorer_class: 'T-Ball' },
  { number: 17, class: 'T-Ball', stage: 'placement', label: 'Platzierungsrunde 5–7', hometeam: null, awayteam: null, home_ref: 'seed:7', away_ref: 'seed:5', homescore: 11, awayscore: 12, time: '13:00:00', location: 'Halle 3', eventname: null, scorer: 'Stuttgart 1', scorer_class: 'T-Ball' },
  { number: null, class: 'T-Ball', stage: null, label: null, hometeam: null, awayteam: null, home_ref: null, away_ref: null, homescore: null, awayscore: null, time: '13:30:00', location: 'Essensraum', eventname: '🏆 Siegerehrung', scorer: null, scorer_class: null },
];

/** Groups from the hand-entered positions (A1, B2, ...), as in the live teams table. */
// prettier-ignore
export const teams2025: TeamLike[] = [
  { name: 'Bretten 2', class: 'Schüler', group_name: 'A' },
  { name: 'Darmstadt 2', class: 'Schüler', group_name: 'A' },
  { name: 'Mannheim', class: 'Schüler', group_name: 'A' },
  { name: 'Nagold', class: 'Schüler', group_name: 'A' },
  { name: 'Remchingen', class: 'Schüler', group_name: 'A' },
  { name: 'Bretten 1', class: 'Schüler', group_name: 'B' },
  { name: 'Heidelberg', class: 'Schüler', group_name: 'B' },
  { name: 'Herrenberg', class: 'Schüler', group_name: 'B' },
  { name: 'Stuttgart 2', class: 'Schüler', group_name: 'B' },
  { name: 'Darmstadt 1', class: 'Schüler', group_name: 'C' },
  { name: 'Karlsruhe', class: 'Schüler', group_name: 'C' },
  { name: 'Schriesheim', class: 'Schüler', group_name: 'C' },
  { name: 'Stuttgart 1', class: 'Schüler', group_name: 'C' },
  { name: 'Bretten', class: 'T-Ball', group_name: 'A' },
  { name: 'Nagold', class: 'T-Ball', group_name: 'A' },
  { name: 'Schriesheim', class: 'T-Ball', group_name: 'A' },
  { name: 'Stuttgart 2', class: 'T-Ball', group_name: 'A' },
  { name: 'Karlsruhe', class: 'T-Ball', group_name: 'B' },
  { name: 'Remchingen', class: 'T-Ball', group_name: 'B' },
  { name: 'Stuttgart 1', class: 'T-Ball', group_name: 'B' },
];

/**
 * The teams that actually played each 2025 placement game (seed.sql games;
 * the migration matched them by class, time, hall and teams).
 */
// prettier-ignore
export const placementTeams2025: PlacementTeams2025[] = [
  { number: 10, class: 'T-Ball', label: 'Halbfinale 1', home: 'Nagold', away: 'Remchingen' },
  { number: 11, class: 'T-Ball', label: 'Halbfinale 2', home: 'Karlsruhe', away: 'Schriesheim' },
  { number: 12, class: 'T-Ball', label: 'Platzierungsrunde 5–7', home: 'Stuttgart 2', away: 'Stuttgart 1' },
  { number: 13, class: 'T-Ball', label: 'Finale', home: 'Nagold', away: 'Karlsruhe' },
  { number: 14, class: 'T-Ball', label: 'Spiel um Platz 3', home: 'Remchingen', away: 'Schriesheim' },
  { number: 15, class: 'T-Ball', label: 'Platzierungsrunde 5–7', home: 'Stuttgart 1', away: 'Bretten' },
  { number: 17, class: 'T-Ball', label: 'Platzierungsrunde 5–7', home: 'Bretten', away: 'Stuttgart 2' },
  { number: 39, class: 'Schüler', label: 'Platz 5/6', home: 'Heidelberg', away: 'Schriesheim' },
  { number: 40, class: 'Schüler', label: 'Platzierungsrunde 11–13', home: 'Karlsruhe', away: 'Stuttgart 2' },
  { number: 41, class: 'Schüler', label: 'Platz 7/8', home: 'Bretten 1', away: 'Remchingen' },
  { number: 42, class: 'Schüler', label: 'Platz 9/10', home: 'Stuttgart 1', away: 'Darmstadt 2' },
  { number: 43, class: 'Schüler', label: 'Platzierungsrunde 11–13', home: 'Stuttgart 2', away: 'Bretten 2' },
  { number: 44, class: 'Schüler', label: 'Halbfinale 1', home: 'Mannheim', away: 'Nagold' },
  { number: 45, class: 'Schüler', label: 'Halbfinale 2', home: 'Herrenberg', away: 'Darmstadt 1' },
  { number: 46, class: 'Schüler', label: 'Platzierungsrunde 11–13', home: 'Bretten 2', away: 'Karlsruhe' },
  { number: 47, class: 'Schüler', label: 'Finale', home: 'Nagold', away: 'Darmstadt 1' },
  { number: 48, class: 'Schüler', label: 'Spiel um Platz 3', home: 'Mannheim', away: 'Herrenberg' },
];

/**
 * Hand-entered group tables (seed.sql `standings`, positions A1, B2, ...),
 * in table order. Two run differences are corrected to what the results
 * give (Mannheim A1, Herrenberg B1); order, wins and losses are as entered.
 */
export const expectedGroupTables2025: Record<
  Class2025,
  Record<string, ExpectedRow[]>
> = {
  Schüler: {
    A: [
      // Entered as +71 in 2025, also a typo (not listed in ADR-0006): the
      // results give 27:11, 26:13, 35:10, 26:10 = 114 - 44 = +70.
      { team: 'Mannheim', wins: 4, losses: 0, diff: 70 },
      { team: 'Nagold', wins: 3, losses: 1, diff: 28 },
      { team: 'Remchingen', wins: 2, losses: 2, diff: 9 },
      { team: 'Darmstadt 2', wins: 1, losses: 3, diff: -33 },
      { team: 'Bretten 2', wins: 0, losses: 4, diff: -74 },
    ],
    B: [
      // Entered as +14 in 2025, a typo: the game results give 16:15 L,
      // 22:19 W, 23:10 W = 60 - 45 = +15 (ADR-0006).
      { team: 'Herrenberg', wins: 2, losses: 1, diff: 15 },
      { team: 'Heidelberg', wins: 2, losses: 1, diff: 11 },
      { team: 'Bretten 1', wins: 2, losses: 1, diff: 7 },
      { team: 'Stuttgart 2', wins: 0, losses: 3, diff: -33 },
    ],
    C: [
      { team: 'Darmstadt 1', wins: 3, losses: 0, diff: 29 },
      { team: 'Schriesheim', wins: 2, losses: 1, diff: -7 },
      { team: 'Stuttgart 1', wins: 1, losses: 2, diff: -11 },
      { team: 'Karlsruhe', wins: 0, losses: 3, diff: -11 },
    ],
  },
  'T-Ball': {
    A: [
      { team: 'Nagold', wins: 3, losses: 0, diff: 18 },
      { team: 'Schriesheim', wins: 2, losses: 1, diff: 4 },
      { team: 'Stuttgart 2', wins: 1, losses: 2, diff: -11 },
      { team: 'Bretten', wins: 0, losses: 3, diff: -11 },
    ],
    B: [
      { team: 'Karlsruhe', wins: 2, losses: 0, diff: 15 },
      { team: 'Remchingen', wins: 1, losses: 1, diff: -7 },
      { team: 'Stuttgart 1', wins: 0, losses: 2, diff: -8 },
    ],
  },
};

/** Hand-entered final ranking (seed.sql `standings`, positions 1…n). */
export const expectedRanking2025: Record<Class2025, string[]> = {
  Schüler: [
    'Darmstadt 1',
    'Nagold',
    'Mannheim',
    'Herrenberg',
    'Heidelberg',
    'Schriesheim',
    'Bretten 1',
    'Remchingen',
    'Stuttgart 1',
    'Darmstadt 2',
    'Karlsruhe',
    'Stuttgart 2',
    'Bretten 2',
  ],
  'T-Ball': [
    'Karlsruhe',
    'Nagold',
    'Remchingen',
    'Schriesheim',
    'Stuttgart 1',
    'Stuttgart 2',
    'Bretten',
  ],
};
