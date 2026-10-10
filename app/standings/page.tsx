'use client';

import StandingsTable from './StandingsTable';
import { Standing } from '../types';
import { useRealtimeTable } from '@/lib/useRealtimeTable';

export default function Page() {
  const standings = useRealtimeTable<Standing>('standings', [
    { column: 'position' },
  ]);

  // Filter standings by class
  const schuelerStandings = standings.filter(
    (standing) => standing.class === 'Schüler',
  );
  const tballStandings = standings.filter(
    (standing) => standing.class === 'T-Ball',
  );

  return (
    <div className="space-y-8">
      <StandingsTable standings={schuelerStandings} title="Schüler" />
      <div className="divider"></div>
      <StandingsTable standings={tballStandings} title="T-Ball" />
    </div>
  );
}
