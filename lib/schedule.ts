/**
 * Schedule display helpers for placement games (ADR-0006): German labels for
 * placeholder refs and the resolved team per game side.
 */
import {
  type GameClass,
  type GameLike,
  type TeamLike,
  parseRef,
  resolveGame,
  standingsContext,
} from './standings';

/**
 * Short German label for a placeholder ref, shown while it is unresolved and
 * as a small hint next to the resolved team.
 *
 *   seed:1      → "Seed 1"
 *   group:A:5   → "5. Gruppe A"
 *   winner:44   → "Sieger Spiel 44"
 *   loser:45    → "Verlierer Spiel 45"
 *
 * winner:/loser: always use the referenced game's `games.number`, never its
 * label ("Sieger HF 2"): predictable, needs no lookup, and works for any
 * bracket shape. Invalid refs are returned unchanged so data errors stay
 * visible instead of rendering blank.
 */
export function refLabel(ref: string): string {
  const p = parseRef(ref);
  if (!p) return ref;
  switch (p.kind) {
    case 'seed':
      return `Seed ${p.n}`;
    case 'group':
      return `${p.n}. Gruppe ${p.group}`;
    case 'winner':
      return `Sieger Spiel ${p.number}`;
    case 'loser':
      return `Verlierer Spiel ${p.number}`;
  }
}

export interface Side {
  /** Stored team (group games) or resolved team (placement games), if known. */
  team: string | null;
  /** Placeholder label of a placement game side, null for group games. */
  ref: string | null;
}

export interface GameSides {
  home: Side;
  away: Side;
}

type ScheduleGame = GameLike & { id: number };

/**
 * Both sides of every game, keyed by game id. Placement games are resolved
 * per class through the standings context; other games keep their stored
 * team names.
 */
export function gameSides(
  games: ScheduleGame[],
  teams: TeamLike[],
): Map<number, GameSides> {
  const contexts = new Map<GameClass, ReturnType<typeof standingsContext>>();
  const result = new Map<number, GameSides>();
  for (const game of games) {
    if (game.stage !== 'placement') {
      result.set(game.id, {
        home: { team: game.hometeam, ref: null },
        away: { team: game.awayteam, ref: null },
      });
      continue;
    }
    let ctx = contexts.get(game.class);
    if (!ctx) {
      ctx = standingsContext(games, teams, game.class);
      contexts.set(game.class, ctx);
    }
    const { home, away } = resolveGame(game, ctx);
    result.set(game.id, {
      home: {
        team: home ?? game.hometeam,
        ref: game.home_ref ? refLabel(game.home_ref) : null,
      },
      away: {
        team: away ?? game.awayteam,
        ref: game.away_ref ? refLabel(game.away_ref) : null,
      },
    });
  }
  return result;
}

type PlayingGame = Pick<GameLike, 'class' | 'hometeam' | 'awayteam'> & {
  scorer: string | null;
  scorer_class: GameClass | null;
};

/**
 * Names for the team filter: teams from the `teams` table that appear in at
 * least one game (as home, away or scorer), sorted, one entry per name. A name
 * used in several classes ("Stuttgart 1") appears once; the filter then shows
 * the team's games of every class. Teams without any game (registered, not
 * scheduled yet) are left out, as they would only give an empty list.
 */
export function playingTeamNames(
  teams: TeamLike[],
  games: PlayingGame[],
): string[] {
  const used = new Set<string>();
  for (const game of games) {
    if (game.hometeam) used.add(`${game.class}|${game.hometeam}`);
    if (game.awayteam) used.add(`${game.class}|${game.awayteam}`);
    if (game.scorer)
      used.add(`${game.scorer_class ?? game.class}|${game.scorer}`);
  }
  const names = new Set<string>();
  for (const t of teams) {
    if (used.has(`${t.class}|${t.name}`)) names.add(t.name);
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'de'));
}
