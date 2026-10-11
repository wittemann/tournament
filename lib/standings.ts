/**
 * Computed standings (ADR-0006): group tables, seeding across groups,
 * resolution of placement refs and the final ranking from placement games.
 *
 * Pure and framework-free: everything is recomputed from the current games
 * array (cheap at ~100 games), so a realtime update just calls it again.
 *
 * Ref grammar (see supabase/migrations/20261011054622_2026_edition.sql):
 *   seed:<n> | group:<G>:<n> | winner:<number> | loser:<number>
 */
import type { Game, Team } from '@/app/types';

/** The game fields standings need; tests can build plain objects. */
export type GameLike = Pick<
  Game,
  | 'class'
  | 'stage'
  | 'number'
  | 'hometeam'
  | 'awayteam'
  | 'homescore'
  | 'awayscore'
  | 'home_ref'
  | 'away_ref'
  | 'label'
>;
export type TeamLike = Pick<Team, 'name' | 'class' | 'group_name'>;
export type GameClass = Game['class'];

export interface TableRow {
  team: string;
  played: number;
  wins: number;
  losses: number;
  ties: number;
  runsFor: number;
  runsAgainst: number;
  diff: number;
  /** (wins + ½ ties) / played; 0 when nothing is played yet. */
  winRate: number;
  /** 1-based position in the table. */
  place: number;
  /**
   * True when this row and the next could not be separated by any rule and
   * their order only comes from the team name fallback.
   */
  tiedWithNext: boolean;
}

export interface GroupTable {
  group: string;
  rows: TableRow[];
  /** Group games of this group with both scores. */
  played: number;
  /** All group games of this group. */
  total: number;
  complete: boolean;
}

export interface Seed {
  seed: number;
  team: string;
  group: string;
  place: number;
  /** Same group place, win rate and run difference as the next seed. */
  tiedWithNext: boolean;
}

export interface StandingsContext {
  cls: GameClass;
  /** Games (not events) of this class. */
  games: GameLike[];
  tables: GroupTable[];
  /** null until every group of the class with games is complete. */
  seeds: Seed[] | null;
  byNumber: Map<number, GameLike>;
}

// --- Group tables ------------------------------------------------------------

interface Stats {
  team: string;
  played: number;
  wins: number;
  losses: number;
  ties: number;
  runsFor: number;
  runsAgainst: number;
}

const hasResult = (
  g: GameLike,
): g is GameLike & { homescore: number; awayscore: number } =>
  g.homescore !== null && g.awayscore !== null;

/** Stats for `names` over the scored games played among exactly those teams. */
function computeStats(names: string[], games: GameLike[]): Map<string, Stats> {
  const set = new Set(names);
  const stats = new Map<string, Stats>(
    names.map((team) => [
      team,
      {
        team,
        played: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        runsFor: 0,
        runsAgainst: 0,
      },
    ]),
  );
  for (const g of games) {
    if (!hasResult(g) || !g.hometeam || !g.awayteam) continue;
    if (!set.has(g.hometeam) || !set.has(g.awayteam)) continue;
    const sides: [string, number, number][] = [
      [g.hometeam, g.homescore, g.awayscore],
      [g.awayteam, g.awayscore, g.homescore],
    ];
    for (const [team, own, other] of sides) {
      const s = stats.get(team)!;
      s.played++;
      s.runsFor += own;
      s.runsAgainst += other;
      if (own > other) s.wins++;
      else if (own < other) s.losses++;
      else s.ties++;
    }
  }
  return stats;
}

/**
 * Compares win rates exactly, without floats: positive when a is better.
 * In half-win points, a's rate is (2w + t) / played, so a/ap vs b/bp is
 * decided by the sign of a·bp − b·ap. A team with 0 played has 0 points;
 * max(played, 1) turns that into 0/1 (rate 0) instead of a zero denominator
 * that would make every comparison with it come out equal.
 */
function rateCmp(a: Stats, b: Stats): number {
  return (
    (2 * a.wins + a.ties) * Math.max(b.played, 1) -
    (2 * b.wins + b.ties) * Math.max(a.played, 1)
  );
}

const diffOf = (s: Stats) => s.runsFor - s.runsAgainst;

/** Sorts by `cmp` (negative = a first) and splits into blocks of equal items. */
function splitBy<T>(items: T[], cmp: (a: T, b: T) => number): T[][] {
  const sorted = [...items].sort(cmp);
  const blocks: T[][] = [];
  for (const item of sorted) {
    const last = blocks[blocks.length - 1];
    if (last && cmp(last[0], item) === 0) last.push(item);
    else blocks.push([item]);
  }
  return blocks;
}

interface Ranked {
  stats: Stats;
  tiedWithNext: boolean;
}

/** True when every pair of teams in `names` has at least one scored game. */
function allPairsPlayed(names: string[], games: GameLike[]): boolean {
  const played = new Set<string>();
  for (const g of games) {
    if (hasResult(g) && g.hometeam && g.awayteam) {
      played.add(`${g.hometeam}\u0000${g.awayteam}`);
      played.add(`${g.awayteam}\u0000${g.hometeam}`);
    }
  }
  return names.every((a, i) =>
    names.slice(i + 1).every((b) => played.has(`${a}\u0000${b}`)),
  );
}

/**
 * Orders a block that is level on win rate and run difference:
 * head-to-head win rate among exactly these teams (re-applied to any smaller
 * level subset), then runs scored, then team name (flagged as unresolved).
 */
function breakTie(block: Stats[], games: GameLike[]): Ranked[] {
  const names = block.map((s) => s.team);
  if (allPairsPlayed(names, games)) {
    const h2h = computeStats(names, games);
    const sub = splitBy(block, (a, b) =>
      rateCmp(h2h.get(b.team)!, h2h.get(a.team)!),
    );
    if (sub.length > 1) {
      return sub.flatMap((b) =>
        b.length === 1
          ? [{ stats: b[0], tiedWithNext: false }]
          : breakTie(b, games),
      );
    }
  }
  return splitBy(block, (a, b) => b.runsFor - a.runsFor).flatMap((b) =>
    [...b]
      .sort((x, y) => x.team.localeCompare(y.team))
      .map((stats, i) => ({ stats, tiedWithNext: i < b.length - 1 })),
  );
}

/**
 * Ranks `names` by the group-table rules of ADR-0006 using only the scored
 * games among those teams. Teams without a played game sort after all teams
 * with results (they would otherwise jump above teams with losses on run
 * difference). Also used for mini round robins in the placement round.
 */
export function rankTeams(names: string[], games: GameLike[]): TableRow[] {
  const stats = [...computeStats(names, games).values()];
  const blocks = splitBy(
    stats,
    (a, b) =>
      Number(b.played > 0) - Number(a.played > 0) ||
      rateCmp(b, a) ||
      diffOf(b) - diffOf(a),
  );
  const ranked = blocks.flatMap((b) =>
    b.length === 1
      ? [{ stats: b[0], tiedWithNext: false }]
      : breakTie(b, games),
  );
  return ranked.map(({ stats: s, tiedWithNext }, i) => ({
    ...s,
    diff: diffOf(s),
    winRate: s.played ? (s.wins + s.ties / 2) / s.played : 0,
    place: i + 1,
    tiedWithNext,
  }));
}

const isGame = (g: GameLike) => g.stage === 'group' || g.stage === 'placement';

/**
 * One table per group of `cls` (sorted by group letter). Group membership is
 * `teams.group_name`; a group game counts for a group when both teams belong
 * to it. Only `stage === 'group'` games with both scores count.
 */
export function groupTables(
  games: GameLike[],
  teams: TeamLike[],
  cls: GameClass,
): GroupTable[] {
  const members = new Map<string, string[]>();
  for (const t of teams) {
    if (t.class !== cls || !t.group_name) continue;
    members.set(t.group_name, [...(members.get(t.group_name) ?? []), t.name]);
  }
  const groupGames = games.filter(
    (g) => g.class === cls && g.stage === 'group',
  );
  return [...members.keys()].sort().map((group) => {
    const names = members.get(group)!;
    const set = new Set(names);
    const own = groupGames.filter(
      (g) =>
        g.hometeam && g.awayteam && set.has(g.hometeam) && set.has(g.awayteam),
    );
    const played = own.filter(hasResult).length;
    return {
      group,
      rows: rankTeams(names, own),
      played,
      total: own.length,
      complete: own.length > 0 && played === own.length,
    };
  });
}

/**
 * Seeds 1…n across all groups: group place, then win rate, then run
 * difference; still level → group letter (flagged). null until every group
 * of the class is complete, or when no group of the class has any games.
 * A group without scheduled games (e.g. a single-team group) doesn't block
 * seeding: it stays `complete: false`, but its teams are seeded with their
 * (name-ordered) group place.
 */
export function seedsFromTables(tables: GroupTable[]): Seed[] | null {
  const scheduled = tables.filter((t) => t.total > 0);
  if (scheduled.length === 0 || scheduled.some((t) => !t.complete)) return null;
  const rows = tables.flatMap((t) =>
    t.rows.map((row) => ({ row, group: t.group })),
  );
  const level = (a: (typeof rows)[number], b: (typeof rows)[number]) =>
    a.row.place - b.row.place ||
    b.row.winRate - a.row.winRate ||
    b.row.diff - a.row.diff;
  rows.sort((a, b) => level(a, b) || a.group.localeCompare(b.group));
  return rows.map(({ row, group }, i) => ({
    seed: i + 1,
    team: row.team,
    group,
    place: row.place,
    tiedWithNext: i < rows.length - 1 && level(rows[i], rows[i + 1]) === 0,
  }));
}

export function seeds(
  games: GameLike[],
  teams: TeamLike[],
  cls: GameClass,
): Seed[] | null {
  return seedsFromTables(groupTables(games, teams, cls));
}

// --- Refs --------------------------------------------------------------------

export function standingsContext(
  games: GameLike[],
  teams: TeamLike[],
  cls: GameClass,
): StandingsContext {
  const own = games.filter((g) => g.class === cls && isGame(g));
  const tables = groupTables(own, teams, cls);
  const byNumber = new Map<number, GameLike>();
  for (const g of own) if (g.number !== null) byNumber.set(g.number, g);
  return { cls, games: own, tables, seeds: seedsFromTables(tables), byNumber };
}

type ParsedRef =
  | { kind: 'seed'; n: number }
  | { kind: 'group'; group: string; n: number }
  | { kind: 'winner' | 'loser'; number: number };

export function parseRef(ref: string): ParsedRef | null {
  let m = /^seed:([1-9]\d*)$/.exec(ref);
  if (m) return { kind: 'seed', n: Number(m[1]) };
  m = /^group:([A-Z]):([1-9]\d*)$/.exec(ref);
  if (m) return { kind: 'group', group: m[1], n: Number(m[2]) };
  m = /^(winner|loser):([1-9]\d*)$/.exec(ref);
  if (m) return { kind: m[1] as 'winner' | 'loser', number: Number(m[2]) };
  return null;
}

/**
 * The team a ref stands for, or null while it is not decided yet (group or
 * group stage unfinished, referenced game unplayed or tied) or when the ref
 * is invalid (bad syntax, unknown game number, cycle).
 *
 * seed: and group: refs also resolve through ties that only the name
 * fallback ordered (`tiedWithNext`): the bracket must not stall on the day.
 * The organizers settle such a tie; the UI can warn via `tiedWithNext`.
 */
export function resolveRef(ref: string, ctx: StandingsContext): string | null {
  return resolveRefIn(ref, ctx, new Set());
}

function resolveRefIn(
  ref: string,
  ctx: StandingsContext,
  visiting: Set<number>,
): string | null {
  const p = parseRef(ref);
  if (!p) return null;
  switch (p.kind) {
    case 'seed':
      return ctx.seeds?.[p.n - 1]?.team ?? null;
    case 'group': {
      const table = ctx.tables.find((t) => t.group === p.group);
      return table?.complete ? (table.rows[p.n - 1]?.team ?? null) : null;
    }
    default: {
      const game = ctx.byNumber.get(p.number);
      if (!game || visiting.has(p.number) || !hasResult(game)) return null;
      if (game.homescore === game.awayscore) return null;
      const { home, away } = resolveGameIn(
        game,
        ctx,
        new Set(visiting).add(p.number),
      );
      if (!home || !away) return null;
      const homeWon = game.homescore > game.awayscore;
      return homeWon === (p.kind === 'winner') ? home : away;
    }
  }
}

/** The teams of a game: stored names for group games, resolved refs otherwise. */
export function resolveGame(
  game: GameLike,
  ctx: StandingsContext,
): { home: string | null; away: string | null } {
  const visiting = new Set<number>();
  if (game.number !== null) visiting.add(game.number);
  return resolveGameIn(game, ctx, visiting);
}

function resolveGameIn(
  game: GameLike,
  ctx: StandingsContext,
  visiting: Set<number>,
) {
  if (game.stage !== 'placement')
    return { home: game.hometeam, away: game.awayteam };
  return {
    home: game.home_ref ? resolveRefIn(game.home_ref, ctx, visiting) : null,
    away: game.away_ref ? resolveRefIn(game.away_ref, ctx, visiting) : null,
  };
}

// --- Final ranking -----------------------------------------------------------

export interface PlacementEntry {
  place: number;
  /** null until the deciding game (or every game of the round robin) has a result. */
  team: string | null;
  /** Unresolved tie in a round robin (see TableRow.tiedWithNext). */
  tiedWithNext: boolean;
}

/**
 * How good a slot is, lower = better, from the refs alone: seed:n → n,
 * group:G:n → after all n-1 places, winner of a game → its better slot,
 * loser → its worse slot. A semifinal 1 v 4 gives winner 1 / loser 4.
 */
export function slotKey(
  ref: string,
  ctx: StandingsContext,
  visiting: Set<number>,
): number {
  const p = parseRef(ref);
  if (!p) return Infinity;
  if (p.kind === 'seed') return p.n;
  if (p.kind === 'group') return p.n * 1000 + p.group.charCodeAt(0);
  const game = ctx.byNumber.get(p.number);
  if (!game || game.stage !== 'placement' || visiting.has(p.number))
    return Infinity;
  const next = new Set(visiting).add(p.number);
  const keys = [game.home_ref, game.away_ref].map((r) =>
    r ? slotKey(r, ctx, next) : Infinity,
  );
  return p.kind === 'winner' ? Math.min(...keys) : Math.max(...keys);
}

/**
 * Overall places from the placement games (ADR-0006). Terminal placement
 * games (no winner:/loser: ref points at them) decide places; terminal games
 * that share a ref form a mini round robin, ranked like a group table.
 * Units are ordered by their best slot (final before 3rd-place game before
 * 5/6, …) and take consecutive places: 2 per game, one per team in a round
 * robin. Nothing about team counts is hard-coded. Places that no game
 * decides (e.g. 3/4 when there is no 3rd-place game) are absent from the
 * result, so places can have gaps.
 */
export function placementRanking(ctx: StandingsContext): PlacementEntry[] {
  const placement = ctx.games.filter((g) => g.stage === 'placement');
  const referenced = new Set<number>();
  for (const g of placement) {
    for (const r of [g.home_ref, g.away_ref]) {
      const p = r ? parseRef(r) : null;
      if (p && (p.kind === 'winner' || p.kind === 'loser'))
        referenced.add(p.number);
    }
  }
  const terminal = placement.filter(
    (g) => g.number === null || !referenced.has(g.number),
  );

  // Union games that share a ref into units.
  const units: GameLike[][] = [];
  for (const g of terminal) {
    const refs = [g.home_ref, g.away_ref];
    const hits = units.filter((u) =>
      u.some((o) =>
        refs.some((r) => r && (o.home_ref === r || o.away_ref === r)),
      ),
    );
    const merged = [...hits.flat(), g];
    for (const h of hits) units.splice(units.indexOf(h), 1);
    units.push(merged);
  }

  const keyed = units.map((games) => {
    const refs = [...new Set(games.flatMap((g) => [g.home_ref!, g.away_ref!]))];
    const key = Math.min(...refs.map((r) => slotKey(r, ctx, new Set())));
    return { games, refs, key };
  });
  keyed.sort(
    (a, b) =>
      a.key - b.key || (a.games[0].number ?? 0) - (b.games[0].number ?? 0),
  );

  const result: PlacementEntry[] = [];
  for (const { games, refs } of keyed) {
    const start = result.length + 1;
    const teams = refs.map((r) => resolveRef(r, ctx));
    const decided =
      teams.every((t) => t !== null) &&
      games.every((g) => {
        if (!hasResult(g)) return false;
        const { home, away } = resolveGame(g, ctx);
        return home !== null && away !== null;
      });
    if (!decided) {
      refs.forEach((_, i) =>
        result.push({ place: start + i, team: null, tiedWithNext: false }),
      );
      continue;
    }
    // Round robin (or a single game, which ranks the same: winner first).
    const resolved = games.map((g) => {
      const { home, away } = resolveGame(g, ctx);
      return { ...g, hometeam: home, awayteam: away };
    });
    for (const row of rankTeams(teams as string[], resolved)) {
      result.push({
        place: start + row.place - 1,
        team: row.team,
        tiedWithNext: row.tiedWithNext,
      });
    }
  }
  return result;
}

// --- Display helpers -----------------------------------------------------------

/**
 * Win–loss record per row of a group table: "3–1", or "3–1–1" (S–N–U) for
 * every row as soon as one team of the group has a tie, so columns line up.
 * `withTies` tells the header which of the two it is.
 */
export function recordLabels(rows: TableRow[]): {
  withTies: boolean;
  labels: string[];
} {
  const withTies = rows.some((r) => r.ties > 0);
  return {
    withTies,
    labels: rows.map((r) =>
      withTies ? `${r.wins}–${r.losses}–${r.ties}` : `${r.wins}–${r.losses}`,
    ),
  };
}

/**
 * Card heading status of a group: "abgeschlossen" or "8 von 10 Spielen";
 * null while the group has no games at all.
 */
export function groupStatusLabel(
  table: Pick<GroupTable, 'played' | 'total' | 'complete'>,
): string | null {
  if (table.total === 0) return null;
  if (table.complete) return 'abgeschlossen';
  return `${table.played} von ${table.total} ${table.total === 1 ? 'Spiel' : 'Spielen'}`;
}

/** Signed run difference with a real minus sign: "+71", "−33", "0". */
export function formatDiff(diff: number): string {
  if (diff > 0) return `+${diff}`;
  if (diff < 0) return `−${Math.abs(diff)}`;
  return '0';
}
