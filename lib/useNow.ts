'use client';

import { useEffect, useState } from 'react';

// Current time as "HH:MM", refreshed every 30 seconds. Null until mounted.
export function useNow(): string | null {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setNow(
        `${String(d.getHours()).padStart(2, '0')}:${String(
          d.getMinutes(),
        ).padStart(2, '0')}`,
      );
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return now;
}
