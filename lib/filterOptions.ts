import { sortClasses } from '@/lib/classOrder';

export interface FilterOption {
  value: string;
  label: string;
  /** Full spoken name when the visible label is shortened. */
  ariaLabel?: string;
  /** Short label (hall number): rendered in the condensed font. */
  compact?: boolean;
}

interface FilterGame {
  class: string;
  location: string;
  eventname: string | null;
}

/** Class options for the real games: CLASS_ORDER first, unknown ones appended. */
export function classOptions(games: readonly FilterGame[]): FilterOption[] {
  const present = new Set(
    games.filter((g) => !g.eventname).map((g) => g.class),
  );
  // Unknown classes are appended alphabetically (stable sort keeps that order).
  return sortClasses([...present].sort()).map((c) => ({ value: c, label: c }));
}

/**
 * Hall options: only halls with at least one real game (event-only rooms such
 * as the dining room are left out), natural order. "Halle 3" becomes the
 * compact label "3"; other names keep their full text.
 */
export function hallOptions(games: readonly FilterGame[]): FilterOption[] {
  const halls = new Set(
    games.filter((g) => !g.eventname && g.location).map((g) => g.location),
  );
  return [...halls]
    .sort((a, b) => a.localeCompare(b, 'de', { numeric: true }))
    .map((hall) => {
      const short = hall.replace(/^Halle\s+/, '');
      return short !== hall
        ? { value: hall, label: short, ariaLabel: hall, compact: true }
        : { value: hall, label: hall };
    });
}
