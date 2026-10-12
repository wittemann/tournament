import { describe, expect, it } from 'vitest';
import { classesInUse } from '@/lib/classesInUse';
import type { GameClass } from '@/lib/standings';

describe('classesInUse', () => {
  it('lists classes present in teams or games, in class order', () => {
    const games = [{ class: 'Jugend' as const }];
    const teams = [{ class: 'Schüler' as const }, { class: 'T-Ball' as const }];
    expect(classesInUse(games, teams)).toEqual(['T-Ball', 'Schüler', 'Jugend']);
  });

  it('defaults to T-Ball (first class) when it is in use', () => {
    const teams = [{ class: 'Jugend' as const }, { class: 'T-Ball' as const }];
    expect(classesInUse([], teams)[0]).toBe('T-Ball');
  });

  it('appends unknown classes instead of dropping them', () => {
    const teams = [
      { class: 'Mini' as GameClass },
      { class: 'Schüler' as const },
    ];
    expect(classesInUse([], teams)).toEqual(['Schüler', 'Mini']);
  });

  it('returns nothing without teams or games', () => {
    expect(classesInUse([], [])).toEqual([]);
  });
});
