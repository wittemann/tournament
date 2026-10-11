import { Constants } from '@/lib/database.types';
import type { GameClass } from '@/lib/standings';

// Stable display order: the enum order of the schema, not alphabetical.
const CLASS_ORDER: readonly GameClass[] = Constants.public.Enums.class;

/** Classes that have at least one team or game, in schema order. */
export function classesInUse(
  games: readonly { class: GameClass }[],
  teams: readonly { class: GameClass }[],
): GameClass[] {
  const present = new Set<GameClass>([
    ...teams.map((t) => t.class),
    ...games.map((g) => g.class),
  ]);
  return CLASS_ORDER.filter((cls) => present.has(cls));
}
