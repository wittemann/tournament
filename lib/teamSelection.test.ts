import { describe, expect, it } from 'vitest';
import {
  matchesTeam,
  parseTeam,
  resolveTeam,
  serializeTeam,
  teamNameInClass,
  teamOptions,
} from '@/lib/teamSelection';

describe('serializeTeam / parseTeam', () => {
  it('round-trips name and class', () => {
    const team = { name: 'Stuttgart 1', cls: 'T-Ball' as const };
    expect(serializeTeam(team)).toBe('T-Ball|Stuttgart 1');
    expect(parseTeam(serializeTeam(team))).toEqual(team);
  });

  it('keeps a "|" inside the name', () => {
    expect(parseTeam('Schüler|A|B')).toEqual({ name: 'A|B', cls: 'Schüler' });
  });

  it('treats "all", empty and missing values as no team', () => {
    expect(serializeTeam(null)).toBe('all');
    expect(parseTeam('all')).toBeNull();
    expect(parseTeam('')).toBeNull();
    expect(parseTeam(null)).toBeNull();
  });

  it('reads a plain name (legacy) as any class', () => {
    expect(parseTeam('Stuttgart 1')).toEqual({
      name: 'Stuttgart 1',
      cls: null,
    });
  });

  it('does not crash on garbage', () => {
    expect(parseTeam('|')).toEqual({ name: '|', cls: null });
    expect(parseTeam('Unknown|X')).toEqual({ name: 'Unknown|X', cls: null });
    expect(parseTeam('T-Ball|')).toEqual({ name: 'T-Ball|', cls: null });
    expect(parseTeam('{"x":1}')).toEqual({ name: '{"x":1}', cls: null });
  });
});

describe('matchesTeam', () => {
  const tBall = { name: 'Stuttgart 1', cls: 'T-Ball' as const };
  const legacy = { name: 'Stuttgart 1', cls: null };

  it('matches only the selected class for a new value', () => {
    expect(matchesTeam(tBall, 'Stuttgart 1', 'T-Ball')).toBe(true);
    expect(matchesTeam(tBall, 'Stuttgart 1', 'Schüler')).toBe(false);
    expect(matchesTeam(tBall, 'Other', 'T-Ball')).toBe(false);
  });

  it('matches every class for a legacy value', () => {
    expect(matchesTeam(legacy, 'Stuttgart 1', 'T-Ball')).toBe(true);
    expect(matchesTeam(legacy, 'Stuttgart 1', 'Schüler')).toBe(true);
    expect(matchesTeam(legacy, 'Other', 'Schüler')).toBe(false);
  });

  it('matches nothing without a selection or team', () => {
    expect(matchesTeam(null, 'Stuttgart 1', 'T-Ball')).toBe(false);
    expect(matchesTeam(tBall, null, 'T-Ball')).toBe(false);
  });
});

describe('teamNameInClass', () => {
  it('returns the name only in the selected class', () => {
    expect(teamNameInClass('T-Ball|Stuttgart 1', 'T-Ball')).toBe('Stuttgart 1');
    expect(teamNameInClass('T-Ball|Stuttgart 1', 'Schüler')).toBe('all');
  });

  it('keeps a legacy name in every class', () => {
    expect(teamNameInClass('Stuttgart 1', 'Schüler')).toBe('Stuttgart 1');
  });

  it('gives "all" for no team or no class', () => {
    expect(teamNameInClass('all', 'Schüler')).toBe('all');
    expect(teamNameInClass('Stuttgart 1', undefined)).toBe('all');
  });
});

describe('teamOptions', () => {
  it('labels names used in several classes with the class', () => {
    const options = teamOptions([
      { name: 'Stuttgart 1', cls: 'Schüler' },
      { name: 'Bretten', cls: 'T-Ball' },
      { name: 'Stuttgart 1', cls: 'T-Ball' },
    ]);
    expect(options).toEqual([
      { value: 'T-Ball|Bretten', label: 'Bretten' },
      { value: 'Schüler|Stuttgart 1', label: 'Stuttgart 1 (Schüler)' },
      { value: 'T-Ball|Stuttgart 1', label: 'Stuttgart 1 (T-Ball)' },
    ]);
  });
});

describe('resolveTeam', () => {
  const choices = [
    { name: 'Bretten', cls: 'T-Ball' as const },
    { name: 'Stuttgart 1', cls: 'Schüler' as const },
    { name: 'Stuttgart 1', cls: 'T-Ball' as const },
  ];

  it('maps a legacy name in one class to that class', () => {
    expect(resolveTeam({ name: 'Bretten', cls: null }, choices)).toEqual(
      choices[0],
    );
  });

  it('keeps a legacy name used in several classes', () => {
    const legacy = { name: 'Stuttgart 1', cls: null };
    expect(resolveTeam(legacy, choices)).toBe(legacy);
  });

  it('drops unknown teams but keeps the value while loading', () => {
    expect(resolveTeam({ name: 'Gone', cls: null }, choices)).toBeNull();
    expect(
      resolveTeam({ name: 'Bretten', cls: 'Schüler' }, choices),
    ).toBeNull();
    const legacy = { name: 'Gone', cls: null };
    expect(resolveTeam(legacy, [])).toBe(legacy);
    expect(resolveTeam(null, choices)).toBeNull();
  });

  it('keeps an exact new-format match', () => {
    const sel = { name: 'Stuttgart 1', cls: 'T-Ball' as const };
    expect(resolveTeam(sel, choices)).toBe(sel);
  });
});
