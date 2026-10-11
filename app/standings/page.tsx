'use client';

import { useMemo } from 'react';
import SegmentedControl from '../SegmentedControl';
import Spinner from '../Spinner';
import ConnectionBanner from '../ConnectionBanner';
import StandingsTable from './StandingsTable';
import { Game, Team } from '../types';
import { useRealtimeTable } from '@/lib/useRealtimeTable';
import { usePersistedState } from '@/lib/usePersistedState';
import { Constants } from '@/lib/database.types';
import {
  groupTables,
  placementRanking,
  standingsContext,
  type GameClass,
} from '@/lib/standings';

// Stable display order: the enum order of the schema, not alphabetical.
const CLASS_ORDER: readonly GameClass[] = Constants.public.Enums.class;

function useStandingsByClass(games: Game[], teams: Team[]) {
  return useMemo(() => {
    const present = new Set<GameClass>([
      ...teams.map((t) => t.class),
      ...games.map((g) => g.class),
    ]);
    return CLASS_ORDER.filter((cls) => present.has(cls)).map((cls) => ({
      cls,
      tables: groupTables(games, teams, cls),
      ranking: placementRanking(standingsContext(games, teams, cls)),
    }));
  }, [games, teams]);
}

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

  const standings = useStandingsByClass(games, teams);
  // Own storage key: the Spielplan's class filter can be "all", which has no
  // table. A stored class that is gone falls back to the first one.
  const [storedClass, setStoredClass] = usePersistedState('tableClass', '');

  if (gamesLoading || teamsLoading) return <Spinner />;

  const active = standings.find((s) => s.cls === storedClass) ?? standings[0];

  return (
    <>
      <ConnectionBanner show={gamesError || teamsError} />
      <div className="space-y-4">
        {standings.length > 1 && (
          <SegmentedControl
            ariaLabel="Klasse"
            options={standings.map(({ cls }) => ({ value: cls, label: cls }))}
            value={active?.cls ?? ''}
            onChange={setStoredClass}
          />
        )}
        {active && (
          <StandingsTable tables={active.tables} ranking={active.ranking} />
        )}
      </div>
    </>
  );
}
