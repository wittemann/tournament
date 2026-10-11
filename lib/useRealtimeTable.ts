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
//
// `error` is true when the last fetch failed (cleared by the next successful
// one), when Supabase is not configured, or when the channel has been down for
// CHANNEL_DOWN_DELAY_MS (shorter drops, e.g. a wake-up reconnect, stay quiet).
// The rows stay as they were, so pages can show them under a banner.
const CHANNEL_DOWN_DELAY_MS = 5000;

// supabase.channel(topic) returns the channel already registered under that
// topic, and removeChannel() is async. Two hooks on one table, or a StrictMode
// cleanup followed by an immediate re-run, would otherwise share a channel that
// is still leaving (and `.on()` on a subscribed channel throws). So every
// effect run gets its own topic.
let channelSeq = 0;

export function useRealtimeTable<T>(
  table: string,
  order: Order[],
): { rows: T[]; loading: boolean; error: boolean } {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [channelDown, setChannelDown] = useState(false);
  const orderKey = JSON.stringify(order);

  useEffect(() => {
    let supabase;
    try {
      supabase = getSupabase();
    } catch (e) {
      console.error('Supabase unavailable:', e);
      Sentry.captureException(e, { tags: { table, source: 'config' } });
      // Deferred: the react-hooks/set-state-in-effect rule forbids setting state
      // synchronously in an effect body.
      queueMicrotask(() => {
        setFetchFailed(true);
        setLoading(false);
      });
      return;
    }
    const orderBy: Order[] = JSON.parse(orderKey);
    const gate = createResponseGate();
    let cancelled = false;
    // A failing channel retries and errors again; report once until it recovers.
    let reported = false;
    let downTimer: ReturnType<typeof setTimeout> | undefined;

    const fetchRows = async () => {
      const ticket = gate.begin();
      let query = supabase.from(table).select();
      for (const { column, ascending = true } of orderBy) {
        query = query.order(column, { ascending });
      }
      const { data, error } = await query;
      if (cancelled) return;
      if (gate.settle(ticket)) setFetchFailed(!!error);
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
    // Per effect run, so a wake re-subscribe reuses the name: the CLOSED channel
    // is already gone from the socket then.
    const topic = `${table}-changes-${++channelSeq}`;
    const subscribe = (): RealtimeChannel => {
      let previous: string | null = null;
      return supabase
        .channel(topic)
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
            clearTimeout(downTimer);
            downTimer = undefined;
            setChannelDown(false);
          } else if (status === 'CLOSED') {
            closed = true;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            downTimer ??= setTimeout(
              () => setChannelDown(true),
              CHANNEL_DOWN_DELAY_MS,
            );
            if (reported) return;
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
      clearTimeout(downTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', wake);
      window.removeEventListener('pageshow', onPageShow);
      supabase.removeChannel(channel);
    };
  }, [table, orderKey]);

  return { rows, loading, error: fetchFailed || channelDown };
}
