import type { Item } from '../app/types';

export type MenuSection = { category: string; items: Item[] };

const euro = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

/** "3,50 €" (the space is a no-break space). */
export function formatPrice(price: number): string {
  return euro.format(price);
}

/**
 * One section per category, categories alphabetical (German collation).
 * Within a section the available items keep their id order and sold-out
 * items follow, also in id order.
 */
export function menuSections(items: Item[]): MenuSection[] {
  const byCategory = new Map<string, Item[]>();
  for (const item of items) {
    const list = byCategory.get(item.category);
    if (list) list.push(item);
    else byCategory.set(item.category, [item]);
  }
  return [...byCategory.keys()]
    .sort((a, b) => a.localeCompare(b, 'de'))
    .map((category) => ({
      category,
      items: byCategory
        .get(category)!
        .sort((a, b) => Number(a.soldOut) - Number(b.soldOut) || a.id - b.id),
    }));
}
