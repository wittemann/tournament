'use client';

import { useMemo } from 'react';
import StandingsTable from './StandingsTable';
import { Game, Team } from '../types';
import { useRealtimeTable } from '@/lib/useRealtimeTable';
import {
  groupTables,
  placementRanking,
  standingsContext,
  type GameClass,
} from '@/lib/standings';

function useClassStandings(games: Game[], teams: Team[], cls: GameClass) {
  return useMemo(() => {
    const tables = groupTables(games, teams, cls);
    const ranking = placementRanking(standingsContext(games, teams, cls));
    return { tables, ranking };
  }, [games, teams, cls]);
}

export default function Page() {
  const games = useRealtimeTable<Game>('games', [{ column: 'time' }]);
  const teams = useRealtimeTable<Team>('teams', [{ column: 'name' }]);

  const schueler = useClassStandings(games, teams, 'Schüler');
  const tball = useClassStandings(games, teams, 'T-Ball');

  return (
    <div className="space-y-8">
      <StandingsTable
        tables={schueler.tables}
        ranking={schueler.ranking}
        title="Schüler"
      />
      <div className="divider"></div>
      <StandingsTable
        tables={tball.tables}
        ranking={tball.ranking}
        title="T-Ball"
      />
    </div>
  );
}
