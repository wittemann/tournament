'use client';

import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import { createResponseGate, shouldRefetchOnStatus } from './realtimeSync';

type Order = { column: string; ascending?: boolean };

// Loads a table and reloads it whenever any row changes. `loading` stays true
// until the first fetch has finished; a failed first fetch also ends it, so
// pages show their empty state instead of spinning forever.
//
// A phone in a pocket drops the socket and misses changes, so the table is
// also reloaded when the channel rejoins, when the page becomes visible again,
// when the browser comes back online, and when it is restored from the
// back/forward cache. Refetches keep the current rows (no spinner).
export function useRealtimeTable<T>(
  table: string,
  order: Order[],
): { rows: T[]; loading: boolean } {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const orderKey = JSON.stringify(order);

  useEffect(() => {
    const supabase = getSupabase();
    const orderBy: Order[] = JSON.parse(orderKey);
    const gate = createResponseGate();
    let cancelled = false;
    // A failing channel retries and errors again; report once until it recovers.
    let reported = false;

    const fetchRows = async () => {
      const ticket = gate.begin();
      let query = supabase.from(table).select();
      for (const { column, ascending = true } of orderBy) {
        query = query.order(column, { ascending });
      }
      const { data, error } = await query;
      if (cancelled) return;
      if (error) {
        console.error(`Supabase error (${table}):`, error);
        Sentry.captureException(
          new Error(`Supabase fetch failed (${table}): ${error.message}`, {
            cause: error,
          }),
          { tags: { table, source: 'fetch' } },
        );
      } else if (data && gate.accept(ticket)) {
        setRows(data as T[]);
      }
      setLoading(false);
    };

    // supabase-js rejoins errored channels by itself once the socket is back,
    // but a CLOSED channel is removed from the socket for good. `closed`
    // marks that, so the next wake-up creates a fresh channel.
    let closed = false;
    const subscribe = (): RealtimeChannel => {
      let previous: string | null = null;
      return supabase
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          fetchRows,
        )
        .subscribe((status, err) => {
          if (cancelled) return;
          if (shouldRefetchOnStatus(previous, status)) fetchRows();
          previous = status;
          if (status === 'SUBSCRIBED') {
            reported = false;
          } else if (status === 'CLOSED') {
            closed = true;
          } else if (
            (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') &&
            !reported
          ) {
            reported = true;
            console.error(`Realtime ${status} (${table}):`, err);
            Sentry.captureException(
              err ?? new Error(`Realtime channel ${status} (${table})`),
              { tags: { table, source: 'realtime', status } },
            );
          }
        });
    };

    fetchRows();
    let channel = subscribe();

    const wake = () => {
      // Offline: the `online` event will call this again.
      if (!navigator.onLine) return;
      fetchRows();
      if (closed) {
        closed = false;
        channel = subscribe();
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') wake();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) wake();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', wake);
    window.addEventListener('pageshow', onPageShow);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', wake);
      window.removeEventListener('pageshow', onPageShow);
      supabase.removeChannel(channel);
    };
  }, [table, orderKey]);

  return { rows, loading };
}
