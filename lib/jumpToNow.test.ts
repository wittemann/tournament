import { describe, expect, it } from 'vitest';
import { jumpDirection } from './jumpToNow';

describe('jumpDirection', () => {
  it('is null while the line is in view', () => {
    expect(jumpDirection({ isIntersecting: true, top: 120 })).toBeNull();
  });

  it('points up when the line is above the viewport', () => {
    expect(jumpDirection({ isIntersecting: false, top: -300 })).toBe('up');
  });

  it('points down when the line starts exactly at the top edge but is not intersecting', () => {
    expect(jumpDirection({ isIntersecting: false, top: 0 })).toBe('down');
  });

  it('points down when the line is below the viewport', () => {
    expect(jumpDirection({ isIntersecting: false, top: 1400 })).toBe('down');
  });
});
