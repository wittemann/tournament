'use client';

import GamesTable from './GamesTable';
import { Game } from './types';
import { useRealtimeTable } from '@/lib/useRealtimeTable';

export default function Page() {
  const games = useRealtimeTable<Game>('games', [
    { column: 'time' },
    { column: 'location' },
  ]);

  return <GamesTable games={games} />;
}
