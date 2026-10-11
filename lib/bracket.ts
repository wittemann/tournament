/**
 * Structure of the Finalrunde (docs/specs/playoff-bracket.md), derived from
 * the placement games' refs only (ADR-0006); nothing about team counts is
 * hard-coded.
 *
 *  - Final: `findFinal` (shared with the Tabelle's cut-off line).
 *  - Halves: each side of the final follows its `winner:` refs down to the
 *    games whose sides are group places or seeds. A half is a list of rounds,
 *    earliest first (semifinal layout: one round with one game; quarterfinal
 *    layout: two quarterfinals, then one semifinal).
 *  - "Spiel um Platz 3": the game fed by the `loser:` refs of the two games
 *    that feed the final.
 *  - Losers' block ("Platz 5–8"), quarterfinal layout only: the games whose
 *    refs all are `loser:` refs of a quarterfinal or `winner:`/`loser:` refs
 *    of a game already in the block (e.g. a 5–8 mini bracket).
 *  - Every other placement game goes into a list, ordered by the places it
 *    decides (`slotKey`); games that share a ref (a mini round robin) stay
 *    together.
 *
 * Only the semifinal and quarterfinal layouts are drawn; any other shape
 * (deeper rounds, byes, a final straight from seeds) falls back to the plain
 * list.
 */
import { findFinal, roundName } from './cutOff';
import {
  parseRef,
  placementRanking,
  slotKey,
  type GameLike,
  type PlacementEntry,
  type StandingsContext,
} from './standings';

export interface BracketHalf<G> {
  /**
   * Rounds before the final, earliest first; within a round, the games feeding
   * the next game's home side come before those feeding its away side.
   */
  rounds: G[][];
}

export interface Bracket<G> {
  final: G;
  /** Left half feeds the final's home side, right half its away side. */
  halves: [BracketHalf<G>, BracketHalf<G>];
  thirdPlace: G | null;
  /**
   * Name of each round before the final, earliest first, from its games'
   * labels with the trailing number stripped ("Viertelfinale",
   * "Halbfinale"); null when they lack a label or disagree.
   */
  rounds: (string | null)[];
  /** Games among the losers of the first round (quarterfinal layout only). */
  losers: LosersBlock<G> | null;
}

export interface LosersBlock<G> {
  /** Places the block decides, e.g. 5 and 8 for "Platz 5–8". */
  from: number;
  to: number;
  /** In schedule (number) order, so a mini bracket reads round by round. */
  games: G[];
}

export interface Finalrunde<G> {
  /** null when the placement games don't form a layout we can draw. */
  bracket: Bracket<G> | null;
  /** Placement games outside the bracket (all of them without one), best places first. */
  placementGames: G[];
  /**
   * Final ranking (`placementRanking`) once the final has a result; without a
   * final, once every place is decided. null before.
   */
  ranking: PlacementEntry[] | null;
  /** True when the class has a final (`findFinal`), drawn or not. */
  hasFinal: boolean;
}

const refsOf = (g: GameLike) =>
  [g.home_ref, g.away_ref].filter((r): r is string => !!r);

const hasResult = (g: GameLike) => g.homescore !== null && g.awayscore !== null;

/** Seed shown next to a team in the bracket: "1" for seed:1, "A1" for group:A:1. */
export function seedTag(ref: string | null): string | null {
  const p = ref ? parseRef(ref) : null;
  if (p?.kind === 'seed') return String(p.n);
  if (p?.kind === 'group') return `${p.group}${p.n}`;
  return null;
}

/**
 * `games` must be the array `ctx` was built from (standingsContext keeps the
 * same objects), so the result carries the caller's full game rows.
 */
export function buildFinalrunde<G extends GameLike>(
  games: G[],
  ctx: StandingsContext,
): Finalrunde<G> {
  const placement = games.filter(
    (g) => g.class === ctx.cls && g.stage === 'placement',
  );
  const byNumber = new Map<number, G>();
  for (const g of placement) if (g.number !== null) byNumber.set(g.number, g);

  const finalLike = findFinal(ctx);
  const final = placement.find((g) => g === finalLike) ?? null;
  const bracket = final ? layout(final, byNumber) : null;

  const inBracket = new Set<G>(
    bracket
      ? [
          bracket.final,
          ...bracket.halves.flatMap((h) => h.rounds.flat()),
          ...(bracket.thirdPlace ? [bracket.thirdPlace] : []),
          ...(bracket.losers?.games ?? []),
        ]
      : [],
  );
  const placementGames = sortByPlaces(
    placement.filter((g) => !inBracket.has(g)),
    ctx,
  );

  const all = placementRanking(ctx);
  const finished = final
    ? hasResult(final)
    : all.length > 0 && all.every((e) => e.team !== null);
  return {
    bracket,
    placementGames,
    ranking: finished ? all : null,
    hasFinal: final !== null,
  };
}

/** The semifinal or quarterfinal layout, or null for any other shape. */
function layout<G extends GameLike>(
  final: G,
  byNumber: Map<number, G>,
): Bracket<G> | null {
  if (!final.home_ref || !final.away_ref) return null;
  const left = half(final.home_ref, byNumber, new Set([final]));
  const right = half(final.away_ref, byNumber, new Set([final]));
  if (!left || !right) return null;
  const depth = left.rounds.length;
  if (depth > 2 || right.rounds.length !== depth) return null;

  const feeders = [left, right].map((h) => h.rounds[h.rounds.length - 1][0]);
  if (feeders[0] === feeders[1] || feeders.some((g) => g.number === null))
    return null;
  const feederLosers = new Set(feeders.map((g) => `loser:${g.number}`));
  const thirdPlace =
    [...byNumber.values()].find((g) => {
      const refs = refsOf(g);
      return (
        refs.length === 2 &&
        refs[0] !== refs[1] &&
        refs.every((r) => feederLosers.has(r))
      );
    }) ?? null;
  const rounds = left.rounds.map((round, i) => {
    const names = new Set(
      [...round, ...right.rounds[i]].map((g) => roundName(g.label)),
    );
    return names.size === 1 ? [...names][0] : null;
  });
  const first = [...left.rounds[0], ...right.rounds[0]];
  const losers =
    depth === 2 ? losersBlock(first, 2 * feeders.length, byNumber) : null;
  return { final, halves: [left, right], thirdPlace, rounds, losers };
}

/**
 * The games the first round's losers play among themselves: every ref is a
 * `loser:` ref of a first-round game, or a `winner:`/`loser:` ref of a game
 * already in the block. They decide the places after the teams that reached
 * the second round (`reached`): 5–8 behind four semifinalists.
 */
function losersBlock<G extends GameLike>(
  first: G[],
  reached: number,
  byNumber: Map<number, G>,
): LosersBlock<G> | null {
  const firstNumbers = new Set(first.map((g) => g.number));
  const block = new Set<G>();
  const fits = (ref: string) => {
    const p = parseRef(ref);
    if (p?.kind !== 'winner' && p?.kind !== 'loser') return false;
    const source = byNumber.get(p.number);
    return (
      (p.kind === 'loser' && firstNumbers.has(p.number)) ||
      (!!source && block.has(source))
    );
  };
  let changed = true;
  while (changed) {
    changed = false;
    for (const g of byNumber.values()) {
      const refs = refsOf(g);
      if (
        block.has(g) ||
        refs.length !== 2 ||
        refs[0] === refs[1] ||
        !refs.every(fits)
      )
        continue;
      block.add(g);
      changed = true;
    }
  }
  if (block.size === 0) return null;
  return {
    from: reached + 1,
    to: 2 * first.length,
    games: [...block].sort((a, b) => (a.number ?? 0) - (b.number ?? 0)),
  };
}

/**
 * The rounds behind one side of the final: a complete tree of `winner:` refs
 * ending in seed/group refs at the same depth. null for byes, `loser:` refs,
 * unknown games or cycles.
 */
function half<G extends GameLike>(
  ref: string,
  byNumber: Map<number, G>,
  seen: Set<G>,
): BracketHalf<G> | null {
  const p = parseRef(ref);
  if (p?.kind !== 'winner') return null;
  const game = byNumber.get(p.number);
  if (!game || seen.has(game) || !game.home_ref || !game.away_ref) return null;
  const kinds = [game.home_ref, game.away_ref].map((r) => parseRef(r)?.kind);
  if (kinds.every((k) => k === 'seed' || k === 'group'))
    return { rounds: [[game]] };
  const next = new Set(seen).add(game);
  const a = half(game.home_ref, byNumber, next);
  const b = half(game.away_ref, byNumber, next);
  if (!a || !b || a.rounds.length !== b.rounds.length) return null;
  // Home side's games first, so each round lines up with the next game's sides.
  const rounds = a.rounds.map((round, i) => [...round, ...b.rounds[i]]);
  return { rounds: [...rounds, [game]] };
}

/**
 * Best places first: a game's key is its best slot (`slotKey`), shared by
 * all games linked through a common ref (a mini round robin), then number.
 */
function sortByPlaces<G extends GameLike>(
  list: G[],
  ctx: StandingsContext,
): G[] {
  const key = new Map<G, number>(
    list.map((g) => [
      g,
      Math.min(...refsOf(g).map((r) => slotKey(r, ctx, new Set()))),
    ]),
  );
  // Spread the smallest key over games that share a ref, until stable.
  let changed = true;
  while (changed) {
    changed = false;
    for (const a of list)
      for (const b of list) {
        if (a === b || key.get(b)! <= key.get(a)!) continue;
        if (refsOf(a).some((r) => refsOf(b).includes(r))) {
          key.set(b, key.get(a)!);
          changed = true;
        }
      }
  }
  return [...list].sort(
    (a, b) => key.get(a)! - key.get(b)! || (a.number ?? 0) - (b.number ?? 0),
  );
}
