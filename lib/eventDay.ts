/**
 * The event day gate for live status ("läuft", the "Jetzt" line). The date
 * lives in the `event` table (supabase/migrations/20261115060151_event_date.sql),
 * not in the code.
 */

/** The device's local date as "YYYY-MM-DD". */
export function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

/**
 * True when `today` ("YYYY-MM-DD", local) is the event day. Without an event
 * date (no row, not loaded yet) every day counts, so a forgotten date never
 * hides the live state on the day itself.
 */
export function isEventDay(
  eventDate: string | null | undefined,
  today: string,
): boolean {
  return !eventDate || eventDate === today;
}

export type EventPhase = 'before' | 'day' | 'after';

/**
 * Where `today` ("YYYY-MM-DD") lies relative to the event day. Without an
 * event date every day is the event day.
 */
export function eventPhase(
  eventDate: string | null | undefined,
  today: string,
): EventPhase {
  if (!eventDate || eventDate === today) return 'day';
  return today < eventDate ? 'before' : 'after';
}

export interface LiveTimes {
  /**
   * "HH:MM" on the event day, else null: the "Jetzt" line, "läuft" and
   * "in N Min." stay off (GameCard, slotStatus, bracket).
   */
  live: string | null;
  /**
   * Time for the "Mein Team" card (getTeamOutlook): the live time on the
   * event day, "00:00" before it (first game next, nothing running), "23:59"
   * after it (all done). Null while the event date loads.
   */
  outlook: string | null;
}

/**
 * Both times from the device clock and the `event` rows. Null until the clock
 * is mounted and the rows have loaded (no flicker on other days). A failed
 * fetch ends loading with no rows and counts as the event day, like a missing
 * row.
 */
export function liveNowFor(
  clock: { time: string; date: string } | null,
  rows: { date: string }[],
  loading: boolean,
): LiveTimes {
  if (!clock || loading) return { live: null, outlook: null };
  switch (eventPhase(rows[0]?.date, clock.date)) {
    case 'day':
      return { live: clock.time, outlook: clock.time };
    case 'before':
      return { live: null, outlook: '00:00' };
    case 'after':
      return { live: null, outlook: '23:59' };
  }
}
