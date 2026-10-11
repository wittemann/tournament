'use client';

import { useMemo } from 'react';
import SegmentedControl from '../SegmentedControl';
import Spinner from '../Spinner';
import ConnectionBanner from '../ConnectionBanner';
import Bracket from './Bracket';
import { Game, Team } from '../types';
import { useRealtimeTable } from '@/lib/useRealtimeTable';
import { usePersistedState } from '@/lib/usePersistedState';
import { useNow } from '@/lib/useNow';
import { classesInUse } from '@/lib/classesInUse';
import { buildFinalrunde } from '@/lib/bracket';
import { gameSides } from '@/lib/schedule';
import { standingsContext } from '@/lib/standings';

// Bracket and placement games per class (docs/specs/playoff-bracket.md).
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
  // Same key as the Spielplan's team select: name only, "all" means none.
  const [selectedTeam] = usePersistedState('selectedTeam', 'all');
  const now = useNow();
  const sides = useMemo(() => gameSides(games, teams), [games, teams]);

  const active = classes.find((c) => c === storedClass) ?? classes[0];
  const finalrunde = useMemo(
    () =>
      active
        ? buildFinalrunde(games, standingsContext(games, teams, active))
        : null,
    [games, teams, active],
  );

  if (gamesLoading || teamsLoading) return <Spinner />;

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
        {finalrunde && (
          <Bracket
            finalrunde={finalrunde}
            sidesOf={(game) => sides.get(game.id)}
            now={now}
            selectedTeam={selectedTeam}
          />
        )}
      </div>
    </>
  );
}
