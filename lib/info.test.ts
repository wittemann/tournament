import { describe, expect, it } from 'vitest';
import type { Faq } from '../app/types';
import { infoLinks, infoTiles, sortFaqs } from './info';

const faq = (id: number, extra: Partial<Faq> = {}): Faq => ({
  id,
  question: `Q${id}`,
  answer: 'A',
  sort: id,
  link_url: null,
  link_label: null,
  tile_title: null,
  tile_value: null,
  tile_detail: null,
  ...extra,
});

describe('info', () => {
  it('sorts by sort (nulls last), then question', () => {
    const rows = [
      faq(1, { sort: null, question: 'B' }),
      faq(2, { sort: 2 }),
      faq(3, { sort: null, question: 'A' }),
      faq(4, { sort: 1 }),
    ];
    expect(sortFaqs(rows).map((f) => f.id)).toEqual([4, 2, 3, 1]);
  });

  it('takes tiles from rows with a tile_title', () => {
    const rows = [
      faq(2),
      faq(1, {
        tile_title: 'Ende',
        tile_value: 'ca. 19:15',
        tile_detail: 'Uhr',
      }),
    ];
    expect(infoTiles(rows)).toEqual([
      { id: 1, title: 'Ende', value: 'ca. 19:15', detail: 'Uhr' },
    ]);
  });

  it('takes link buttons from rows with link_url and link_label', () => {
    const rows = [
      faq(1),
      faq(2, { link_url: 'https://x.de/a.pdf', link_label: 'Regeln PDF' }),
    ];
    expect(infoLinks(rows)).toEqual([
      { id: 2, url: 'https://x.de/a.pdf', label: 'Regeln PDF' },
    ]);
  });
});
