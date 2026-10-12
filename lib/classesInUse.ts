import { sortClasses } from '@/lib/classOrder';
import type { GameClass } from '@/lib/standings';

/** Classes that have at least one team or game, in CLASS_ORDER. */
export function classesInUse(
  games: readonly { class: GameClass }[],
  teams: readonly { class: GameClass }[],
): GameClass[] {
  const present = new Set<GameClass>([
    ...teams.map((t) => t.class),
    ...games.map((g) => g.class),
  ]);
  return sortClasses([...present]);
}
