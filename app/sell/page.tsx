'use client';

import { useMemo } from 'react';
import Spinner from '../Spinner';
import StatusCard from '../StatusCard';
import ConnectionBanner from '../ConnectionBanner';
import { Item } from '../types';
import { useRealtimeTable } from '@/lib/useRealtimeTable';
import { formatPrice, menuSections } from '@/lib/menu';

export default function Page() {
  const {
    rows: items,
    loading,
    error,
  } = useRealtimeTable<Item>('items', [{ column: 'id' }]);

  const sections = useMemo(() => menuSections(items), [items]);

  if (loading) return <Spinner />;

  return (
    <>
      <ConnectionBanner show={error} />
      {!error && sections.length === 0 && (
        <StatusCard>Keine Artikel verfügbar.</StatusCard>
      )}
      <div className="space-y-5">
        {sections.map(({ category, items }) => (
          <section key={category} className="space-y-2.5">
            <h2 className="font-display text-[22px] leading-tight font-bold text-muted uppercase">
              {category}
            </h2>
            <ul className="overflow-hidden rounded-card bg-base-100">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center gap-2.5 border-t border-line px-4 py-3 first:border-t-0 ${
                    item.soldOut ? 'bg-base-200' : ''
                  }`}
                >
                  <span
                    className={`flex-1 text-base font-medium ${item.soldOut ? 'text-muted' : ''}`}
                  >
                    {item.item.trim()}
                  </span>
                  {item.soldOut && (
                    <span className="rounded-md bg-loss-bg px-2 py-0.5 text-xs font-bold text-loss-ink">
                      Ausverkauft
                    </span>
                  )}
                  <span
                    className={`font-display text-xl font-bold ${item.soldOut ? 'text-muted line-through' : ''}`}
                  >
                    {formatPrice(item.price)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
