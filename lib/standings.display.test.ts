import { describe, expect, it } from 'vitest';
import {
  formatDiff,
  groupStatusLabel,
  recordLabels,
  type TableRow,
} from './standings';

const row = (wins: number, losses: number, ties: number): TableRow => ({
  team: 'x',
  played: wins + losses + ties,
  wins,
  losses,
  ties,
  runsFor: 0,
  runsAgainst: 0,
  diff: 0,
  winRate: 0,
  place: 1,
  tiedWithNext: false,
});

describe('recordLabels', () => {
  it('shows S–N without ties', () => {
    expect(recordLabels([row(4, 0, 0), row(1, 3, 0)])).toEqual({
      withTies: false,
      labels: ['4–0', '1–3'],
    });
  });
  it('shows S–N–U for all rows once any team has a tie', () => {
    expect(recordLabels([row(3, 0, 1), row(1, 3, 0)])).toEqual({
      withTies: true,
      labels: ['3–0–1', '1–3–0'],
    });
  });
});

describe('groupStatusLabel', () => {
  it('reports progress', () => {
    expect(groupStatusLabel({ played: 8, total: 10, complete: false })).toBe(
      '8 von 10 Spielen',
    );
  });
  it('uses the singular for one game', () => {
    expect(groupStatusLabel({ played: 0, total: 1, complete: false })).toBe(
      '0 von 1 Spiel',
    );
  });
  it('is null while the group has no games', () => {
    expect(
      groupStatusLabel({ played: 0, total: 0, complete: false }),
    ).toBeNull();
  });
  it('reports completion', () => {
    expect(groupStatusLabel({ played: 10, total: 10, complete: true })).toBe(
      'abgeschlossen',
    );
  });
});

describe('formatDiff', () => {
  it('signs the difference', () => {
    expect(formatDiff(71)).toBe('+71');
    expect(formatDiff(-33)).toBe('−33');
    expect(formatDiff(0)).toBe('0');
  });
});
