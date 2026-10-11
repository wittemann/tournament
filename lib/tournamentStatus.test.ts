import { describe, expect, it } from 'vitest';
import { finalrundeStart, tournamentFinished } from '@/lib/tournamentStatus';

type G = Parameters<typeof finalrundeStart>[0][number];
const g = (o: Partial<G> = {}): G => ({
  class: 'Schüler',
  stage: 'group',
  homescore: null,
  awayscore: null,
  time: '10:00:00',
  ...o,
});

describe('finalrundeStart', () => {
  const p = (o: Partial<G> = {}) => g({ stage: 'placement', ...o });
  it('returns the earliest placement start', () => {
    expect(
      finalrundeStart(
        [p({ time: '15:00:00' }), p({ time: '14:30:00' })],
        'Schüler',
      ),
    ).toBe('14:30:00');
  });
  it('is null once a placement game has a result', () => {
    expect(
      finalrundeStart([p(), p({ homescore: 2, awayscore: 1 })], 'Schüler'),
    ).toBeNull();
  });
  it('ignores a half-entered score', () => {
    expect(
      finalrundeStart(
        [p({ homescore: 2 }), p({ time: '15:00:00' })],
        'Schüler',
      ),
    ).toBe('10:00:00');
  });
  it('is not hidden by group results', () => {
    expect(
      finalrundeStart(
        [g({ homescore: 1, awayscore: 0 }), p({ time: '14:30:00' })],
        'Schüler',
      ),
    ).toBe('14:30:00');
  });
  it('is null without placement games of the class', () => {
    expect(
      finalrundeStart([g(), p({ class: 'T-Ball' })], 'Schüler'),
    ).toBeNull();
  });
});

describe('tournamentFinished', () => {
  const done = { homescore: 1, awayscore: 0, eventname: null };
  const open = { homescore: null, awayscore: null, eventname: null };
  it('is true when every non-event game has a result', () => {
    expect(
      tournamentFinished([
        done,
        { homescore: null, awayscore: null, eventname: 'Siegerehrung' },
      ]),
    ).toBe(true);
  });
  it('is false while one game is open or half entered', () => {
    expect(tournamentFinished([done, open])).toBe(false);
    expect(tournamentFinished([{ ...done, awayscore: null }])).toBe(false);
  });
  it('is false without games', () => {
    expect(tournamentFinished([])).toBe(false);
  });
});
