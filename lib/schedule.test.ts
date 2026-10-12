import { describe, expect, it } from 'vitest';
import { gameSides, playingTeams, refLabel } from '@/lib/schedule';
import { games2025, teams2025 } from '@/lib/fixtures/games2025';
import type { GameLike, TeamLike } from '@/lib/standings';

type G = GameLike & { id: number };
let nextId = 1;

function g(
  home: string,
  hs: number | null,
  as: number | null,
  away: string,
  cls: GameLike['class'] = 'Schüler',
): G {
  const id = nextId++;
  return {
    id,
    class: cls,
    stage: 'group',
    number: id,
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
  cls: GameLike['class'] = 'Schüler',
): G {
  return {
    id: 1000 + number,
    class: cls,
    stage: 'placement',
    number,
    hometeam: null,
    awayteam: null,
    homescore: hs,
    awayscore: as,
    home_ref: homeRef,
    away_ref: awayRef,
    label: null,
  };
}

const team = (
  name: string,
  group: string,
  cls: TeamLike['class'] = 'Schüler',
): TeamLike => ({ name, class: cls, group_name: group });

describe('refLabel', () => {
  it('labels every ref kind in German', () => {
    expect(refLabel('seed:1')).toBe('Seed 1');
    expect(refLabel('group:A:5')).toBe('5. Gruppe A');
    expect(refLabel('winner:44')).toBe('Sieger Spiel 44');
    expect(refLabel('loser:45')).toBe('Verlierer Spiel 45');
  });

  it('returns invalid refs unchanged', () => {
    expect(refLabel('seed:0')).toBe('seed:0');
    expect(refLabel('nonsense')).toBe('nonsense');
    expect(refLabel('')).toBe('');
  });

  it("uses the referenced game's label, abbreviating HF/VF", () => {
    const labels = new Map<number, string | null>([
      [40, 'Viertelfinale 3'],
      [44, 'Halbfinale 2'],
      [45, 'Platz 5/6'],
      [46, null],
      [47, '  '],
    ]);
    const labelOf = (n: number) => labels.get(n);
    expect(refLabel('winner:40', labelOf)).toBe('Sieger VF 3');
    expect(refLabel('winner:44', labelOf)).toBe('Sieger HF 2');
    expect(refLabel('loser:44', labelOf)).toBe('Verlierer HF 2');
    expect(refLabel('loser:45', labelOf)).toBe('Verlierer Platz 5/6');
    expect(refLabel('winner:46', labelOf)).toBe('Sieger Spiel 46');
    expect(refLabel('winner:47', labelOf)).toBe('Sieger Spiel 47');
    expect(refLabel('winner:99', labelOf)).toBe('Sieger Spiel 99');
    expect(refLabel('group:A:5', labelOf)).toBe('5. Gruppe A');
  });
});

describe('gameSides', () => {
  const teams = [team('A', 'A'), team('B', 'A'), team('C', 'A')];

  it('keeps stored names for group games and has no ref hint', () => {
    const game = g('A', null, null, 'B');
    expect(gameSides([game], teams).get(game.id)).toEqual({
      home: { team: 'A', ref: null },
      away: { team: 'B', ref: null },
    });
  });

  it('shows only the placeholder while the group stage is running', () => {
    const games = [
      g('A', 5, 1, 'B'),
      g('B', null, null, 'C'),
      p(10, 'seed:1', 'seed:2'),
    ];
    expect(gameSides(games, teams).get(1010)).toEqual({
      home: { team: null, ref: 'Seed 1' },
      away: { team: null, ref: 'Seed 2' },
    });
  });

  it('resolves seeds and winners once results are in', () => {
    const games = [
      g('A', 5, 1, 'B'),
      g('B', 5, 1, 'C'),
      g('A', 5, 1, 'C'),
      p(10, 'seed:1', 'seed:2', 3, 7),
      p(11, 'winner:10', 'group:A:3'),
    ];
    const sides = gameSides(games, teams);
    expect(sides.get(1010)).toEqual({
      home: { team: 'A', ref: 'Seed 1' },
      away: { team: 'B', ref: 'Seed 2' },
    });
    expect(sides.get(1011)).toEqual({
      home: { team: 'B', ref: 'Sieger Spiel 10' },
      away: { team: 'C', ref: '3. Gruppe A' },
    });
  });

  it("names winner/loser refs after the referenced game's label", () => {
    const games = [
      { ...p(20, 'seed:1', 'seed:4'), label: 'Halbfinale 1' },
      { ...p(21, 'seed:2', 'seed:3'), label: 'Halbfinale 2' },
      { ...p(22, 'winner:20', 'winner:21'), label: 'Finale' },
      p(23, 'loser:20', 'loser:22'),
    ];
    const sides = gameSides(games, teams);
    expect(sides.get(1022)?.home.ref).toBe('Sieger HF 1');
    expect(sides.get(1022)?.away.ref).toBe('Sieger HF 2');
    expect(sides.get(1023)?.home.ref).toBe('Verlierer HF 1');
    expect(sides.get(1023)?.away.ref).toBe('Verlierer Finale');
  });

  it('resolves each class against its own teams and games', () => {
    const tball = [team('X', 'A', 'T-Ball'), team('Y', 'A', 'T-Ball')];
    const games = [
      g('A', 5, 1, 'B'),
      g('X', 1, 5, 'Y', 'T-Ball'),
      p(20, 'seed:1', 'seed:2', null, null, 'T-Ball'),
    ];
    expect(gameSides(games, [...teams, ...tball]).get(1020)).toEqual({
      home: { team: 'Y', ref: 'Seed 1' },
      away: { team: 'X', ref: 'Seed 2' },
    });
  });
});

describe('playingTeams', () => {
  const game = (
    cls: 'Schüler' | 'T-Ball',
    home: string,
    away: string | null = null,
    scorer: string | null = null,
    scorer_class: 'Schüler' | 'T-Ball' | null = null,
  ) => ({ class: cls, hometeam: home, awayteam: away, scorer, scorer_class });

  it('keeps a shared name once per class', () => {
    const teams: TeamLike[] = [
      { name: 'Stuttgart 1', class: 'Schüler', group_name: 'A' },
      { name: 'Stuttgart 1', class: 'T-Ball', group_name: 'A' },
      { name: 'Idle', class: 'T-Ball', group_name: 'A' },
    ];
    expect(
      playingTeams(teams, [
        game('Schüler', 'Stuttgart 1'),
        game('T-Ball', 'Stuttgart 1'),
      ]),
    ).toEqual([
      { name: 'Stuttgart 1', cls: 'Schüler' },
      { name: 'Stuttgart 1', cls: 'T-Ball' },
    ]);
  });

  it('lists every 2025 team', () => {
    expect(playingTeams(teams2025, games2025)).toHaveLength(teams2025.length);
  });

  it('ignores names that are not teams and teams without games', () => {
    const result = playingTeams(
      [
        { name: 'A', class: 'Schüler', group_name: 'A' },
        { name: 'B', class: 'Schüler', group_name: 'A' },
        { name: 'Idle', class: 'Schüler', group_name: 'A' },
      ],
      [game('Schüler', 'A', 'B', 'Club')],
    );
    expect(result.map((t) => t.name)).toEqual(['A', 'B']);
  });

  it('counts a scorer of another class as playing in that class', () => {
    expect(
      playingTeams(
        [{ name: 'Bretten', class: 'T-Ball', group_name: 'A' }],
        [game('Schüler', 'X', 'Y', 'Bretten', 'T-Ball')],
      ),
    ).toEqual([{ name: 'Bretten', cls: 'T-Ball' }]);
  });
});
