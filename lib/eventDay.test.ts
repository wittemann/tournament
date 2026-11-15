import { describe, expect, it } from 'vitest';
import { gameState } from '@/lib/gameStatus';
import { slotStatus } from '@/lib/slots';
import { isEventDay, liveNowFor, eventPhase, localDate } from '@/lib/eventDay';

describe('localDate', () => {
  it('formats the local date with zero padding', () => {
    expect(localDate(new Date(2025, 11, 13, 23, 59))).toBe('2025-12-13');
    expect(localDate(new Date(2026, 0, 5, 0, 0))).toBe('2026-01-05');
  });
});

describe('isEventDay', () => {
  it('is true on the event day only', () => {
    expect(isEventDay('2025-12-13', '2025-12-13')).toBe(true);
    expect(isEventDay('2025-12-13', '2025-12-12')).toBe(false);
    expect(isEventDay('2025-12-13', '2025-12-14')).toBe(false);
  });

  it('counts every day without an event date', () => {
    expect(isEventDay(null, '2025-12-12')).toBe(true);
    expect(isEventDay(undefined, '2030-01-01')).toBe(true);
  });
});

describe('eventPhase', () => {
  it('tells before, day and after', () => {
    expect(eventPhase('2025-12-13', '2025-12-12')).toBe('before');
    expect(eventPhase('2025-12-13', '2025-12-13')).toBe('day');
    expect(eventPhase('2025-12-13', '2025-12-14')).toBe('after');
    expect(eventPhase('2025-12-13', '2026-01-01')).toBe('after');
  });

  it('treats a missing date as the event day', () => {
    expect(eventPhase(null, '2025-12-12')).toBe('day');
    expect(eventPhase(undefined, '2030-01-01')).toBe('day');
  });
});

describe('liveNowFor', () => {
  const at = (date: string) => ({ time: '10:15', date });
  const row = [{ date: '2025-12-13' }];

  it('waits for the clock and the event row', () => {
    expect(liveNowFor(null, row, false)).toEqual({ live: null, outlook: null });
    expect(liveNowFor(at('2025-12-13'), [], true)).toEqual({
      live: null,
      outlook: null,
    });
  });

  it('shows the time on the event day', () => {
    expect(liveNowFor(at('2025-12-13'), row, false)).toEqual({
      live: '10:15',
      outlook: '10:15',
    });
  });

  it('is off the day before, with the card at the start of the day', () => {
    expect(liveNowFor(at('2025-12-12'), row, false)).toEqual({
      live: null,
      outlook: '00:00',
    });
  });

  it('is off the day after, with the card at the end of the day', () => {
    expect(liveNowFor(at('2025-12-14'), row, false)).toEqual({
      live: null,
      outlook: '23:59',
    });
  });

  it('counts every day without a row (also after a failed fetch)', () => {
    expect(liveNowFor(at('2025-12-12'), [], false)).toEqual({
      live: '10:15',
      outlook: '10:15',
    });
  });

  it('shows nothing as running off the day', () => {
    const game = {
      time: '10:00:00',
      homescore: null,
      awayscore: null,
      eventname: null,
    };
    const slot = { time: '10:00:00', games: [game] };
    const on = liveNowFor(at('2025-12-13'), row, false).live;
    const off = liveNowFor(at('2025-12-14'), row, false).live;
    expect(gameState(game, on).phase).toBe('running');
    expect(gameState(game, off).phase).toBe('upcoming');
    expect(slotStatus(slot, on)).toEqual({ kind: 'running' });
    expect(slotStatus(slot, off)).toBeNull();
  });
});
