import type { GameClass } from '@/lib/standings';

/**
 * Display order of the classes everywhere (Spielplan, Tabelle, Finalrunde):
 * T-Ball first, not the schema's enum order. Classes missing here are not
 * dropped; they are appended after these in their existing order.
 */
export const CLASS_ORDER: readonly GameClass[] = [
  'T-Ball',
  'Schüler',
  'Jugend',
];

/** Position in CLASS_ORDER; unknown classes come after all known ones. */
export function classRank(cls: string): number {
  const index = (CLASS_ORDER as readonly string[]).indexOf(cls);
  return index === -1 ? CLASS_ORDER.length : index;
}

/** Sorts classes into CLASS_ORDER. Stable, so unknown classes keep their order at the end. */
export function sortClasses<T extends string>(classes: readonly T[]): T[] {
  return [...classes].sort((a, b) => classRank(a) - classRank(b));
}
