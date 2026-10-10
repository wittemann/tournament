'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from './supabase';

type Order = { column: string; ascending?: boolean };

// Loads a table and reloads it whenever any row changes.
export function useRealtimeTable<T>(table: string, order: Order[]): T[] {
  const [rows, setRows] = useState<T[]>([]);
  const orderKey = JSON.stringify(order);

  useEffect(() => {
    const supabase = getSupabase();
    const orderBy: Order[] = JSON.parse(orderKey);
    let cancelled = false;

    const fetchRows = async () => {
      let query = supabase.from(table).select();
      for (const { column, ascending = true } of orderBy) {
        query = query.order(column, { ascending });
      }
      const { data, error } = await query;
      if (error) {
        console.error(`Supabase error (${table}):`, error);
      } else if (data && !cancelled) {
        setRows(data as T[]);
      }
    };

    fetchRows();

    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        fetchRows,
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [table, orderKey]);

  return rows;
}
