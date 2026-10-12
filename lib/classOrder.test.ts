import { describe, expect, it } from 'vitest';
import { CLASS_ORDER, sortClasses } from '@/lib/classOrder';

describe('sortClasses', () => {
  it('orders T-Ball, Schüler, Jugend', () => {
    expect(CLASS_ORDER).toEqual(['T-Ball', 'Schüler', 'Jugend']);
    expect(sortClasses(['Jugend', 'Schüler', 'T-Ball'])).toEqual([
      'T-Ball',
      'Schüler',
      'Jugend',
    ]);
  });

  it('appends unknown classes at the end without dropping them', () => {
    expect(sortClasses(['Zebra', 'Jugend', 'Mini', 'T-Ball'])).toEqual([
      'T-Ball',
      'Jugend',
      'Zebra',
      'Mini',
    ]);
  });
});
