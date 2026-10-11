import { describe, expect, it } from 'vitest';
import { classesInUse } from '@/lib/classesInUse';

describe('classesInUse', () => {
  it('lists classes present in teams or games, in schema order', () => {
    const games = [{ class: 'Jugend' as const }];
    const teams = [{ class: 'T-Ball' as const }, { class: 'Schüler' as const }];
    expect(classesInUse(games, teams)).toEqual(['Schüler', 'T-Ball', 'Jugend']);
  });

  it('returns nothing without teams or games', () => {
    expect(classesInUse([], [])).toEqual([]);
  });
});
