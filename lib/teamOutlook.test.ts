import { describe, expect, it } from 'vitest';
import {
  formatRecord,
  getTeamOutlook,
  teamRecord,
  teamSchedule,
  type OutlookGame,
} from '@/lib/teamOutlook';
import { gameSides, type GameSides } from '@/lib/schedule';
import { games2025, teams2025 } from '@/lib/fixtures/games2025';
import type { GameLike } from '@/lib/standings';

let nextId = 1;

function g(
  time: string,
  home: string | null,
  away: string | null,
  overrides: Partial<OutlookGame> = {},
): OutlookGame {
  return {
    id: nextId++,
    class: 'Schüler',
    time: `${time}:00`,
    hometeam: home,
    awayteam: away,
    homescore: null,
    awayscore: null,
    scorer: null,
    scorer_class: null,
    eventname: null,
    ...overrides,
  };
}

const noSides = new Map<number, GameSides>();

describe('getTeamOutlook', () => {
  const played = g('09:00', 'A', 'B', { homescore: 5, awayscore: 3 });
  const g1030 = g('10:30', 'C', 'A');
  const duty1115 = g('11:15', 'B', 'C', { scorer: 'A' });
  const g1200 = g('12:00', 'A', 'D');
  const games = [played, g1030, duty1115, g1200];

  it('finds the next game and hides a duty that is neither first nor soon', () => {
    const o = getTeamOutlook(games, noSides, 'A', '09:30');
    expect(o.current).toBeNull();
    expect(o.next).toBe(g1030);
    expect(o.scorerDuty).toBeNull();
    expect(o.done).toBe(false);
  });

  it('shows the duty when it starts within 60 minutes', () => {
    const o = getTeamOutlook(games, noSides, 'A', '10:15');
    expect(o.next).toBe(g1030);
    expect(o.scorerDuty).toBe(duty1115);
  });

  it('shows the duty when it is the next appointment', () => {
    const o = getTeamOutlook([played, duty1115, g1200], noSides, 'A', '09:30');
    expect(o.next).toBe(g1200);
    expect(o.scorerDuty).toBe(duty1115);
  });

  it('reports a running game as current and still finds the next one', () => {
    const o = getTeamOutlook(games, noSides, 'A', '10:40');
    expect(o.current).toBe(g1030);
    expect(o.next).toBe(g1200);
    expect(o.scorerDuty).toBe(duty1115);
  });

  it('a game starting this minute runs, it is not next', () => {
    const o = getTeamOutlook(games, noSides, 'A', '10:30');
    expect(o.current).toBe(g1030);
    expect(o.next).toBe(g1200);
  });

  it('skips a game whose result is missing beyond the running window', () => {
    const o = getTeamOutlook(games, noSides, 'A', '11:01');
    expect(o.current).toBeNull();
    expect(o.next).toBe(g1200);
  });

  it('takes the first game before the event starts', () => {
    const first = g('09:00', 'A', 'B');
    const o = getTeamOutlook([first, g1030], noSides, 'A', '07:00');
    expect(o.next).toBe(first);
  });

  it('is done when no game and no duty is left', () => {
    const o = getTeamOutlook(games, noSides, 'A', '12:31');
    expect(o).toEqual({
      current: null,
      next: null,
      scorerDuty: null,
      done: true,
    });
  });

  it('is not done while only a scorer duty is left', () => {
    const o = getTeamOutlook([played, duty1115], noSides, 'A', '09:30');
    expect(o.next).toBeNull();
    expect(o.scorerDuty).toBe(duty1115);
    expect(o.done).toBe(false);
  });

  it('matches the scorer by exact name only (no club prefix)', () => {
    const duty = g('11:00', 'X', 'Y', { scorer: 'Bretten' });
    const o = getTeamOutlook([duty], noSides, 'Bretten 1', '10:30');
    expect(o.scorerDuty).toBeNull();
    expect(getTeamOutlook([duty], noSides, 'Bretten', '10:30').scorerDuty).toBe(
      duty,
    );
  });

  it('keeps a running scorer duty (e.g. the Finale) instead of being done', () => {
    const final = g('18:30', 'X', 'Y', { scorer: 'A' });
    const o = getTeamOutlook([played, final], noSides, 'A', '18:35');
    expect(o.next).toBeNull();
    expect(o.scorerDuty).toBe(final);
    expect(o.done).toBe(false);
  });

  it('drops a duty whose result is missing beyond the running window', () => {
    const final = g('18:30', 'X', 'Y', { scorer: 'A' });
    const o = getTeamOutlook([played, final], noSides, 'A', '19:01');
    expect(o.scorerDuty).toBeNull();
    expect(o.done).toBe(true);
  });

  it('ignores events', () => {
    const event = g('10:00', null, null, { eventname: 'Siegerehrung' });
    const o = getTeamOutlook([event], noSides, 'A', '09:00');
    expect(o.done).toBe(true);
  });

  it('counts a placement game once its side resolves to the team', () => {
    const placement = g('15:00', null, null);
    const sides = new Map<number, GameSides>([
      [
        placement.id,
        {
          home: { team: 'A', ref: 'Seed 1' },
          away: { team: null, ref: 'Seed 4' },
        },
      ],
    ]);
    expect(getTeamOutlook([placement], sides, 'A', '14:00').next).toBe(
      placement,
    );
    expect(getTeamOutlook([placement], noSides, 'A', '14:00').next).toBeNull();
  });
});

describe('teamSchedule', () => {
  it('lists games, scorer duties and the events of its classes in order', () => {
    const conf = g('08:00', null, null, { eventname: 'Konferenz' });
    const tballEvent = g('08:30', null, null, {
      eventname: 'Siegerehrung',
      class: 'T-Ball',
    });
    const game = g('09:00', 'A', 'B');
    const other = g('09:00', 'C', 'D');
    const duty = g('09:30', 'C', 'D', { scorer: 'A' });
    const list = teamSchedule(
      [conf, tballEvent, game, other, duty],
      noSides,
      'A',
    );
    expect(list).toEqual([
      { kind: 'event', game: conf },
      { kind: 'game', game },
      { kind: 'scorer', game: duty },
    ]);
  });
});

describe('teamSchedule scorer classes', () => {
  it("a T-Ball team scoring a Schüler game doesn't pull in Schüler events", () => {
    const schuelerEvent = g('19:00', null, null, { eventname: 'Siegerehrung' });
    const tballEvent = g('13:30', null, null, {
      eventname: 'Siegerehrung',
      class: 'T-Ball',
    });
    const tballGame = g('10:00', 'Bretten', 'Z', { class: 'T-Ball' });
    const duty = g('18:30', 'X', 'Y', {
      scorer: 'Bretten',
      scorer_class: 'T-Ball',
    });
    const list = teamSchedule(
      [tballGame, tballEvent, duty, schuelerEvent],
      noSides,
      'Bretten',
    );
    expect(list.map((e) => e.kind)).toEqual(['game', 'event', 'scorer']);
    expect(list[1].game).toBe(tballEvent);
  });
});

describe('teamRecord / formatRecord', () => {
  const games = games2025 as GameLike[];

  it('counts group games only (2025: Bretten 2)', () => {
    const r = teamRecord(games, teams2025, 'Bretten 2');
    expect(formatRecord(r)).toBe('0 S · 4 N');
  });

  it('matches the group table row', () => {
    const r = teamRecord(games, teams2025, 'Mannheim');
    expect(r).toEqual({ wins: 4, losses: 0, ties: 0 });
  });

  it('counts only the given class', () => {
    expect(teamRecord(games, teams2025, 'Mannheim', 'T-Ball')).toEqual({
      wins: 0,
      losses: 0,
      ties: 0,
    });
    expect(teamRecord(games, teams2025, 'Mannheim', 'Schüler').wins).toBe(4);
  });

  it('adds ties only when there are any', () => {
    expect(formatRecord({ wins: 1, losses: 1, ties: 0 })).toBe('1 S · 1 N');
    expect(formatRecord({ wins: 2, losses: 0, ties: 1 })).toBe(
      '2 S · 0 N · 1 U',
    );
  });

  it('is zero for an unknown team', () => {
    expect(teamRecord(games, teams2025, 'Nobody')).toEqual({
      wins: 0,
      losses: 0,
      ties: 0,
    });
  });
});

describe('with the 2025 fixture', () => {
  const games = games2025.map((game, i) => ({ ...game, id: i + 1 }));
  const sides = gameSides(games, teams2025);

  it('Bretten 2 at 14:18: next game 14:30, scorer duty 15:00 within the hour', () => {
    const open = games.map((game) =>
      game.time >= '14:30'
        ? { ...game, homescore: null, awayscore: null }
        : game,
    );
    const o = getTeamOutlook(open, sides, 'Bretten 2', '14:18');
    expect(o.next?.time).toBe('14:30:00');
    expect(o.scorerDuty?.time).toBe('15:00:00');
  });
});
