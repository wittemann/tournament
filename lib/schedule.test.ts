import { describe, expect, it } from 'vitest';
import { gameSides, refLabel } from '@/lib/schedule';
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
