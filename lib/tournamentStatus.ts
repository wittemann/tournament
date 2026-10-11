/**
 * Before/after-the-tournament states of Spielplan, Tabelle and Finalrunde.
 * "Has a result" means both scores are entered (hasResult in lib/standings.ts).
 */
import { hasResult, type GameClass, type GameLike } from './standings';

type Scored = Pick<GameLike, 'homescore' | 'awayscore'>;

/**
 * Start time ("HH:MM:SS" as stored) of the earliest placement game of the
 * class, while none of its placement games has a result. null once one has
 * a result, or when the class has no placement game.
 */
export function finalrundeStart(
  games: (Pick<GameLike, 'class' | 'stage' | 'homescore' | 'awayscore'> & {
    time: string;
  })[],
  cls: GameClass,
): string | null {
  const placement = games.filter(
    (g) => g.class === cls && g.stage === 'placement',
  );
  if (placement.length === 0 || placement.some(hasResult)) return null;
  return placement.map((g) => g.time).reduce((a, b) => (b < a ? b : a));
}

/** True when there are games and every non-event game of any class has a result. */
export function tournamentFinished(
  games: (Scored & { eventname: string | null })[],
): boolean {
  const played = games.filter((g) => !g.eventname);
  return played.length > 0 && played.every(hasResult);
}
