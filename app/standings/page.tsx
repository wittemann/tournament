'use client';

import { Fragment, useMemo } from 'react';
import Spinner from '../Spinner';
import StandingsTable from './StandingsTable';
import { Game, Team } from '../types';
import { useRealtimeTable } from '@/lib/useRealtimeTable';
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
  const { rows: games, loading: gamesLoading } = useRealtimeTable<Game>(
    'games',
    [{ column: 'time' }],
  );
  const { rows: teams, loading: teamsLoading } = useRealtimeTable<Team>(
    'teams',
    [{ column: 'name' }],
  );

  const standings = useStandingsByClass(games, teams);

  if (gamesLoading || teamsLoading) return <Spinner />;

  return (
    <div className="space-y-8">
      {standings.map(({ cls, tables, ranking }, i) => (
        <Fragment key={cls}>
          {i > 0 && <div className="divider"></div>}
          <StandingsTable tables={tables} ranking={ranking} title={cls} />
        </Fragment>
      ))}
    </div>
  );
}
