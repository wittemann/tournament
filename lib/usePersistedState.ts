'use client';

import { useEffect, useState } from 'react';

// Like useState, but remembered in localStorage. The stored value is read
// after mount so server and client render the same initial markup.
export function usePersistedState(key: string, initial: string) {
  const [value, setValue] = useState(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored !== null) setValue(stored);
    } catch {}
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, value);
    } catch {}
  }, [key, value, loaded]);

  return [value, setValue] as const;
}
