import {
  SOON_WINDOW_MINUTES,
  isRunning,
  toMinutes,
  type RunningCandidate,
} from '@/lib/gameStatus';

/** Games that share a start time, in schedule order (all-teams view). */
export interface Slot<T> {
  /** Start time as stored, "HH:MM:SS" or "HH:MM". */
  time: string;
  games: T[];
}

/**
 * Groups games into slots by start time. The input is expected in schedule
 * order (sorted by time); consecutive games with the same `time` form one
 * slot. Seconds count, as they are part of the stored value.
 */
export function groupBySlot<T extends { time: string }>(games: T[]): Slot<T>[] {
  const slots: Slot<T>[] = [];
  for (const game of games) {
    const last = slots.at(-1);
    // Minute precision, like the heading: "09:30:00" and "09:30" are one slot.
    if (last && last.time.slice(0, 5) === game.time.slice(0, 5))
      last.games.push(game);
    else slots.push({ time: game.time, games: [game] });
  }
  return slots;
}

export type SlotStatus =
  | { kind: 'running' }
  | { kind: 'finished' }
  | { kind: 'soon'; minutes: number }
  | null;

/**
 * Status shown next to a slot's time. `now` is "HH:MM" or null before mount.
 *
 * - running ("läuft"): some game in the slot isRunning() at `now`.
 * - finished ("beendet"): the slot has real games (not events) and every one
 *   has a result (at least one score, as in gameState "played").
 * - soon ("in N Min."): the slot starts 1 to SOON_WINDOW_MINUTES minutes
 *   after `now`.
 * - null otherwise: further ahead, before mount, an event-only slot that has
 *   started, or a past slot whose results are still missing after the running
 *   window (nothing is claimed rather than a wrong "beendet").
 */
export function slotStatus(
  slot: Slot<RunningCandidate>,
  now: string | null,
): SlotStatus {
  if (now && slot.games.some((game) => isRunning(game, now))) {
    return { kind: 'running' };
  }
  const real = slot.games.filter((game) => !game.eventname);
  if (
    real.length > 0 &&
    real.every((game) => game.homescore != null || game.awayscore != null)
  ) {
    return { kind: 'finished' };
  }
  if (now) {
    const minutes = toMinutes(slot.time) - toMinutes(now);
    if (minutes > 0 && minutes <= SOON_WINDOW_MINUTES) {
      return { kind: 'soon', minutes };
    }
  }
  return null;
}
