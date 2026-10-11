import { describe, expect, it } from 'vitest';
import { classColour, neutralClassColour } from '@/lib/classColours';

describe('classColour', () => {
  it('colours Schüler green', () => {
    expect(classColour('Schüler')).toBe(
      'bg-class-schueler-bg text-class-schueler-ink',
    );
  });

  it('colours T-Ball orange', () => {
    expect(classColour('T-Ball')).toBe(
      'bg-class-tball-bg text-class-tball-ink',
    );
  });

  it('colours Jugend blue', () => {
    expect(classColour('Jugend')).toBe(
      'bg-class-jugend-bg text-class-jugend-ink',
    );
  });

  it('gives unknown classes the neutral tag', () => {
    expect(classColour('Erwachsene')).toBe(neutralClassColour);
    expect(neutralClassColour).toBe('bg-base-300 text-muted-2');
  });
});
