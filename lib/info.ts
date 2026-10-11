import type { Faq } from '../app/types';

export type InfoTile = {
  id: number;
  title: string;
  value: string;
  detail: string | null;
};
export type InfoLink = { id: number; url: string; label: string };

/** FAQ rows ordered by sort (nulls last), then question (German collation). */
export function sortFaqs(faqs: Faq[]): Faq[] {
  return [...faqs].sort(
    (a, b) =>
      (a.sort ?? Infinity) - (b.sort ?? Infinity) ||
      a.question.localeCompare(b.question, 'de'),
  );
}

/** Rows with a tile_title, in FAQ order. */
export function infoTiles(faqs: Faq[]): InfoTile[] {
  return sortFaqs(faqs).flatMap((f) =>
    f.tile_title && f.tile_value
      ? [
          {
            id: f.id,
            title: f.tile_title,
            value: f.tile_value,
            detail: f.tile_detail,
          },
        ]
      : [],
  );
}

/** Rows with a link, in FAQ order. */
export function infoLinks(faqs: Faq[]): InfoLink[] {
  return sortFaqs(faqs).flatMap((f) =>
    f.link_url && f.link_label
      ? [{ id: f.id, url: f.link_url, label: f.link_label }]
      : [],
  );
}
