import { describe, expect, it } from 'vitest';
import { classOptions, hallOptions } from '@/lib/filterOptions';

const game = (
  cls: string,
  location: string,
  eventname: string | null = null,
) => ({
  class: cls,
  location,
  eventname,
});

describe('classOptions', () => {
  it('follows the enum order, not the data order', () => {
    const opts = classOptions([
      game('Jugend', 'Halle 1'),
      game('Schüler', 'Halle 1'),
      game('T-Ball', 'Halle 1'),
    ]);
    expect(opts.map((o) => o.value)).toEqual(['Schüler', 'T-Ball', 'Jugend']);
  });

  it('appends unknown classes and skips absent ones', () => {
    const opts = classOptions([
      game('Zebra', 'Halle 1'),
      game('Jugend', 'Halle 1'),
    ]);
    expect(opts.map((o) => o.value)).toEqual(['Jugend', 'Zebra']);
  });

  it('ignores event rows', () => {
    expect(classOptions([game('Schüler', 'Essensraum', 'Konferenz')])).toEqual(
      [],
    );
  });
});

describe('hallOptions', () => {
  it('shortens "Halle N" and sorts naturally', () => {
    const opts = hallOptions([
      game('Schüler', 'Halle 10'),
      game('Schüler', 'Halle 2'),
      game('Schüler', 'Halle 1'),
      game('Jugend', 'Halle 2'),
    ]);
    expect(opts).toEqual([
      { value: 'Halle 1', label: '1', ariaLabel: 'Halle 1', compact: true },
      { value: 'Halle 2', label: '2', ariaLabel: 'Halle 2', compact: true },
      { value: 'Halle 10', label: '10', ariaLabel: 'Halle 10', compact: true },
    ]);
  });

  it('drops halls that only host events', () => {
    const opts = hallOptions([
      game('Schüler', 'Halle 1'),
      game('Schüler', 'Essensraum', 'Konferenz'),
    ]);
    expect(opts.map((o) => o.value)).toEqual(['Halle 1']);
  });

  it('keeps names without the "Halle" prefix in full, not compact', () => {
    const opts = hallOptions([
      game('Schüler', 'Sporthalle Nord'),
      game('Schüler', 'Halle 1'),
    ]);
    expect(opts).toContainEqual({
      value: 'Sporthalle Nord',
      label: 'Sporthalle Nord',
    });
  });
});
