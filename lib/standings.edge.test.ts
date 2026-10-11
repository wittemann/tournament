/**
 * Cases the 2025 data did not contain (ADR-0006): tied games, three-way ties,
 * an unfinished group and complete brackets. Complements standings.test.ts,
 * which covers the individual rules; these are whole-tournament scenarios.
 */
import { describe, expect, it } from 'vitest';
import {
  type GameClass,
  type GameLike,
  type TeamLike,
  groupTables,
  placementRanking,
  rankTeams,
  resolveGame,
  resolveRef,
  seeds,
  standingsContext,
} from '@/lib/standings';

const CLS: GameClass = 'Schüler';
let nextNumber = 1;

/** Group game "home hs:as away"; scores null = unplayed. */
function g(
  home: string,
  hs: number | null,
  as: number | null,
  away: string,
  cls: GameClass = CLS,
): GameLike {
  return {
    class: cls,
    stage: 'group',
    number: nextNumber++,
    hometeam: home,
    awayteam: away,
    homescore: hs,
    awayscore: as,
    home_ref: null,
    away_ref: null,
    label: null,
  };
}

/** Placement game with refs; numbers start at 901 to stay clear of g(). */
function p(
  number: number,
  homeRef: string,
  awayRef: string,
  hs: number | null = null,
  as: number | null = null,
  cls: GameClass = CLS,
): GameLike {
  return {
    class: cls,
    stage: 'placement',
    number,
    hometeam: null,
    awayteam: null,
    homescore: hs,
    awayscore: as,
    home_ref: homeRef,
    away_ref: awayRef,
    label: `Spiel ${number}`,
  };
}

const team = (
  name: string,
  group: string | null,
  cls: GameClass = CLS,
): TeamLike => ({ name, class: cls, group_name: group });

/** Round robin where the earlier name always wins 3:0 → order = list order. */
function strictGroup(names: string[], cls: GameClass = CLS): GameLike[] {
  return names.flatMap((a, i) =>
    names.slice(i + 1).map((b) => g(a, 3, 0, b, cls)),
  );
}

describe('tied games in a group', () => {
  // W–X 3:3 and Y–Z 2:2 are ties; everything else has a winner.
  const names = ['W', 'X', 'Y', 'Z'];
  const tiedWX = g('W', 3, 3, 'X');
  const games = [
    tiedWX,
    g('Y', 2, 2, 'Z'),
    g('W', 5, 1, 'Y'),
    g('X', 4, 0, 'Z'),
    g('W', 2, 1, 'Z'),
    g('X', 1, 2, 'Y'),
  ];
  const teams = names.map((n) => team(n, 'A'));

  it('counts wins, losses and ties and ranks by win rate, then difference', () => {
    const rows = rankTeams(names, games);
    expect(
      rows.map((r) => [r.place, r.team, r.wins, r.losses, r.ties, r.played]),
    ).toEqual([
      [1, 'W', 2, 0, 1, 3],
      [2, 'X', 1, 1, 1, 3],
      [3, 'Y', 1, 1, 1, 3],
      [4, 'Z', 0, 2, 1, 3],
    ]);
    expect(rows.map((r) => r.winRate)).toEqual([
      expect.closeTo(5 / 6, 10),
      0.5,
      0.5,
      expect.closeTo(1 / 6, 10),
    ]);
    // X and Y are level at 0.5; X's +3 against Y's −3 decides, no head-to-head.
    expect(rows.slice(1, 3).map((r) => r.diff)).toEqual([3, -3]);
    expect(rows.every((r) => !r.tiedWithNext)).toBe(true);
  });

  it('completes the group and seeds the teams', () => {
    const [table] = groupTables(games, teams, CLS);
    expect(table).toMatchObject({ played: 6, total: 6, complete: true });
    expect(seeds(games, teams, CLS)?.map((s) => s.team)).toEqual(names);
  });

  it('resolves winner:/loser: of a tied game to null in a placement game', () => {
    const final = p(901, `winner:${tiedWX.number}`, `loser:${tiedWX.number}`);
    const ctx = standingsContext([...games, final], teams, CLS);
    expect(resolveGame(final, ctx)).toEqual({ home: null, away: null });
  });
});

describe('three-way ties', () => {
  it('lets head-to-head decide, then runs scored for the level pair', () => {
    // A, B, C all at rate 0.5, diff 0 (A 2-2, B and C 1-1-2); D and E are the other opponents.
    // Among A, B, C: A beat both, B and C tied → {A}, {B, C}. B and C are
    // level head-to-head, so runs scored decide (C 10, B 8). Name order
    // would give A, B, C.
    const games = [
      g('A', 3, 1, 'B'),
      g('A', 3, 1, 'C'),
      g('B', 2, 2, 'C'),
      g('D', 3, 1, 'A'),
      g('E', 3, 1, 'A'),
      g('B', 3, 1, 'D'),
      g('B', 2, 2, 'E'),
      g('C', 4, 4, 'D'),
      g('C', 3, 1, 'E'),
      g('D', 2, 1, 'E'),
    ];
    const rows = rankTeams(['A', 'B', 'C', 'D', 'E'], games);
    const triple = rows.filter((r) => 'ABC'.includes(r.team));
    expect(triple.every((r) => r.winRate === 0.5 && r.diff === 0)).toBe(true);
    expect(rows.map((r) => r.team)).toEqual(['D', 'A', 'C', 'B', 'E']);
    expect(rows.find((r) => r.team === 'C')?.runsFor).toBe(10);
    expect(rows.every((r) => !r.tiedWithNext)).toBe(true);
  });

  it('breaks a circular three-way tie by runs scored', () => {
    // A > B > C > A, each by 3:2, and each beats D by +4: all 2-1, diff +4.
    // Runs scored: A 10, B 11, C 12 → C, B, A (name order would be A, B, C).
    const games = [
      g('A', 3, 2, 'B'),
      g('B', 3, 2, 'C'),
      g('C', 3, 2, 'A'),
      g('A', 5, 1, 'D'),
      g('B', 6, 2, 'D'),
      g('C', 7, 3, 'D'),
    ];
    const rows = rankTeams(['A', 'B', 'C', 'D'], games);
    expect(rows.slice(0, 3).map((r) => [r.team, r.winRate, r.diff])).toEqual([
      ['C', expect.closeTo(2 / 3, 10), 4],
      ['B', expect.closeTo(2 / 3, 10), 4],
      ['A', expect.closeTo(2 / 3, 10), 4],
    ]);
    expect(rows.map((r) => r.runsFor)).toEqual([12, 11, 10, 6]);
    expect(rows.every((r) => !r.tiedWithNext)).toBe(true);
  });

  it('falls back to team names and flags the unresolved tie', () => {
    // Circle with identical scores, all beat Weil 3:0: nothing separates them.
    const games = [
      g('Mannheim', 2, 1, 'Nagold'),
      g('Nagold', 2, 1, 'Bretten'),
      g('Bretten', 2, 1, 'Mannheim'),
      g('Mannheim', 3, 0, 'Weil'),
      g('Nagold', 3, 0, 'Weil'),
      g('Bretten', 3, 0, 'Weil'),
    ];
    const rows = rankTeams(['Weil', 'Nagold', 'Mannheim', 'Bretten'], games);
    expect(rows.map((r) => [r.team, r.tiedWithNext])).toEqual([
      ['Bretten', true],
      ['Mannheim', true],
      ['Nagold', false],
      ['Weil', false],
    ]);
  });
});

describe('an unfinished group', () => {
  const teams = [
    ...['A1', 'A2', 'A3', 'A4'].map((n) => team(n, 'A')),
    ...['B1', 'B2', 'B3'].map((n) => team(n, 'B')),
  ];
  const groupB = [
    g('B1', 3, 0, 'B2'),
    g('B1', 3, 0, 'B3'),
    g('B2', 2, 0, 'B3'),
  ];
  // Group A with six games; `rest` are the last three, unscored while running.
  const groupA = (done: boolean) => [
    g('A1', 4, 1, 'A3'),
    g('A1', 5, 0, 'A4'),
    g('A1', 1, 2, 'A2'),
    g('A2', done ? 3 : null, done ? 1 : null, 'A3'),
    g('A2', done ? 4 : null, done ? 0 : null, 'A4'),
    g('A3', done ? 2 : null, done ? 1 : null, 'A4'),
  ];
  const semi = () => [
    p(911, 'seed:1', 'seed:4'),
    p(912, 'group:A:1', 'group:B:2'),
    p(913, 'group:B:1', 'group:A:2'),
  ];

  it('ranks by win rate so the team with a game in hand is not penalised', () => {
    const [a] = groupTables([...groupA(false), ...groupB], teams, CLS);
    // A2: 1-0 after one game; A1: 2-1. A1 has more wins but a lower rate.
    expect(a.rows.map((r) => [r.team, r.wins, r.losses, r.played])).toEqual([
      ['A2', 1, 0, 1],
      ['A1', 2, 1, 3],
      ['A3', 0, 1, 1],
      ['A4', 0, 1, 1],
    ]);
    // A3 (−3) before A4 (−5) at rate 0.
    expect(a.rows.map((r) => [r.team, r.diff])).toEqual([
      ['A2', 1],
      ['A1', 7],
      ['A3', -3],
      ['A4', -5],
    ]);
  });

  it('reports progress and withholds seeds', () => {
    const games = [...groupA(false), ...groupB];
    const [a, b] = groupTables(games, teams, CLS);
    expect(a).toMatchObject({ group: 'A', played: 3, total: 6 });
    expect(a.complete).toBe(false);
    expect(b).toMatchObject({
      group: 'B',
      played: 3,
      total: 3,
      complete: true,
    });
    expect(standingsContext(games, teams, CLS).seeds).toBeNull();
    expect(seeds(games, teams, CLS)).toBeNull();
  });

  it('resolves group refs only for the finished group and leaves seeds open', () => {
    const games = [...groupA(false), ...groupB, ...semi()];
    const ctx = standingsContext(games, teams, CLS);
    expect(resolveRef('group:B:1', ctx)).toBe('B1');
    expect(resolveRef('group:B:3', ctx)).toBe('B3');
    expect(resolveRef('group:A:1', ctx)).toBeNull();
    expect(resolveRef('seed:1', ctx)).toBeNull();
    expect(resolveGame(games.at(-3)!, ctx)).toEqual({ home: null, away: null });
    expect(resolveGame(games.at(-2)!, ctx)).toEqual({ home: null, away: 'B2' });
    expect(resolveGame(games.at(-1)!, ctx)).toEqual({ home: 'B1', away: null });
  });

  it('produces seeds and resolves placement games once the last game is scored', () => {
    const games = [...groupA(true), ...groupB, ...semi()];
    const ctx = standingsContext(games, teams, CLS);
    expect(ctx.tables[0]).toMatchObject({
      played: 6,
      total: 6,
      complete: true,
    });
    // Place 1: A2 (3-0, +7) before B1 (2-0, +6); place 2: A1 (2/3) before
    // B2 (1/2); place 3: A3 (1/3) before B3; then A4.
    expect(ctx.seeds?.map((s) => [s.seed, s.team, s.tiedWithNext])).toEqual([
      [1, 'A2', false],
      [2, 'B1', false],
      [3, 'A1', false],
      [4, 'B2', false],
      [5, 'A3', false],
      [6, 'B3', false],
      [7, 'A4', false],
    ]);
    expect(resolveRef('group:A:1', ctx)).toBe('A2');
    expect(resolveGame(games.at(-2)!, ctx)).toEqual({ home: 'A2', away: 'B2' });
    expect(resolveGame(games.at(-1)!, ctx)).toEqual({ home: 'B1', away: 'A1' });
  });
});

describe('complete brackets through placementRanking', () => {
  it('ranks places 1-4 of an 8-team quarterfinal bracket', () => {
    const teams = [
      ...['A1', 'A2', 'A3', 'A4'].map((n) => team(n, 'A')),
      ...['B1', 'B2', 'B3', 'B4'].map((n) => team(n, 'B')),
    ];
    const games = [
      ...strictGroup(['A1', 'A2', 'A3', 'A4']),
      ...strictGroup(['B1', 'B2', 'B3', 'B4']),
      p(921, 'group:A:1', 'group:B:4', 5, 1), // A1
      p(922, 'group:B:1', 'group:A:4', 6, 0), // B1
      p(923, 'group:A:2', 'group:B:3', 2, 3), // B3 (upset)
      p(924, 'group:B:2', 'group:A:3', 4, 2), // B2
      p(925, 'winner:921', 'winner:923', 4, 3), // A1 beats B3
      p(926, 'winner:922', 'winner:924', 1, 2), // B2 beats B1
      p(927, 'winner:925', 'winner:926', 2, 5), // B2 beats A1: final
      p(928, 'loser:925', 'loser:926', 3, 4), // B1 beats B3: 3rd place
    ];
    const ranking = placementRanking(standingsContext(games, teams, CLS));
    // The quarterfinal losers play no further game, so places 5-8 are absent.
    expect(ranking.map((r) => [r.place, r.team, r.tiedWithNext])).toEqual([
      [1, 'B2', false],
      [2, 'A1', false],
      [3, 'B1', false],
      [4, 'B3', false],
    ]);
  });
});
