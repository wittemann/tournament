'use client';

import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import {
  createReportThrottle,
  createResponseGate,
  shouldRefetchOnStatus,
} from './realtimeSync';

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
// CHANNEL_DOWN_DELAY_MS. The rows stay as they were, so pages can show them
// under a banner. A phone waking up refetches at once but can take several
// seconds to rejoin, so shorter drops stay quiet.
//
// Sentry hears about an outage only once it has lasted CHANNEL_REPORT_DELAY_MS
// while the page is visible and the browser online: supabase-js rejoins by
// itself, and mobile networks drop sockets all the time (live, Nov 2026: every
// event was a phone reconnecting). One report per REPORT_INTERVAL_MS covers all
// tables, since a drop hits every channel on the shared socket at once.
const CHANNEL_DOWN_DELAY_MS = 15_000;
const CHANNEL_REPORT_DELAY_MS = 60_000;
const REPORT_INTERVAL_MS = 10 * 60_000;
const reportThrottle = createReportThrottle(REPORT_INTERVAL_MS);

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
    let downTimer: ReturnType<typeof setTimeout> | undefined;
    let reportTimer: ReturnType<typeof setTimeout> | undefined;

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
            outage = undefined;
            clearOutageTimers();
            setChannelDown(false);
          } else if (status === 'CLOSED') {
            closed = true;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            outage = { status, err };
            armOutageTimers();
          }
        });
    };

    // Set while the channel is down (until SUBSCRIBED), for the timers below.
    let outage: { status: string; err: unknown } | undefined;
    // A failing channel retries and errors again; each timer is armed once and
    // kept until it fires or SUBSCRIBED clears it.
    const armOutageTimers = () => {
      downTimer ??= setTimeout(() => {
        setChannelDown(true);
        console.error(`Realtime ${outage?.status} (${table}):`, outage?.err);
      }, CHANNEL_DOWN_DELAY_MS);
      reportTimer ??= setTimeout(() => {
        // Cleared first, so a report skipped here is retried on the next
        // failing status instead of never.
        reportTimer = undefined;
        if (!outage) return;
        if (document.visibilityState !== 'visible') return;
        if (!navigator.onLine) return;
        if (!reportThrottle.tryReport(Date.now())) return;
        const { status, err } = outage;
        Sentry.captureException(
          err ?? new Error(`Realtime channel ${status} (${table})`),
          { tags: { table, source: 'realtime', status } },
        );
      }, CHANNEL_REPORT_DELAY_MS);
    };
    const clearOutageTimers = () => {
      clearTimeout(downTimer);
      clearTimeout(reportTimer);
      downTimer = undefined;
      reportTimer = undefined;
    };

    fetchRows();
    let channel = subscribe();

    const wake = () => {
      // Offline: the `online` event will call this again.
      if (!navigator.onLine) return;
      fetchRows();
      // Timers run on wall-clock time, so a sleeping phone's overdue timers
      // would fire right after resume, before the rejoin. Restart them so the
      // outage is timed from the wake-up. The banner already shown stays.
      if (outage) {
        clearOutageTimers();
        armOutageTimers();
      }
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
      clearOutageTimers();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', wake);
      window.removeEventListener('pageshow', onPageShow);
      supabase.removeChannel(channel);
    };
  }, [table, orderKey]);

  return { rows, loading, error: fetchFailed || channelDown };
}
