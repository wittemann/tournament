/**
 * Replays the 2025 tournament (ADR-0006): the computed standings must
 * reproduce the hand-entered group tables (two diff typos corrected) and
 * the final ranking, and every placement ref must resolve to the team that
 * actually played.
 */
import { describe, expect, it } from 'vitest';
import {
  type Class2025,
  expectedGroupTables2025,
  expectedRanking2025,
  games2025,
  placementTeams2025,
  teams2025,
} from '@/lib/fixtures/games2025';
import {
  groupTables,
  placementRanking,
  resolveGame,
  standingsContext,
} from '@/lib/standings';

const classes: Class2025[] = ['Schüler', 'T-Ball'];

describe.each(classes)('2025 replay, %s', (cls) => {
  const ctx = standingsContext(games2025, teams2025, cls);

  it('reproduces the hand-entered group tables', () => {
    const tables = groupTables(games2025, teams2025, cls);
    const actual = Object.fromEntries(
      tables.map((t) => [
        t.group,
        t.rows.map(({ team, wins, losses, diff }) => ({
          team,
          wins,
          losses,
          diff,
        })),
      ]),
    );
    expect(actual).toEqual(expectedGroupTables2025[cls]);
    for (const t of tables) {
      expect(t.complete).toBe(true);
      // Every 2025 group was decided without the name fallback.
      expect(t.rows.some((r) => r.tiedWithNext)).toBe(false);
    }
  });

  it('resolves every placement game to the teams that played it', () => {
    const expected = placementTeams2025.filter((p) => p.class === cls);
    const placement = games2025.filter(
      (g) => g.class === cls && g.stage === 'placement',
    );
    expect(placement.map((g) => g.number)).toEqual(
      expected.map((p) => p.number),
    );
    for (const p of expected) {
      const game = placement.find((g) => g.number === p.number)!;
      expect(
        { number: p.number, ...resolveGame(game, ctx) },
        `#${p.number} ${p.label}`,
      ).toEqual({ number: p.number, home: p.home, away: p.away });
    }
  });

  it('reproduces the hand-entered final ranking', () => {
    const ranking = placementRanking(ctx);
    expect(ranking.map((e) => e.place)).toEqual(
      expectedRanking2025[cls].map((_, i) => i + 1),
    );
    expect(ranking.map((e) => e.team)).toEqual(expectedRanking2025[cls]);
    expect(ranking.some((e) => e.tiedWithNext)).toBe(false);
  });
});
