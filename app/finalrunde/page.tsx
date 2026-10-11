'use client';

import { useMemo } from 'react';
import SegmentedControl from '../SegmentedControl';
import Spinner from '../Spinner';
import StatusCard from '../StatusCard';
import ConnectionBanner from '../ConnectionBanner';
import { Game, Team } from '../types';
import { useRealtimeTable } from '@/lib/useRealtimeTable';
import { usePersistedState } from '@/lib/usePersistedState';
import { classesInUse } from '@/lib/classesInUse';

// Placeholder until the bracket is built (docs/TODO.md, section 6). The data is
// loaded like on the Tabelle so the page already behaves like the final one.
// Shares the Tabelle's class key, so the chosen class carries over.
export default function Page() {
  const {
    rows: games,
    loading: gamesLoading,
    error: gamesError,
  } = useRealtimeTable<Game>('games', [{ column: 'time' }]);
  const {
    rows: teams,
    loading: teamsLoading,
    error: teamsError,
  } = useRealtimeTable<Team>('teams', [{ column: 'name' }]);

  const classes = useMemo(() => classesInUse(games, teams), [games, teams]);
  const [storedClass, setStoredClass] = usePersistedState('tableClass', '');

  if (gamesLoading || teamsLoading) return <Spinner />;

  const active = classes.find((c) => c === storedClass) ?? classes[0];

  return (
    <>
      <ConnectionBanner show={gamesError || teamsError} />
      <div className="space-y-4">
        {classes.length > 1 && (
          <SegmentedControl
            ariaLabel="Klasse"
            options={classes.map((cls) => ({ value: cls, label: cls }))}
            value={active ?? ''}
            onChange={setStoredClass}
          />
        )}
        <StatusCard>Finalrunde folgt.</StatusCard>
      </div>
    </>
  );
}
