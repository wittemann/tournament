import { describe, expect, it } from 'vitest';
import { classColour } from '@/lib/classColours';

describe('classColour', () => {
  it('colours Schüler green', () => {
    expect(classColour('Schüler')).toBe('bg-green-100');
  });

  it('colours T-Ball amber', () => {
    expect(classColour('T-Ball')).toBe('bg-amber-100');
  });

  it('colours Jugend blue', () => {
    expect(classColour('Jugend')).toBe('bg-blue-100');
  });

  it('leaves unknown classes neutral', () => {
    expect(classColour('Erwachsene')).toBe('');
  });
});
