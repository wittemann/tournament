'use client';

import Spinner from '../Spinner';
import ConnectionBanner from '../ConnectionBanner';
import { useRealtimeTable } from '@/lib/useRealtimeTable';

type Item = {
  id: number;
  category: string;
  item: string;
  price: number;
  soldOut: boolean;
};

export default function Page() {
  const {
    rows: items,
    loading,
    error,
  } = useRealtimeTable<Item>('items', [
    { column: 'category' },
    { column: 'id' },
  ]);

  // Group items by category
  const itemsByCategory = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, Item[]>,
  );

  const categories = Object.keys(itemsByCategory).sort();

  // Format price to always show 2 decimals
  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',') + '€';
  };

  return (
    <div className="container mx-auto p-4">
      <ConnectionBanner show={error} />

      {categories.map((category) => (
        <div key={category} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{category}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="px-4 py-2 border-b dark:border-gray-600 text-left">
                    Artikel
                  </th>
                  <th className="px-4 py-2 border-b dark:border-gray-600 text-right">
                    Preis
                  </th>
                </tr>
              </thead>
              <tbody>
                {itemsByCategory[category].map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td
                      className={`px-4 py-2 border-b dark:border-gray-600 ${
                        item.soldOut
                          ? 'line-through text-gray-400 dark:text-gray-500'
                          : ''
                      }`}
                    >
                      {item.item}
                      {item.soldOut && (
                        <span className="ml-2 inline-block px-2 py-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 rounded">
                          Ausverkauft
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-2 border-b dark:border-gray-600 text-right ${
                        item.soldOut
                          ? 'line-through text-gray-400 dark:text-gray-500'
                          : ''
                      }`}
                    >
                      {formatPrice(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {loading && <Spinner />}

      {!loading && !error && categories.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">
          Keine Artikel verfügbar.
        </p>
      )}
    </div>
  );
}
