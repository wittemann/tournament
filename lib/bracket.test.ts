import { describe, expect, it } from 'vitest';
import { buildFinalrunde, seedTag } from '@/lib/bracket';
import {
  expectedRanking2025,
  games2025,
  teams2025,
} from '@/lib/fixtures/games2025';
import {
  standingsContext,
  type GameLike,
  type TeamLike,
} from '@/lib/standings';

const CLS = 'Schüler' as const;

function pg(
  number: number,
  homeRef: string,
  awayRef: string,
  label: string | null,
  score?: [number, number],
): GameLike {
  return {
    class: CLS,
    stage: 'placement',
    number,
    hometeam: null,
    awayteam: null,
    homescore: score?.[0] ?? null,
    awayscore: score?.[1] ?? null,
    home_ref: homeRef,
    away_ref: awayRef,
    label,
  };
}

/** One group "A" of n teams, all group games played (A1 beats every lower team). */
function groupA(n: number): { games: GameLike[]; teams: TeamLike[] } {
  const teams = Array.from({ length: n }, (_, i) => ({
    name: `A${i + 1}`,
    class: CLS,
    group_name: 'A',
  }));
  const games: GameLike[] = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      games.push({
        class: CLS,
        stage: 'group',
        number: 100 + games.length,
        hometeam: `A${i + 1}`,
        awayteam: `A${j + 1}`,
        homescore: 10,
        awayscore: 5,
        home_ref: null,
        away_ref: null,
        label: null,
      });
  return { games, teams };
}

const run = (games: GameLike[], teams: TeamLike[]) =>
  buildFinalrunde(games, standingsContext(games, teams, CLS));

const labels = (games: GameLike[]) => games.map((g) => g.label);

describe('buildFinalrunde, 2025 data', () => {
  it('Schüler: semifinals, final, 3rd place, the rest by place', () => {
    const fr = buildFinalrunde(
      games2025,
      standingsContext(games2025, teams2025, 'Schüler'),
    );
    expect(fr.bracket?.final.label).toBe('Finale');
    expect(fr.bracket?.halves.map((h) => labels(h.rounds.flat()))).toEqual([
      ['Halbfinale 1'],
      ['Halbfinale 2'],
    ]);
    expect(fr.bracket?.thirdPlace?.label).toBe('Spiel um Platz 3');
    expect(fr.bracket?.rounds).toEqual(['Halbfinale']);
    expect(fr.bracket?.losers).toBeNull();
    expect(fr.placementGames.map((g) => g.number)).toEqual([
      39, 41, 42, 40, 43, 46,
    ]);
    expect(fr.ranking?.map((e) => e.team)).toEqual(expectedRanking2025.Schüler);
  });

  it('T-Ball: the 5–7 round robin is listed in schedule order', () => {
    const fr = buildFinalrunde(
      games2025,
      standingsContext(games2025, teams2025, 'T-Ball'),
    );
    expect(fr.bracket?.final.number).toBe(13);
    expect(fr.bracket?.thirdPlace?.number).toBe(14);
    expect(fr.placementGames.map((g) => g.number)).toEqual([12, 15, 17]);
    expect(fr.ranking?.map((e) => e.team)).toEqual(
      expectedRanking2025['T-Ball'],
    );
  });

  it('keeps the caller’s game objects', () => {
    const fr = buildFinalrunde(
      games2025,
      standingsContext(games2025, teams2025, 'T-Ball'),
    );
    expect(games2025).toContain(fr.bracket?.final);
  });
});

describe('buildFinalrunde, made-up cases', () => {
  const { games: group, teams } = groupA(6);

  it('nothing played yet: structure without ranking', () => {
    const games = [
      pg(1, 'seed:1', 'seed:4', 'Halbfinale 1'),
      pg(2, 'seed:2', 'seed:3', 'Halbfinale 2'),
      pg(3, 'winner:1', 'winner:2', 'Finale'),
      pg(4, 'loser:1', 'loser:2', 'Spiel um Platz 3'),
      pg(5, 'seed:5', 'seed:6', 'Platz 5/6'),
    ];
    const fr = run(games, []);
    expect(fr.bracket?.final.number).toBe(3);
    expect(fr.bracket?.thirdPlace?.number).toBe(4);
    expect(fr.placementGames.map((g) => g.number)).toEqual([5]);
    expect(fr.ranking).toBeNull();
  });

  it('partial results: no ranking until the final is played', () => {
    const games = [
      ...group,
      pg(1, 'seed:1', 'seed:4', 'Halbfinale 1', [9, 3]),
      pg(2, 'seed:2', 'seed:3', 'Halbfinale 2'),
      pg(3, 'winner:1', 'winner:2', 'Finale'),
      pg(5, 'seed:5', 'seed:6', 'Platz 5/6', [4, 7]),
    ];
    expect(run(games, teams).ranking).toBeNull();
  });

  it('final played: ranking, also with an open lower game', () => {
    const games = [
      ...group,
      pg(1, 'seed:1', 'seed:4', 'Halbfinale 1', [9, 3]),
      pg(2, 'seed:2', 'seed:3', 'Halbfinale 2', [2, 8]),
      pg(3, 'winner:1', 'winner:2', 'Finale', [5, 6]),
      pg(5, 'seed:5', 'seed:6', 'Platz 5/6'),
    ];
    const fr = run(games, teams);
    expect(fr.bracket?.thirdPlace).toBeNull();
    expect(fr.ranking).toEqual([
      { place: 1, team: 'A3', tiedWithNext: false },
      { place: 2, team: 'A1', tiedWithNext: false },
      { place: 3, team: null, tiedWithNext: false },
      { place: 4, team: null, tiedWithNext: false },
    ]);
  });

  it('no placement games at all', () => {
    const fr = run(group, teams);
    expect(fr).toEqual({
      bracket: null,
      placementGames: [],
      ranking: null,
      hasFinal: false,
    });
  });

  it('a single 1/2 game: list, ranking once it is played', () => {
    const open = run([...group, pg(1, 'seed:1', 'seed:2', 'Platz 1/2')], teams);
    expect(open.bracket).toBeNull();
    // The best-slot game counts as the final, even without semifinals.
    expect(open.hasFinal).toBe(true);
    expect(open.placementGames.map((g) => g.number)).toEqual([1]);
    expect(open.ranking).toBeNull();
    const done = run(
      [...group, pg(1, 'seed:1', 'seed:2', 'Platz 1/2', [1, 4])],
      teams,
    );
    expect(done.ranking?.map((e) => e.team)).toEqual(['A2', 'A1']);
  });

  it('only a round robin: no final, ranking once every game is played', () => {
    const rr = (scores: ([number, number] | undefined)[]) => [
      ...group,
      pg(1, 'seed:1', 'seed:2', 'Runde 1–3', scores[0]),
      pg(2, 'seed:2', 'seed:3', 'Runde 1–3', scores[1]),
      pg(3, 'seed:3', 'seed:1', 'Runde 1–3', scores[2]),
    ];
    const open = run(rr([[5, 1], undefined, undefined]), teams);
    expect(open.hasFinal).toBe(false);
    expect(open.ranking).toBeNull();
    const done = run(
      rr([
        [5, 1],
        [6, 2],
        [1, 7],
      ]),
      teams,
    );
    expect(done.ranking?.map((e) => e.team)).toEqual(['A1', 'A2', 'A3']);
  });

  it('three rounds before the final fall back to the list', () => {
    const games = [
      ...Array.from({ length: 8 }, (_, i) =>
        pg(i + 1, `seed:${i + 1}`, `seed:${16 - i}`, `Achtelfinale ${i + 1}`),
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        pg(9 + i, `winner:${2 * i + 1}`, `winner:${2 * i + 2}`, 'VF'),
      ),
      pg(13, 'winner:9', 'winner:10', 'Halbfinale 1'),
      pg(14, 'winner:11', 'winner:12', 'Halbfinale 2'),
      pg(15, 'winner:13', 'winner:14', 'Finale'),
    ];
    const fr = run(games, []);
    expect(fr.bracket).toBeNull();
    expect(fr.placementGames).toHaveLength(15);
  });

  it('a bye (semifinal on one side only) falls back to the list', () => {
    const games = [
      pg(1, 'seed:2', 'seed:3', 'Halbfinale'),
      pg(2, 'seed:1', 'winner:1', 'Finale'),
    ];
    const fr = run(games, []);
    expect(fr.bracket).toBeNull();
    expect(fr.placementGames.map((g) => g.number)).toEqual([2, 1]);
  });

  it('halves follow the final’s home and away sides', () => {
    const games = [
      pg(1, 'seed:1', 'seed:4', 'Halbfinale 1'),
      pg(2, 'seed:2', 'seed:3', 'Halbfinale 2'),
      pg(3, 'winner:2', 'winner:1', 'Finale'),
    ];
    const fr = run(games, []);
    expect(fr.bracket?.halves.map((h) => h.rounds[0][0].number)).toEqual([
      2, 1,
    ]);
    expect(fr.hasFinal).toBe(true);
  });

  it('round name: null when the feeders have no or different labels', () => {
    const unlabeled = run(
      [
        pg(1, 'seed:1', 'seed:4', null),
        pg(2, 'seed:2', 'seed:3', null),
        pg(3, 'winner:1', 'winner:2', 'Finale'),
      ],
      [],
    );
    expect(unlabeled.bracket?.rounds).toEqual([null]);
    const mixed = run(
      [
        pg(1, 'seed:1', 'seed:4', 'Halbfinale 1'),
        pg(2, 'seed:2', 'seed:3', 'Semi 2'),
        pg(3, 'winner:1', 'winner:2', 'Finale'),
      ],
      [],
    );
    expect(mixed.bracket?.rounds).toEqual([null]);
  });

  it('group refs work like seeds', () => {
    const games = [
      pg(1, 'group:A:1', 'group:B:2', 'Halbfinale 1'),
      pg(2, 'group:B:1', 'group:A:2', 'Halbfinale 2'),
      pg(3, 'winner:1', 'winner:2', 'Finale'),
      pg(4, 'loser:2', 'loser:1', 'Spiel um Platz 3'),
    ];
    const fr = run(games, []);
    expect(fr.bracket?.halves[0].rounds).toEqual([[games[0]]]);
    expect(fr.bracket?.thirdPlace).toBe(games[3]);
  });
});

describe('buildFinalrunde, quarterfinals', () => {
  /** Groups A and B of four teams ("A1" … "B4"), all group games played. */
  const twoGroups = (() => {
    const teams: TeamLike[] = [];
    const games: GameLike[] = [];
    for (const g of ['A', 'B'])
      for (let i = 1; i <= 4; i++) {
        teams.push({ name: `${g}${i}`, class: CLS, group_name: g });
        for (let j = i + 1; j <= 4; j++)
          games.push({
            class: CLS,
            stage: 'group',
            number: 100 + games.length,
            hometeam: `${g}${i}`,
            awayteam: `${g}${j}`,
            homescore: 10,
            awayscore: 5,
            home_ref: null,
            away_ref: null,
            label: null,
          });
      }
    return { teams, games };
  })();

  type Score = [number, number] | undefined;
  /** The design's 8-team schedule (FinalrundeVF) with a 5–8 mini bracket. */
  const schedule = (s: Record<number, Score> = {}) => [
    pg(1, 'group:A:1', 'group:B:4', 'Viertelfinale 1', s[1]),
    pg(2, 'group:B:2', 'group:A:3', 'Viertelfinale 2', s[2]),
    pg(3, 'group:B:1', 'group:A:4', 'Viertelfinale 3', s[3]),
    pg(4, 'group:A:2', 'group:B:3', 'Viertelfinale 4', s[4]),
    pg(5, 'winner:1', 'winner:2', 'Halbfinale 1', s[5]),
    pg(6, 'winner:3', 'winner:4', 'Halbfinale 2', s[6]),
    pg(7, 'winner:5', 'winner:6', 'Finale', s[7]),
    pg(8, 'loser:5', 'loser:6', 'Spiel um Platz 3', s[8]),
    pg(9, 'loser:1', 'loser:2', '5–8', s[9]),
    pg(10, 'loser:3', 'loser:4', '5–8', s[10]),
    pg(11, 'winner:9', 'winner:10', 'Platz 5/6', s[11]),
    pg(12, 'loser:9', 'loser:10', 'Platz 7/8', s[12]),
  ];
  const quarters: Record<number, Score> = {
    1: [10, 2],
    2: [3, 8],
    3: [9, 1],
    4: [7, 4],
  };
  const all: Record<number, Score> = {
    ...quarters,
    5: [5, 6],
    6: [4, 2],
    7: [3, 1],
    8: [6, 5],
    9: [1, 2],
    10: [5, 3],
    11: [4, 9],
    12: [2, 1],
  };
  const withGroups = (s?: Record<number, Score>) =>
    run([...twoGroups.games, ...schedule(s)], twoGroups.teams);
  const numbers = (games: GameLike[] | undefined) =>
    games?.map((g) => g.number);

  it('nothing played: two rounds per half, 3rd place, Platz 5–8', () => {
    const fr = run(schedule(), []);
    const b = fr.bracket;
    expect(b?.final.number).toBe(7);
    expect(b?.halves.map((h) => h.rounds.map(numbers))).toEqual([
      [[1, 2], [5]],
      [[3, 4], [6]],
    ]);
    expect(b?.rounds).toEqual(['Viertelfinale', 'Halbfinale']);
    expect(b?.thirdPlace?.number).toBe(8);
    expect(b?.losers).toEqual({
      from: 5,
      to: 8,
      games: schedule().slice(8),
    });
    expect(fr.placementGames).toEqual([]);
    expect(fr.ranking).toBeNull();
  });

  it('quarterfinals played: same structure, no ranking yet', () => {
    const fr = withGroups(quarters);
    expect(numbers(fr.bracket?.losers?.games)).toEqual([9, 10, 11, 12]);
    expect(fr.ranking).toBeNull();
  });

  it('all played: full ranking 1–8', () => {
    const fr = withGroups(all);
    expect(fr.ranking?.map((e) => e.team)).toEqual([
      'A3',
      'B1',
      'A1',
      'A2',
      'A4',
      'B2',
      'B4',
      'B3',
    ]);
  });

  it('single 5/6 and 7/8 games of quarterfinal losers form the block', () => {
    const games = [
      ...schedule().slice(0, 8),
      pg(9, 'loser:1', 'loser:3', 'Platz 5/6'),
      pg(10, 'loser:2', 'loser:4', 'Platz 7/8'),
    ];
    const fr = run(games, []);
    expect(numbers(fr.bracket?.losers?.games)).toEqual([9, 10]);
  });

  it('a game with other sides stays in the list; no block without games', () => {
    const games = [
      ...schedule().slice(0, 8),
      pg(9, 'loser:1', 'group:C:1', 'Platz 9'),
    ];
    const fr = run(games, []);
    expect(fr.bracket?.losers).toBeNull();
    expect(numbers(fr.placementGames)).toEqual([9]);
  });

  it('quarterfinals follow the semifinal’s home and away sides', () => {
    const games = [
      ...schedule().slice(0, 4),
      pg(5, 'winner:2', 'winner:1', 'Halbfinale 1'),
      ...schedule().slice(5, 8),
    ];
    const fr = run(games, []);
    expect(fr.bracket?.halves[0].rounds.map(numbers)).toEqual([[2, 1], [5]]);
  });

  it('a game with the same ref on both sides is not in the block', () => {
    const games = [
      ...schedule().slice(0, 8),
      pg(9, 'loser:1', 'loser:1', 'Platz 5/6'),
    ];
    const fr = run(games, []);
    expect(fr.bracket?.losers).toBeNull();
    expect(numbers(fr.placementGames)).toEqual([9]);
  });

  it('seed refs work too', () => {
    const games = [
      pg(1, 'seed:1', 'seed:8', 'Viertelfinale 1'),
      pg(2, 'seed:4', 'seed:5', 'Viertelfinale 2'),
      pg(3, 'seed:2', 'seed:7', 'Viertelfinale 3'),
      pg(4, 'seed:3', 'seed:6', 'Viertelfinale 4'),
      pg(5, 'winner:1', 'winner:2', 'Halbfinale 1'),
      pg(6, 'winner:3', 'winner:4', 'Halbfinale 2'),
      pg(7, 'winner:5', 'winner:6', 'Finale'),
    ];
    const fr = run(games, []);
    expect(fr.bracket?.halves[1].rounds.map(numbers)).toEqual([[3, 4], [6]]);
    expect(fr.bracket?.thirdPlace).toBeNull();
    expect(fr.bracket?.losers).toBeNull();
  });

  it('a half with one round and one with two falls back to the list', () => {
    const games = [
      pg(1, 'seed:1', 'seed:4', 'Viertelfinale 1'),
      pg(2, 'seed:5', 'seed:6', 'Viertelfinale 2'),
      pg(3, 'winner:1', 'winner:2', 'Halbfinale 1'),
      pg(4, 'seed:2', 'seed:3', 'Halbfinale 2'),
      pg(5, 'winner:3', 'winner:4', 'Finale'),
    ];
    expect(run(games, []).bracket).toBeNull();
  });
});

describe('seedTag', () => {
  it.each([
    ['seed:4', '4'],
    ['group:B:1', 'B1'],
    ['winner:3', null],
    [null, null],
  ])('%s → %s', (ref, tag) => expect(seedTag(ref)).toBe(tag));
});
