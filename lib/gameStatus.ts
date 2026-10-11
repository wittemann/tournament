/**
 * Live status of a game from its clock time. Shared by the "läuft" marking in
 * the game list and the "Mein Team" card (docs/specs/next-game-card.md).
 */

/**
 * A game counts as running for this many minutes after its start, as long as
 * no result is entered. 2025 games were in 30-minute slots.
 */
export const RUNNING_WINDOW_MINUTES = 30;

/**
 * A start this many minutes ahead or less gets the relative "in N Min." hint
 * (docs/specs/next-game-card.md); further ahead it is hidden.
 */
export const SOON_WINDOW_MINUTES = 60;

/** Minutes since midnight for "HH:MM" or "HH:MM:SS". Seconds are ignored. */
export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
}

export interface RunningCandidate {
  /** Start time, "HH:MM:SS" (games table) or "HH:MM". */
  time: string;
  homescore: number | null;
  awayscore: number | null;
  /** Set for event rows such as "Siegerehrung"; these never run. */
  eventname: string | null;
}

/**
 * True when the game has started, has no result yet and started at most
 * RUNNING_WINDOW_MINUTES ago. `now` is "HH:MM" (see lib/useNow.ts).
 *
 * Decisions:
 * - The window is inclusive: a game that started exactly 30 minutes ago is
 *   still running; at 31 minutes it is not.
 * - "No result" means neither score is entered. A game with only one score
 *   already has a result being entered, so it is not running.
 * - Start and now are compared at minute precision; seconds in `time` are
 *   dropped.
 * - Times are same-day clock times, no midnight wrap (the app runs on the
 *   event day only).
 */
export function isRunning(game: RunningCandidate, now: string): boolean {
  if (game.eventname) return false;
  if (game.homescore != null || game.awayscore != null) return false;
  const elapsed = toMinutes(now) - toMinutes(game.time);
  return elapsed >= 0 && elapsed <= RUNNING_WINDOW_MINUTES;
}

export type GamePhase = 'upcoming' | 'running' | 'played';

export interface GameState {
  phase: GamePhase;
  /** Side with the higher score; null unless both scores are in and differ. */
  winner: 'home' | 'away' | null;
}

/**
 * Display state of a game card. `now` is "HH:MM" or null before mount (then
 * nothing counts as running).
 *
 * - played: a result is entered (at least one score, matching isRunning).
 * - running: isRunning() at `now`.
 * - upcoming: everything else, also a past game whose result is still missing
 *   after the running window.
 */
export function gameState(
  game: RunningCandidate,
  now: string | null,
): GameState {
  const { homescore: home, awayscore: away } = game;
  if (home != null || away != null) {
    const winner =
      home == null || away == null || home === away
        ? null
        : home > away
          ? 'home'
          : 'away';
    return { phase: 'played', winner };
  }
  if (now && isRunning(game, now)) return { phase: 'running', winner: null };
  return { phase: 'upcoming', winner: null };
}
