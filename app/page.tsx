'use client';

import { useMemo } from 'react';
import GamesTable from './GamesTable';
import { Game, Team } from './types';
import { useRealtimeTable } from '@/lib/useRealtimeTable';
import { gameSides } from '@/lib/schedule';

export default function Page() {
  const {
    rows: games,
    loading: gamesLoading,
    error: gamesError,
  } = useRealtimeTable<Game>('games', [
    { column: 'time' },
    { column: 'location' },
  ]);
  const {
    rows: teams,
    loading: teamsLoading,
    error: teamsError,
  } = useRealtimeTable<Team>('teams', [{ column: 'name' }]);
  const sides = useMemo(() => gameSides(games, teams), [games, teams]);

  return (
    <GamesTable
      games={games}
      sides={sides}
      loading={gamesLoading || teamsLoading}
      error={gamesError || teamsError}
    />
  );
}
