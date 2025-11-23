'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

type Item = {
  id: number;
  category: string;
  item: string;
  price: number;
  soldOut: boolean;
};

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initial fetch
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('items')
        .select()
        .order('category')
        .order('id');
      if (error) {
        console.error('Supabase error:', error);
      } else if (data) {
        setItems(data);
      }
    };

    fetchItems();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('items-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items' },
        async () => {
          // Re-fetch when changes occur
          await fetchItems();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, Item[]>);

  const categories = Object.keys(itemsByCategory).sort();

  // Format price to always show 2 decimals
  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',') + '€';
  };

  return (
    <div className="container mx-auto p-4">
      {categories.map((category) => (
        <div key={category} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{category}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border-b text-left">Artikel</th>
                  <th className="px-4 py-2 border-b text-right">Preis</th>
                </tr>
              </thead>
              <tbody>
                {itemsByCategory[category].map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td
                      className={`px-4 py-2 border-b ${
                        item.soldOut ? 'line-through text-gray-400' : ''
                      }`}
                    >
                      {item.item}
                      {item.soldOut && (
                        <span className="ml-2 inline-block px-2 py-1 text-xs font-semibold text-red-600 bg-red-100 rounded">
                          Ausverkauft
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-2 border-b text-right ${
                        item.soldOut ? 'line-through text-gray-400' : ''
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

      {categories.length === 0 && (
        <p className="text-gray-500">Keine Artikel verfügbar.</p>
      )}
    </div>
  );
}
