/**
 * Where the Tabelle draws its dashed cut-off line: under the last group place
 * that reaches the top bracket (semifinals, or quarterfinals with 8 teams).
 * Derived from the placement games' refs (ADR-0006), nothing hard-coded.
 *
 * Rule:
 *  1. The "final" is the placement game that no `winner:` ref points at, is
 *     not part of a mini round robin (no ref shared with another placement
 *     game) and has the best slot (see `slotKey`): the game whose winner is
 *     1st. The 3rd-place game ranks behind it (its refs are `loser:`).
 *  2. The top bracket is everything reachable from the final through
 *     `winner:` refs. Its leaf refs (`seed:n`, `group:G:n`) are the places
 *     that qualify.
 *     The round name is the label of the leaf games ("Halbfinale 1" →
 *     "Halbfinale"); with byes (leaves at different depths) there is none.
 *  3. `group:G:n` qualifies places 1..n of group G directly. `seed:n` is
 *     mapped back to group places: seeding sorts by group place first, so
 *     place 1 of every group takes the first seeds, then place 2, and so on.
 *     A place is certain when all its teams across the groups are within the
 *     qualifying seeds. A place that is only partly within (e.g. the best 2nd
 *     of three groups) is not known per group, so no line is drawn for it;
 *     it is reported in `extra` for the legend instead.
 * No placement games, or no such bracket: null (no line). A group gets a
 * line only if teams remain below it.
 */
import {
  parseRef,
  slotKey,
  type GameLike,
  type StandingsContext,
} from '@/lib/standings';

export interface CutOff {
  /** Bracket round the places lead to, e.g. "Halbfinale"; null without a label. */
  round: string | null;
  /** Per group letter: the line is drawn under this place (>= 1). */
  afterPlace: Record<string, number>;
  /** Places only partly qualified through seeds: `count` teams of this place. */
  extra: { place: number; count: number } | null;
}

const roundName = (label: string | null) =>
  label?.replace(/\s*\d+$/, '').trim() || null;

/** Largest m such that 1..m are all in `values`. */
function contiguousFromOne(values: number[]): number {
  const s = new Set(values);
  let m = 0;
  while (s.has(m + 1)) m++;
  return m;
}

export function cutOff(ctx: StandingsContext): CutOff | null {
  const placement = ctx.games.filter((g) => g.stage === 'placement');
  const refsOf = (g: GameLike) =>
    [g.home_ref, g.away_ref].filter((r): r is string => !!r);

  const winnerTargets = new Set<number>();
  for (const g of placement)
    for (const r of refsOf(g)) {
      const p = parseRef(r);
      if (p?.kind === 'winner') winnerTargets.add(p.number);
    }
  const sharesRef = (g: GameLike) =>
    placement.some(
      (o) => o !== g && refsOf(o).some((r) => refsOf(g).includes(r)),
    );

  const candidates = placement
    .filter(
      (g) =>
        (g.number === null || !winnerTargets.has(g.number)) && !sharesRef(g),
    )
    .map((g) => ({
      g,
      key: Math.min(...refsOf(g).map((r) => slotKey(r, ctx, new Set()))),
    }))
    .filter((c) => c.key !== Infinity)
    .sort((a, b) => a.key - b.key || (a.g.number ?? 0) - (b.g.number ?? 0));
  if (candidates.length === 0) return null;

  // Walk down the winner: refs, collecting leaf refs and the deepest round.
  const leaves: string[] = [];
  const leafDepths = new Set<number>();
  let deepestDepth = -1;
  let deepestLabel: string | null = null;
  const walk = (g: GameLike, depth: number, seen: Set<number>) => {
    let hasLeaf = false;
    for (const r of refsOf(g)) {
      const p = parseRef(r);
      if (p?.kind === 'winner') {
        const child = ctx.byNumber.get(p.number);
        if (child?.stage === 'placement' && !seen.has(p.number))
          walk(child, depth + 1, new Set(seen).add(p.number));
      } else if (p?.kind === 'seed' || p?.kind === 'group') {
        leaves.push(r);
        hasLeaf = true;
      }
    }
    if (hasLeaf) leafDepths.add(depth);
    if (hasLeaf && depth > deepestDepth) {
      deepestDepth = depth;
      deepestLabel = g.label;
    }
  };
  const final = candidates[0].g;
  walk(final, 0, new Set(final.number === null ? [] : [final.number]));
  if (leaves.length === 0) return null;

  const seedNumbers: number[] = [];
  const groupPlaces = new Map<string, number[]>();
  for (const r of leaves) {
    const p = parseRef(r);
    if (p?.kind === 'seed') seedNumbers.push(p.n);
    else if (p?.kind === 'group')
      groupPlaces.set(p.group, [...(groupPlaces.get(p.group) ?? []), p.n]);
  }

  // Seeds → places: teams at a place = groups that are big enough.
  const sizes = ctx.tables.map((t) => t.rows.length);
  const seedCount = contiguousFromOne(seedNumbers);
  const perGroup: Record<string, number> = {};
  let extra: CutOff['extra'] = null;
  let before = 0;
  for (let place = 1; ; place++) {
    const teams = sizes.filter((n) => n >= place).length;
    if (teams === 0) break;
    if (before + teams > seedCount) {
      if (seedCount > before) extra = { place, count: seedCount - before };
      break;
    }
    for (const t of ctx.tables)
      if (t.rows.length >= place) perGroup[t.group] = place;
    before += teams;
  }
  for (const [group, places] of groupPlaces) {
    const m = contiguousFromOne(places);
    if (m > 0) perGroup[group] = Math.max(perGroup[group] ?? 0, m);
  }

  const afterPlace: Record<string, number> = {};
  for (const t of ctx.tables) {
    const k = perGroup[t.group];
    if (k && k < t.rows.length) afterPlace[t.group] = k;
  }
  if (Object.keys(afterPlace).length === 0) return null;
  // Leaves at different depths (byes): no single round name fits.
  const round = leafDepths.size === 1 ? roundName(deepestLabel) : null;
  return { round, afterPlace, extra };
}

/** Legend under a group card: "Platz 1–2 im Halbfinale", or null without a line. */
export function cutOffLegend(co: CutOff | null, group: string): string | null {
  const k = co?.afterPlace[group];
  if (!co || !k) return null;
  const places = k === 1 ? 'Platz 1' : `Platz 1–${k}`;
  const where = co.round ? `im ${co.round}` : 'in der Finalrunde';
  const more = co.extra
    ? co.extra.count === 1
      ? `, dazu der beste ${co.extra.place}. Platz`
      : `, dazu die ${co.extra.count} besten ${co.extra.place}. Plätze`
    : '';
  return `${places} ${where}${more}`;
}
