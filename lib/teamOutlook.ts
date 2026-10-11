/**
 * The selected team's view of the schedule: the "Mein Team" card
 * (docs/specs/next-game-card.md) and the team's own game list.
 *
 * A team is selected by name only, so a name used in several classes
 * ("Stuttgart 1" in Schüler and T-Ball) covers that name's games in every
 * class. Scorer duties match the name exactly: the 2025 club-prefix rule
 * ("Bretten" → "Bretten 1/2") is gone, since "Bretten" is a real T-Ball team
 * in the 2026 schema and would otherwise hand its duties to the Schüler teams.
 */
import {
  type RunningCandidate,
  SOON_WINDOW_MINUTES,
  isRunning,
  toMinutes,
} from './gameStatus';
import type { GameSides } from './schedule';
import {
  type GameClass,
  type GameLike,
  type TeamLike,
  groupTables,
  placementRanking,
  resolveGame,
  standingsContext,
} from './standings';

export type OutlookGame = RunningCandidate & {
  id: number;
  class: GameClass;
  hometeam: string | null;
  awayteam: string | null;
  scorer: string | null;
  /** Class of the scoring team; null means the game's own class. */
  scorer_class: GameClass | null;
};

/** True when the team plays in the game (placement sides once resolved). */
export function playsIn(
  game: OutlookGame,
  sides: GameSides | undefined,
  team: string,
): boolean {
  if (game.eventname) return false;
  const home = sides ? sides.home.team : game.hometeam;
  const away = sides ? sides.away.team : game.awayteam;
  return home === team || away === team;
}

/** True when the team is the game's scorer (exact name, see above). */
export function scoresIn(game: OutlookGame, team: string): boolean {
  return !game.eventname && game.scorer === team;
}

function hasResult(game: RunningCandidate): boolean {
  return game.homescore != null || game.awayscore != null;
}

export interface TeamOutlook<G extends OutlookGame> {
  /** The team's running game ("läuft"). */
  current: G | null;
  /** First game without result that starts after now. */
  next: G | null;
  /**
   * The running scorer duty (isRunning), else the next one after now, only
   * when the card should show it: it is the
   * team's next appointment (before `next`, or no next game) or starts within
   * SOON_WINDOW_MINUTES.
   */
  scorerDuty: G | null;
  /** No running game, no next game and no scorer duty left. */
  done: boolean;
  /** The team has games and none has started yet ("Erstes Spiel"). */
  beforeFirst: boolean;
}

/**
 * The card's state for `team` at `now` ("HH:MM"). `games` must be sorted by
 * time. Events are ignored.
 *
 * - current: isRunning (started ≤ RUNNING_WINDOW_MINUTES ago, no result).
 * - next: starts strictly after now (a game starting this minute already
 *   runs) and has no result. A game without result that started more than
 *   the running window ago is neither current nor next.
 * - Before the first game (`beforeFirst`), `next` is simply the first game.
 */
export function getTeamOutlook<G extends OutlookGame>(
  games: G[],
  sides: Map<number, GameSides>,
  team: string,
  now: string,
): TeamOutlook<G> {
  const nowMin = toMinutes(now);
  const upcoming = (g: G) => !hasResult(g) && toMinutes(g.time) > nowMin;

  const own = games.filter((g) => playsIn(g, sides.get(g.id), team));
  const current = own.find((g) => isRunning(g, now)) ?? null;
  const next = own.find(upcoming) ?? null;
  // Same rule as the team's games: a running duty first, else the next one.
  const duty =
    games.find(
      (g) => scoresIn(g, team) && (isRunning(g, now) || upcoming(g)),
    ) ?? null;

  const dutyStart = duty ? toMinutes(duty.time) : 0;
  const showDuty =
    duty !== null &&
    (next === null ||
      dutyStart < toMinutes(next.time) ||
      dutyStart - nowMin <= SOON_WINDOW_MINUTES);

  return {
    current,
    next,
    scorerDuty: showDuty ? duty : null,
    done: !current && !next && !duty,
    // Every game of the team starts after now and has no result.
    beforeFirst: own.length > 0 && own.every(upcoming),
  };
}

export type TeamEntry<G> =
  | { kind: 'game'; game: G }
  | { kind: 'scorer'; game: G }
  | { kind: 'event'; game: G };

/**
 * The team's list in schedule order: its games, its scorer duties and the
 * events (Siegerehrung, …) of the classes it plays or scores in. `games`
 * must be sorted by time.
 */
export function teamSchedule<G extends OutlookGame>(
  games: G[],
  sides: Map<number, GameSides>,
  team: string,
): TeamEntry<G>[] {
  const kindOf = (game: G): TeamEntry<G>['kind'] | null =>
    playsIn(game, sides.get(game.id), team)
      ? 'game'
      : scoresIn(game, team)
        ? 'scorer'
        : null;
  // Classes the team belongs to: a game's own class, or the scorer's class
  // for a duty (T-Ball "Bretten" scores Schüler games).
  const classes = new Set<GameClass>();
  for (const game of games) {
    const kind = kindOf(game);
    if (kind === 'game') classes.add(game.class);
    if (kind === 'scorer') classes.add(game.scorer_class ?? game.class);
  }
  const entries: TeamEntry<G>[] = [];
  for (const game of games) {
    const kind = game.eventname
      ? classes.has(game.class)
        ? 'event'
        : null
      : kindOf(game);
    if (kind) entries.push({ kind, game });
  }
  return entries;
}

export interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
}

/**
 * Win/loss/tie record from the computed group tables (group stage only, like
 * the Tabelle; placement games don't count). Summed over every class in which
 * a team of that name has a group row, or only over `cls` when given.
 */
export function teamRecord(
  games: GameLike[],
  teams: TeamLike[],
  team: string,
  cls?: GameClass,
): TeamRecord {
  const record = { wins: 0, losses: 0, ties: 0 };
  const classes = new Set(
    teams
      .filter((t) => t.name === team && (!cls || t.class === cls))
      .map((t) => t.class),
  );
  for (const cls of classes) {
    for (const table of groupTables(games, teams, cls)) {
      for (const row of table.rows) {
        if (row.team !== team) continue;
        record.wins += row.wins;
        record.losses += row.losses;
        record.ties += row.ties;
      }
    }
  }
  return record;
}

/** "1 S · 1 N", plus " · 1 U" when there are ties. */
export function formatRecord({ wins, losses, ties }: TeamRecord): string {
  const parts = [`${wins} S`, `${losses} N`];
  if (ties > 0) parts.push(`${ties} U`);
  return parts.join(' · ');
}

/**
 * True when a class of the team still has a placement game with an unresolved
 * side (e.g. group A is done, group B is not, so seed refs wait). The team
 * may get a placement game then, so the card must not say "all played"
 * even when it has no game or duty left right now. A class where the team
 * already has its final place doesn't count (open semifinals don't concern
 * the team that played for 9th place).
 */
export function awaitsPlacement(
  games: GameLike[],
  teams: TeamLike[],
  team: string,
): boolean {
  const classes = new Set(
    teams.filter((t) => t.name === team).map((t) => t.class),
  );
  for (const cls of classes) {
    const ctx = standingsContext(games, teams, cls);
    if (placementRanking(ctx).some((e) => e.team === team)) continue;
    for (const g of ctx.games) {
      if (g.stage !== 'placement') continue;
      const { home, away } = resolveGame(g, ctx);
      if (home === null || away === null) return true;
    }
  }
  return false;
}

export interface TeamSummary {
  cls: GameClass;
  /** Group and placement games with a result (not the heading record). */
  record: TeamRecord;
  /** Run difference over the same games. */
  diff: number;
  /**
   * The team's place: the overall place from the placement games when they
   * decide it ('final'), else its place in the group table ('group'). null
   * when the team has no group row.
   */
  place: { value: number; kind: 'final' | 'group' } | null;
}

/**
 * Per class in which a team of that name has a group row (a name used in
 * several classes gets one summary per class, in the order of `teams`).
 * Record and difference count every played game of the team in the class,
 * group and placement (results only), unlike `teamRecord`, which follows the
 * Tabelle; the final place comes from placementRanking, falling back
 * to the group place when no placement game decides it (no placement games,
 * not played yet, or a place no game decides).
 */
export function teamSummaries(
  games: GameLike[],
  teams: TeamLike[],
  team: string,
): TeamSummary[] {
  const classes: GameClass[] = [];
  for (const t of teams) {
    if (t.name === team && !classes.includes(t.class)) classes.push(t.class);
  }
  const summaries: TeamSummary[] = [];
  for (const cls of classes) {
    const ctx = standingsContext(games, teams, cls);
    let row = null;
    for (const table of ctx.tables) {
      row = table.rows.find((r) => r.team === team) ?? row;
    }
    if (!row) continue;
    const record = { wins: 0, losses: 0, ties: 0 };
    let diff = 0;
    for (const g of ctx.games) {
      if (g.homescore == null || g.awayscore == null) continue;
      const { home, away } = resolveGame(g, ctx);
      const mine = home === team ? 'home' : away === team ? 'away' : null;
      if (!mine) continue;
      const own = mine === 'home' ? g.homescore : g.awayscore;
      const other = mine === 'home' ? g.awayscore : g.homescore;
      diff += own - other;
      if (own > other) record.wins++;
      else if (own < other) record.losses++;
      else record.ties++;
    }
    const final = placementRanking(ctx).find((e) => e.team === team);
    summaries.push({
      cls,
      record,
      diff,
      place: final
        ? { value: final.place, kind: 'final' }
        : { value: row.place, kind: 'group' },
    });
  }
  return summaries;
}

/** "2–3", plus "–1" when there are ties (design: Bilanz tile). */
export function formatBilanz({ wins, losses, ties }: TeamRecord): string {
  return ties > 0 ? `${wins}–${losses}–${ties}` : `${wins}–${losses}`;
}

/** "+5", "−19" (real minus sign), "0". */
export function formatDiff(diff: number): string {
  return diff > 0 ? `+${diff}` : diff < 0 ? `\u2212${-diff}` : '0';
}
