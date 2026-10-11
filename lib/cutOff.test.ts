import { describe, expect, it } from 'vitest';
import { cutOff, cutOffLegend } from '@/lib/cutOff';
import { games2025, teams2025 } from '@/lib/fixtures/games2025';
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
): GameLike {
  return {
    class: CLS,
    stage: 'placement',
    number,
    hometeam: null,
    awayteam: null,
    homescore: null,
    awayscore: null,
    home_ref: homeRef,
    away_ref: awayRef,
    label,
  };
}

/** `groups`: letter -> team count. Group games are left out (only sizes matter). */
function teamsOf(groups: Record<string, number>): TeamLike[] {
  return Object.entries(groups).flatMap(([group, n]) =>
    Array.from({ length: n }, (_, i) => ({
      name: `${group}${i + 1}`,
      class: CLS,
      group_name: group,
    })),
  );
}

const ctxOf = (games: GameLike[], groups: Record<string, number>) =>
  standingsContext(games, teamsOf(groups), CLS);

describe('cutOff, 2025 data', () => {
  it('Schüler: line under place 1 of each group, the best 2nd is open', () => {
    const co = cutOff(standingsContext(games2025, teams2025, 'Schüler'));
    expect(co).toEqual({
      round: 'Halbfinale',
      afterPlace: { A: 1, B: 1, C: 1 },
      extra: { place: 2, count: 1 },
    });
    expect(cutOffLegend(co, 'A')).toBe(
      'Platz 1 im Halbfinale, dazu der beste 2. Platz',
    );
  });

  it('T-Ball: line under place 2 of both groups', () => {
    const co = cutOff(standingsContext(games2025, teams2025, 'T-Ball'));
    expect(co).toEqual({
      round: 'Halbfinale',
      afterPlace: { A: 2, B: 2 },
      extra: null,
    });
    expect(cutOffLegend(co, 'B')).toBe('Platz 1–2 im Halbfinale');
    expect(cutOffLegend(co, 'Z')).toBeNull();
  });
});

describe('cutOff, made-up structures', () => {
  it('quarterfinals with 8 teams from 2 groups of 5: line under place 4', () => {
    const games = [
      pg(1, 'seed:1', 'seed:8', 'Viertelfinale 1'),
      pg(2, 'seed:4', 'seed:5', 'Viertelfinale 2'),
      pg(3, 'seed:2', 'seed:7', 'Viertelfinale 3'),
      pg(4, 'seed:3', 'seed:6', 'Viertelfinale 4'),
      pg(5, 'winner:1', 'winner:2', 'Halbfinale 1'),
      pg(6, 'winner:3', 'winner:4', 'Halbfinale 2'),
      pg(7, 'winner:5', 'winner:6', 'Finale'),
      pg(8, 'loser:5', 'loser:6', 'Spiel um Platz 3'),
      pg(9, 'loser:1', 'loser:2', 'Platz 5/6'),
    ];
    const co = cutOff(ctxOf(games, { A: 5, B: 5 }));
    expect(co).toEqual({
      round: 'Viertelfinale',
      afterPlace: { A: 4, B: 4 },
      extra: null,
    });
    expect(cutOffLegend(co, 'A')).toBe('Platz 1–4 im Viertelfinale');
  });

  it('group refs qualify per group, a group of that size gets no line', () => {
    const games = [
      pg(1, 'group:A:1', 'group:B:2', 'Halbfinale 1'),
      pg(2, 'group:B:1', 'group:A:2', 'Halbfinale 2'),
      pg(3, 'winner:1', 'winner:2', 'Finale'),
    ];
    const co = cutOff(ctxOf(games, { A: 4, B: 2 }));
    expect(co?.afterPlace).toEqual({ A: 2 });
  });

  it('no line when the qualifying seeds do not fill a whole place', () => {
    const games = [
      pg(1, 'seed:1', 'seed:2', 'Halbfinale 1'),
      pg(2, 'winner:1', 'seed:3', 'Finale'),
    ];
    expect(cutOff(ctxOf(games, { A: 3, B: 3, C: 3, D: 3 }))).toBeNull();
  });

  it('final without label falls back to a generic legend', () => {
    const co = cutOff(ctxOf([pg(1, 'seed:1', 'seed:2', null)], { A: 3, B: 3 }));
    expect(co?.round).toBeNull();
    expect(cutOffLegend(co, 'A')).toBe('Platz 1 in der Finalrunde');
  });

  it('a mini round robin alone is not a bracket', () => {
    const games = [
      pg(1, 'seed:1', 'seed:2', 'Runde'),
      pg(2, 'seed:2', 'seed:3', 'Runde'),
      pg(3, 'seed:3', 'seed:1', 'Runde'),
    ];
    expect(cutOff(ctxOf(games, { A: 3, B: 3 }))).toBeNull();
  });

  it('unequal sizes: a small group drops out of the line', () => {
    const games = [
      pg(1, 'seed:1', 'seed:4', 'Halbfinale 1'),
      pg(2, 'seed:2', 'seed:3', 'Halbfinale 2'),
      pg(3, 'winner:1', 'winner:2', 'Finale'),
    ];
    const co = cutOff(ctxOf(games, { A: 5, B: 2 }));
    expect(co?.afterPlace).toEqual({ A: 2 });
    expect(co?.extra).toBeNull();
  });

  it('a Platz 5–8 mini bracket does not replace the real final', () => {
    const games = [
      pg(1, 'seed:5', 'seed:8', 'Viertelfinale 1'),
      pg(2, 'seed:6', 'seed:7', 'Viertelfinale 2'),
      pg(3, 'winner:1', 'winner:2', 'Platz 5/6'),
      pg(4, 'seed:1', 'seed:4', 'Halbfinale 1'),
      pg(5, 'seed:2', 'seed:3', 'Halbfinale 2'),
      pg(6, 'winner:4', 'winner:5', 'Finale'),
      pg(7, 'loser:4', 'loser:5', 'Spiel um Platz 3'),
    ];
    expect(cutOff(ctxOf(games, { A: 4, B: 4 }))).toEqual({
      round: 'Halbfinale',
      afterPlace: { A: 2, B: 2 },
      extra: null,
    });
  });

  it('seeds 1–7 of groups 3/3/2: partial third place, no line for C', () => {
    const games = [
      pg(1, 'seed:4', 'seed:5', 'Viertelfinale 1'),
      pg(2, 'seed:2', 'seed:7', 'Viertelfinale 2'),
      pg(3, 'seed:3', 'seed:6', 'Viertelfinale 3'),
      pg(4, 'seed:1', 'winner:1', 'Halbfinale 1'),
      pg(5, 'winner:2', 'winner:3', 'Halbfinale 2'),
      pg(6, 'winner:4', 'winner:5', 'Finale'),
    ];
    const co = cutOff(ctxOf(games, { A: 3, B: 3, C: 2 }));
    expect(co?.afterPlace).toEqual({ A: 2, B: 2 });
    expect(co?.extra).toEqual({ place: 3, count: 1 });
  });

  it('byes: leaves at different depths give no round name', () => {
    const games = [
      pg(1, 'seed:4', 'seed:5', 'Viertelfinale 1'),
      pg(2, 'seed:1', 'winner:1', 'Halbfinale 1'),
      pg(3, 'seed:2', 'seed:3', 'Halbfinale 2'),
      pg(4, 'winner:2', 'winner:3', 'Finale'),
    ];
    const co = cutOff(ctxOf(games, { A: 3, B: 3 }));
    expect(co?.round).toBeNull();
    expect(co?.afterPlace).toEqual({ A: 2, B: 2 });
    expect(cutOffLegend(co, 'A')).toBe(
      'Platz 1–2 in der Finalrunde, dazu der beste 3. Platz',
    );
  });

  it('no placement games: no line', () => {
    expect(cutOff(ctxOf([], { A: 4, B: 4 }))).toBeNull();
  });
});
