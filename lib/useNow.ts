'use client';

import { useEffect, useState } from 'react';
import { liveNowFor, localDate, type LiveTimes } from './eventDay';
import { useRealtimeTable } from './useRealtimeTable';

interface Clock {
  /** "HH:MM" */
  time: string;
  /** Local "YYYY-MM-DD" */
  date: string;
}

// The device clock, refreshed every 30 seconds. Null until mounted.
function useClock(): Clock | null {
  const [clock, setClock] = useState<Clock | null>(null);

  useEffect(() => {
    const update = () => {
      const d = new Date();
      const time = `${String(d.getHours()).padStart(2, '0')}:${String(
        d.getMinutes(),
      ).padStart(2, '0')}`;
      const date = localDate(d);
      setClock((c) =>
        c?.time === time && c.date === date ? c : { time, date },
      );
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return clock;
}

// Current time as "HH:MM", refreshed every 30 seconds. Null until mounted.
export function useNow(): string | null {
  return useClock()?.time ?? null;
}

/**
 * Live and outlook times (lib/eventDay.ts): "läuft", the "Jetzt" line and
 * "in N Min." only on the event day. The header clock keeps using useNow().
 */
export function useLiveNow(): LiveTimes {
  const clock = useClock();
  const { rows, loading } = useRealtimeTable<{ date: string }>('event', []);
  return liveNowFor(clock, rows, loading);
}
