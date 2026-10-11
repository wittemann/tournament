import { describe, expect, it } from 'vitest';
import { formatPrice, menuSections } from './menu';
import type { Item } from '../app/types';

const item = (id: number, category: string, soldOut = false): Item => ({
  id,
  category,
  item: `Item ${id}`,
  price: 1,
  soldOut,
});

describe('formatPrice', () => {
  it('uses German decimals with the euro sign after the amount', () => {
    expect(formatPrice(3.5).replace(/\s/g, ' ')).toBe('3,50 €');
    expect(formatPrice(1).replace(/\s/g, ' ')).toBe('1,00 €');
  });
});

describe('menuSections', () => {
  it('groups by category, alphabetical with umlauts in place', () => {
    const sections = menuSections([
      item(1, 'Merchandise'),
      item(2, 'Getränke'),
      item(3, 'Essen'),
      item(4, 'Getränke'),
    ]);
    expect(sections.map((s) => s.category)).toEqual([
      'Essen',
      'Getränke',
      'Merchandise',
    ]);
    expect(sections[1].items.map((i) => i.id)).toEqual([2, 4]);
  });

  it('moves sold-out items to the bottom, keeping id order', () => {
    const [section] = menuSections([
      item(1, 'Essen', true),
      item(2, 'Essen'),
      item(3, 'Essen', true),
      item(4, 'Essen'),
    ]);
    expect(section.items.map((i) => i.id)).toEqual([2, 4, 1, 3]);
  });

  it('returns nothing for no items', () => {
    expect(menuSections([])).toEqual([]);
  });
});
