import { describe, expect, it } from 'vitest';
import type { RunningCandidate } from '@/lib/gameStatus';
import { groupBySlot, slotStatus, type Slot } from '@/lib/slots';

function game(overrides: Partial<RunningCandidate> = {}): RunningCandidate {
  return {
    time: '14:00:00',
    homescore: null,
    awayscore: null,
    eventname: null,
    ...overrides,
  };
}

function slot(...games: RunningCandidate[]): Slot<RunningCandidate> {
  return { time: games[0].time, games };
}

describe('groupBySlot', () => {
  it('groups consecutive games with the same time, keeping order', () => {
    const a = { id: 1, time: '13:30:00' };
    const b = { id: 2, time: '13:30:00' };
    const c = { id: 3, time: '14:00:00' };
    expect(groupBySlot([a, b, c])).toEqual([
      { time: '13:30:00', games: [a, b] },
      { time: '14:00:00', games: [c] },
    ]);
  });

  it('returns no slots for no games', () => {
    expect(groupBySlot([])).toEqual([]);
  });
});

describe('slotStatus', () => {
  it('is running when any game in the slot is running', () => {
    const s = slot(game({ homescore: 3, awayscore: 1 }), game());
    expect(slotStatus(s, '14:18')).toEqual({ kind: 'running' });
  });

  it('is finished when every real game has a result', () => {
    const s = slot(
      game({ homescore: 3, awayscore: 1 }),
      game({ homescore: 2 }),
      game({ eventname: 'Mittagspause' }),
    );
    expect(slotStatus(s, '14:10')).toEqual({ kind: 'finished' });
    expect(slotStatus(s, null)).toEqual({ kind: 'finished' });
  });

  it('counts down within 60 minutes before the start', () => {
    const s = slot(game({ time: '14:30:00' }));
    expect(slotStatus(s, '14:18')).toEqual({ kind: 'soon', minutes: 12 });
    expect(slotStatus(s, '13:30')).toEqual({ kind: 'soon', minutes: 60 });
    expect(slotStatus(s, '14:29')).toEqual({ kind: 'soon', minutes: 1 });
  });

  it('shows nothing further ahead or before mount', () => {
    const s = slot(game({ time: '14:30:00' }));
    expect(slotStatus(s, '13:29')).toBeNull();
    expect(slotStatus(s, null)).toBeNull();
  });

  it('shows nothing for a past slot with missing results', () => {
    const s = slot(game({ homescore: 4, awayscore: 2 }), game());
    expect(slotStatus(s, '14:31')).toBeNull();
  });

  it('shows running at the start minute', () => {
    expect(slotStatus(slot(game()), '14:00')).toEqual({ kind: 'running' });
  });

  it('treats event-only slots by time only', () => {
    const s = slot(game({ time: '15:00:00', eventname: 'Siegerehrung' }));
    expect(slotStatus(s, '14:18')).toEqual({ kind: 'soon', minutes: 42 });
    expect(slotStatus(s, '15:00')).toBeNull();
    expect(slotStatus(s, '16:00')).toBeNull();
  });
});
