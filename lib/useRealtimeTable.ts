'use client';

import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/nextjs';
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
    // A failing channel retries and errors again; report once until it recovers.
    let reported = false;

    const fetchRows = async () => {
      let query = supabase.from(table).select();
      for (const { column, ascending = true } of orderBy) {
        query = query.order(column, { ascending });
      }
      const { data, error } = await query;
      if (error) {
        console.error(`Supabase error (${table}):`, error);
        Sentry.captureException(
          new Error(`Supabase fetch failed (${table}): ${error.message}`, {
            cause: error,
          }),
          { tags: { table, source: 'fetch' } },
        );
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
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          reported = false;
        } else if (
          (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') &&
          !reported &&
          !cancelled
        ) {
          reported = true;
          console.error(`Realtime ${status} (${table}):`, err);
          Sentry.captureException(
            err ?? new Error(`Realtime channel ${status} (${table})`),
            { tags: { table, source: 'realtime', status } },
          );
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [table, orderKey]);

  return rows;
}
