import { describe, expect, it } from 'vitest';
import {
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

const CLS = 'Schüler' as const;
let nextNumber = 1;

/** Group game "home homescore:awayscore away"; scores null = unplayed. */
function g(
  home: string,
  hs: number | null,
  as: number | null,
  away: string,
): GameLike {
  return {
    class: CLS,
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

function p(
  number: number,
  homeRef: string,
  awayRef: string,
  hs: number | null = null,
  as: number | null = null,
  label = `Spiel ${number}`,
): GameLike {
  return {
    class: CLS,
    stage: 'placement',
    number,
    hometeam: null,
    awayteam: null,
    homescore: hs,
    awayscore: as,
    home_ref: homeRef,
    away_ref: awayRef,
    label,
  };
}

const team = (name: string, group: string | null): TeamLike => ({
  name,
  class: CLS,
  group_name: group,
});

const order = (names: string[], games: GameLike[]) =>
  rankTeams(names, games).map((r) => r.team);

describe('rankTeams', () => {
  it('counts a tie as half a win and ranks by win rate', () => {
    const rows = rankTeams(
      ['A', 'B', 'C'],
      [g('A', 5, 5, 'B'), g('A', 3, 1, 'C'), g('B', 1, 9, 'C')],
    );
    expect(
      rows.map((r) => [r.team, r.wins, r.losses, r.ties, r.winRate]),
    ).toEqual([
      ['A', 1, 0, 1, 0.75],
      ['C', 1, 1, 0, 0.5],
      ['B', 0, 1, 1, 0.25],
    ]);
  });

  it('uses win rate, not wins, so an unplayed game does not cost places', () => {
    // A: 1-0, B: 2-1 → A has the better rate despite fewer wins.
    const games = [
      g('A', 5, 1, 'C'),
      g('B', 5, 1, 'C'),
      g('B', 5, 1, 'D'),
      g('D', 9, 1, 'B'),
    ];
    expect(order(['A', 'B', 'C', 'D'], games).slice(0, 2)).toEqual(['A', 'B']);
  });

  it('breaks equal win rate by run difference', () => {
    const rows = rankTeams(
      ['A', 'B', 'C', 'D'],
      [g('A', 3, 2, 'C'), g('B', 9, 2, 'D')],
    );
    expect(rows[0]).toMatchObject({
      team: 'B',
      diff: 7,
      runsFor: 9,
      runsAgainst: 2,
    });
    expect(rows[1]).toMatchObject({ team: 'A', diff: 1 });
  });

  it('breaks a two-way tie by head-to-head', () => {
    // A and B: 1-1, diff 0. B beat A.
    const games = [
      g('A', 1, 2, 'B'),
      g('A', 6, 5, 'C'),
      g('B', 5, 6, 'C'),
      g('C', 0, 1, 'D'),
    ];
    const rows = rankTeams(['A', 'B', 'C', 'D'], games);
    const ab = rows.filter((r) => r.team === 'A' || r.team === 'B');
    expect(ab.map((r) => [r.team, r.winRate, r.diff])).toEqual([
      ['B', 0.5, 0],
      ['A', 0.5, 0],
    ]);
  });

  it('applies head-to-head to two separate level pairs', () => {
    // A, B 2-1 (+1); C, D 1-2 (-1). A beat B, C beat D.
    const games = [
      g('A', 2, 1, 'B'),
      g('A', 2, 1, 'C'),
      g('D', 2, 1, 'A'),
      g('B', 2, 1, 'C'),
      g('B', 2, 1, 'D'),
      g('C', 2, 1, 'D'),
    ];
    expect(order(['A', 'B', 'C', 'D'], games)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('re-applies head-to-head to the subsets a multi-way tie splits into', () => {
    // A, B, C, D all 3-2 with diff +1 and 8 runs; E 3-2 with +10; F 0-5.
    // Among A-D: A 2-1, D 2-1, B 1-2, C 1-2 → {A, D}, {B, C}.
    // Re-applied: D beat A, B beat C. (Name order would give A, D / B, C.)
    const games = [
      g('A', 2, 1, 'B'),
      g('A', 2, 1, 'C'),
      g('D', 2, 1, 'A'),
      g('B', 2, 1, 'C'),
      g('D', 2, 1, 'B'),
      g('C', 2, 1, 'D'),
      g('E', 2, 1, 'A'),
      g('E', 2, 1, 'D'),
      g('B', 2, 1, 'E'),
      g('C', 2, 1, 'E'),
      g('E', 11, 1, 'F'),
      ...['A', 'B', 'C', 'D'].map((t) => g(t, 2, 1, 'F')),
    ];
    const rows = rankTeams(['A', 'B', 'C', 'D', 'E', 'F'], games);
    expect(
      rows
        .slice(1, 5)
        .every((r) => r.winRate === 0.6 && r.diff === 1 && r.runsFor === 8),
    ).toBe(true);
    expect(rows.map((r) => r.team)).toEqual(['E', 'D', 'A', 'B', 'C', 'F']);
    expect(rows.every((r) => !r.tiedWithNext)).toBe(true);
  });

  it('skips head-to-head while the level teams have not all played each other', () => {
    // A and B level (1-0, +1), no game between them yet → runs scored.
    const rows = rankTeams(
      ['A', 'B', 'C', 'D'],
      [g('A', 2, 1, 'C'), g('B', 5, 4, 'D')],
    );
    expect(rows.map((r) => r.team).slice(0, 2)).toEqual(['B', 'A']);
  });

  it('breaks a circular head-to-head by runs scored, then flags the name fallback', () => {
    // A > B > C > A, all 1-1 with diff 0.
    const games = [g('A', 3, 2, 'B'), g('B', 5, 4, 'C'), g('C', 2, 1, 'A')];
    const rows = rankTeams(['A', 'B', 'C'], games);
    // runs: A 4, B 7, C 6
    expect(rows.map((r) => r.team)).toEqual(['B', 'C', 'A']);
    expect(rows.every((r) => !r.tiedWithNext)).toBe(true);

    const flat = rankTeams(['X', 'Y'], [g('X', 2, 2, 'Y')]);
    expect(flat.map((r) => [r.team, r.tiedWithNext])).toEqual([
      ['X', true],
      ['Y', false],
    ]);
  });

  it('handles a 0:0 tie and a win without runs conceded', () => {
    const rows = rankTeams(
      ['A', 'B', 'C'],
      [g('A', 0, 0, 'B'), g('C', 3, 0, 'A')],
    );
    expect(rows.map((r) => [r.team, r.winRate, r.diff, r.runsAgainst])).toEqual(
      [
        ['C', 1, 3, 0],
        ['B', 0.5, 0, 0],
        ['A', 0.25, -3, 3],
      ],
    );
  });

  it('skips head-to-head in a three-way tie where not every pair has played', () => {
    // A, B, C each 1 win + 1 tie, +1. Only A-B played each other → runs scored.
    const games = [
      g('A', 2, 1, 'D'),
      g('A', 1, 1, 'B'),
      g('B', 4, 3, 'E'),
      g('C', 2, 1, 'F'),
      g('C', 0, 0, 'E'),
    ];
    const rows = rankTeams(['A', 'B', 'C', 'D', 'E', 'F'], games);
    expect(rows.slice(0, 3).map((r) => [r.team, r.winRate, r.diff])).toEqual([
      ['B', 0.75, 1],
      ['A', 0.75, 1],
      ['C', 0.75, 1],
    ]);
  });

  it('sorts teams without a played game after teams with results', () => {
    const rows = rankTeams(
      ['A', 'B', 'C'],
      [g('A', 9, 0, 'B'), g('A', null, null, 'C')],
    );
    expect(rows.map((r) => [r.team, r.played])).toEqual([
      ['A', 1],
      ['B', 1],
      ['C', 0],
    ]);
  });
});

// Two groups: A (3 teams), B (2 teams).
const teams = [
  team('A1', 'A'),
  team('A2', 'A'),
  team('A3', 'A'),
  team('B1', 'B'),
  team('B2', 'B'),
  team('Gast', null),
];
const groupA = [g('A1', 5, 1, 'A2'), g('A1', 5, 1, 'A3'), g('A2', 4, 3, 'A3')];
const groupB = [g('B1', 3, 2, 'B2')];

describe('groupTables', () => {
  it('builds one table per group from teams.group_name, sorted by letter', () => {
    const tables = groupTables([...groupA, ...groupB], teams, CLS);
    expect(
      tables.map((t) => [t.group, t.rows.map((r) => r.team), t.complete]),
    ).toEqual([
      ['A', ['A1', 'A2', 'A3'], true],
      ['B', ['B1', 'B2'], true],
    ]);
  });

  it('ignores other classes, placement games and unscored games', () => {
    const other = { ...g('A3', 99, 0, 'A1'), class: 'T-Ball' as const };
    const placement = { ...g('A3', 99, 0, 'A1'), stage: 'placement' };
    const open = g('A3', null, null, 'A2');
    const [a] = groupTables([...groupA, other, placement, open], teams, CLS);
    expect(a.rows[0]).toMatchObject({ team: 'A1', played: 2, wins: 2 });
    expect(a).toMatchObject({ played: 3, total: 4, complete: false });
  });
});

describe('seeds', () => {
  it('ranks across groups by place, then win rate, then run difference', () => {
    // A1 1.0 (+8), B1 1.0 (+1) → A1, B1; A2 0.5, B2 0.0 → A2, B2; A3.
    expect(
      seeds([...groupA, ...groupB], teams, CLS)?.map((s) => s.team),
    ).toEqual(['A1', 'B1', 'A2', 'B2', 'A3']);
  });

  it('is null until every group game of the class has a result', () => {
    expect(
      seeds([...groupA, g('B1', null, null, 'B2')], teams, CLS),
    ).toBeNull();
    expect(seeds([], teams, CLS)).toBeNull();
  });

  it('seeds a group without scheduled games instead of blocking', () => {
    const withSolo = [...teams, team('Solo', 'C')];
    const result = seeds([...groupA, ...groupB], withSolo, CLS);
    expect(result?.map((s) => s.team)).toEqual([
      'A1',
      'B1',
      'Solo',
      'A2',
      'B2',
      'A3',
    ]);
    expect(result?.[2]).toMatchObject({ group: 'C', place: 1 });
  });

  it('flags level seeds and still resolves refs through them', () => {
    // B1 and C1: both place 1, 1.0, +1 → ordered by group letter, flagged.
    const withC = [
      ...teams,
      team('C1', 'C'),
      team('C2', 'C'),
      team('X', 'D'),
      team('Y', 'D'),
    ];
    const games = [
      ...groupA,
      ...groupB,
      g('C1', 1, 0, 'C2'),
      g('X', 2, 2, 'Y'),
    ];
    const ctx = standingsContext(games, withC, CLS);
    const tied = ctx.seeds?.filter((s) => s.tiedWithNext).map((s) => s.team);
    expect(tied).toContain('B1');
    expect(ctx.seeds?.find((s) => s.team === 'A1')?.tiedWithNext).toBe(false);
    expect(resolveRef('seed:2', ctx)).toBe('B1');
    expect(ctx.tables.find((t) => t.group === 'D')?.rows[0].tiedWithNext).toBe(
      true,
    );
    expect(resolveRef('group:D:1', ctx)).toBe('X');
  });
});

describe('resolveRef', () => {
  const groups = [...groupA, ...groupB];

  it('resolves seed:n only when the group stage is finished', () => {
    expect(resolveRef('seed:2', standingsContext(groups, teams, CLS))).toBe(
      'B1',
    );
    expect(
      resolveRef('seed:9', standingsContext(groups, teams, CLS)),
    ).toBeNull();
    const open = [...groupA, g('B1', null, null, 'B2')];
    expect(resolveRef('seed:1', standingsContext(open, teams, CLS))).toBeNull();
  });

  it('resolves group:G:n once that group is complete', () => {
    const open = [...groupA, g('B1', null, null, 'B2')];
    const ctx = standingsContext(open, teams, CLS);
    expect(resolveRef('group:A:2', ctx)).toBe('A2');
    expect(resolveRef('group:B:1', ctx)).toBeNull();
    expect(resolveRef('group:C:1', ctx)).toBeNull();
    expect(resolveRef('group:A:4', ctx)).toBeNull();
  });

  it('resolves winner:/loser: by game number, recursively', () => {
    const games = [
      ...groups,
      p(101, 'seed:1', 'seed:4', 2, 5),
      p(102, 'seed:2', 'seed:3', 7, 1),
    ];
    games.push(
      p(103, 'winner:101', 'winner:102'),
      p(104, 'loser:101', 'loser:102', 3, 4),
    );
    const ctx = standingsContext(games, teams, CLS);
    expect(resolveRef('winner:101', ctx)).toBe('B2');
    expect(resolveRef('loser:101', ctx)).toBe('A1');
    expect(resolveGame(games.at(-2)!, ctx)).toEqual({ home: 'B2', away: 'B1' });
    expect(resolveRef('winner:103', ctx)).toBeNull(); // unplayed
    expect(resolveRef('winner:104', ctx)).toBe('A2');
  });

  it('returns null for a tied referenced game', () => {
    const tied = g('A1', 2, 2, 'B1');
    const ctx = standingsContext([...groups, tied], teams, CLS);
    expect(resolveRef(`winner:${tied.number}`, ctx)).toBeNull();
  });

  it('returns null for invalid refs, unknown games and cycles', () => {
    const games = [
      ...groups,
      p(201, 'winner:202', 'seed:1', 1, 0),
      p(202, 'winner:201', 'seed:2', 1, 0),
    ];
    const ctx = standingsContext(games, teams, CLS);
    expect(resolveRef('winner:201', ctx)).toBeNull();
    expect(resolveRef('winner:999', ctx)).toBeNull();
    expect(resolveRef('seed:0', ctx)).toBeNull();
    expect(resolveRef('group:a:1', ctx)).toBeNull();
    expect(resolveRef('Sieger #1', ctx)).toBeNull();
    const self = p(203, 'winner:203', 'seed:1', 1, 0);
    expect(
      resolveGame(self, standingsContext([...groups, self], teams, CLS)).home,
    ).toBeNull();
  });

  it('ignores games of other classes', () => {
    const tb = {
      ...p(301, 'seed:1', 'seed:2', 1, 0),
      class: 'T-Ball' as const,
    };
    expect(
      resolveRef('winner:301', standingsContext([...groups, tb], teams, CLS)),
    ).toBeNull();
  });
});

describe('placementRanking', () => {
  // Seeds: 1 A1, 2 B1, 3 A2, 4 B2, 5 A3 + extra group C with 2 teams → 7 seeds.
  const many = [...teams, team('C1', 'C'), team('C2', 'C')];
  const groups = [...groupA, ...groupB, g('C1', 1, 0, 'C2')];
  // Seeds: A1, B1, C1, A2, B2, C2, A3

  it('derives places from the refs: final, 3rd place and a round robin', () => {
    const games = [
      ...groups,
      p(401, 'seed:1', 'seed:4', 1, 2, 'Halbfinale 1'), // A2 wins
      p(402, 'seed:2', 'seed:3', 3, 2, 'Halbfinale 2'), // B1 wins
      p(403, 'winner:401', 'winner:402', 4, 5, 'Finale'), // B1 1st, A2 2nd
      p(404, 'loser:401', 'loser:402', 6, 1, 'Platz 3'), // A1 3rd, C1 4th
      p(405, 'seed:5', 'seed:6', 2, 1, 'Runde 5–7'),
      p(406, 'seed:6', 'seed:7', 2, 1, 'Runde 5–7'),
      p(407, 'seed:7', 'seed:5', 2, 1, 'Runde 5–7'),
    ];
    const ranking = placementRanking(standingsContext(games, many, CLS));
    // Round robin B2, C2, A3: circular, all 1-1 diff 0, runs 3 each → name fallback.
    expect(ranking.map((r) => [r.place, r.team])).toEqual([
      [1, 'B1'],
      [2, 'A2'],
      [3, 'A1'],
      [4, 'C1'],
      [5, 'A3'],
      [6, 'B2'],
      [7, 'C2'],
    ]);
    expect(ranking.slice(4).map((r) => r.tiedWithNext)).toEqual([
      true,
      true,
      false,
    ]);
  });

  it('keeps places open until their games are decided, pairs give the better place to the winner', () => {
    const games = [
      ...groups,
      p(501, 'seed:3', 'seed:4', 0, 1, 'Platz 3/4'),
      p(502, 'seed:1', 'seed:2', null, null, 'Platz 1/2'),
    ];
    const ranking = placementRanking(standingsContext(games, many, CLS));
    expect(ranking.map((r) => [r.place, r.team])).toEqual([
      [1, null],
      [2, null],
      [3, 'A2'],
      [4, 'C1'],
    ]);
  });
});
