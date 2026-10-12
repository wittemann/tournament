'use client';

import { useMemo } from 'react';
import SegmentedControl from '../SegmentedControl';
import Spinner from '../Spinner';
import ConnectionBanner from '../ConnectionBanner';
import StandingsTable from './StandingsTable';
import StatusCard from '../StatusCard';
import { Game, Team } from '../types';
import { useRealtimeTable } from '@/lib/useRealtimeTable';
import { usePersistedState } from '@/lib/usePersistedState';
import { teamNameInClass } from '@/lib/teamSelection';
import { classesInUse } from '@/lib/classesInUse';
import { cutOff } from '@/lib/cutOff';
import { groupTables, standingsContext } from '@/lib/standings';

function useStandingsByClass(games: Game[], teams: Team[]) {
  return useMemo(
    () =>
      classesInUse(games, teams).map((cls) => {
        const ctx = standingsContext(games, teams, cls);
        return {
          cls,
          tables: groupTables(games, teams, cls),
          cutOff: cutOff(ctx),
        };
      }),
    [games, teams],
  );
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
  // Same key as the Spielplan's team select (see lib/teamSelection.ts).
  const [selectedTeam] = usePersistedState('selectedTeam', 'all');

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
        {active &&
          active.tables.some((t) => t.total > 0) &&
          active.tables.every((t) => t.played === 0) && (
            <StatusCard>
              Noch keine Ergebnisse. Die Tabelle füllt sich mit dem ersten
              Spiel.
            </StatusCard>
          )}
        {active && (
          <StandingsTable
            tables={active.tables}
            cutOff={active.cutOff}
            selectedTeam={teamNameInClass(selectedTeam, active?.cls)}
          />
        )}
      </div>
    </>
  );
}
