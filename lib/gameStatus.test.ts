import { describe, expect, it } from 'vitest';
import {
  RUNNING_WINDOW_MINUTES,
  gameState,
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

describe('gameState', () => {
  it('is upcoming before the start and before mount', () => {
    expect(gameState(game(), '09:59')).toEqual({
      phase: 'upcoming',
      winner: null,
    });
    expect(gameState(game(), null).phase).toBe('upcoming');
  });

  it('is running inside the window without a result', () => {
    expect(gameState(game(), '10:15')).toEqual({
      phase: 'running',
      winner: null,
    });
  });

  it('is upcoming again when the window passed without a result', () => {
    expect(gameState(game(), '10:31').phase).toBe('upcoming');
  });

  it('is played with the winning side once scores are in', () => {
    expect(gameState(game({ homescore: 7, awayscore: 3 }), '10:15')).toEqual({
      phase: 'played',
      winner: 'home',
    });
    expect(gameState(game({ homescore: 2, awayscore: 9 }), null).winner).toBe(
      'away',
    );
  });

  it('has no winner on a tie or a half-entered result', () => {
    expect(gameState(game({ homescore: 4, awayscore: 4 }), '12:00')).toEqual({
      phase: 'played',
      winner: null,
    });
    expect(gameState(game({ homescore: 4 }), '10:05')).toEqual({
      phase: 'played',
      winner: null,
    });
  });
});
