import { describe, expect, it } from 'vitest';
import {
  RUNNING_WINDOW_MINUTES,
  isRunning,
  toMinutes,
  type RunningCandidate,
} from '@/lib/gameStatus';

function game(overrides: Partial<RunningCandidate> = {}): RunningCandidate {
  return {
    time: '10:00:00',
    homescore: null,
    awayscore: null,
    eventname: null,
    ...overrides,
  };
}

describe('RUNNING_WINDOW_MINUTES', () => {
  it('is 30 minutes', () => {
    expect(RUNNING_WINDOW_MINUTES).toBe(30);
  });
});

describe('toMinutes', () => {
  it('parses HH:MM and HH:MM:SS, ignoring seconds', () => {
    expect(toMinutes('10:30')).toBe(630);
    expect(toMinutes('10:30:59')).toBe(630);
    expect(toMinutes('00:05:00')).toBe(5);
  });
});

describe('isRunning', () => {
  it('is true just after the start', () => {
    expect(isRunning(game(), '10:00')).toBe(true);
  });

  it('is true at 30 minutes (window is inclusive)', () => {
    expect(isRunning(game(), '10:30')).toBe(true);
  });

  it('is false at 31 minutes', () => {
    expect(isRunning(game(), '10:31')).toBe(false);
  });

  it('is false before the game has started', () => {
    expect(isRunning(game({ time: '10:30:00' }), '10:29')).toBe(false);
  });

  it('is false when a score is entered', () => {
    expect(isRunning(game({ homescore: 3, awayscore: 1 }), '10:05')).toBe(
      false,
    );
  });

  it('is false when only one score is entered', () => {
    expect(isRunning(game({ homescore: 3 }), '10:05')).toBe(false);
    expect(isRunning(game({ awayscore: 0 }), '10:05')).toBe(false);
  });

  it('is false for a 0:0 result (0 is a score, not "no result")', () => {
    expect(isRunning(game({ homescore: 0, awayscore: 0 }), '10:05')).toBe(
      false,
    );
  });

  it('is false for event rows', () => {
    expect(isRunning(game({ eventname: 'Siegerehrung' }), '10:05')).toBe(false);
  });

  it('handles times with seconds in the game time', () => {
    const g = game({ time: '10:15:45' });
    expect(isRunning(g, '10:15')).toBe(true);
    expect(isRunning(g, '10:45')).toBe(true);
    expect(isRunning(g, '10:46')).toBe(false);
  });
});
