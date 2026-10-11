'use client';

import Spinner from '../Spinner';
import StatusCard from '../StatusCard';
import ConnectionBanner from '../ConnectionBanner';
import { useRealtimeTable } from '@/lib/useRealtimeTable';

// Placeholder until the bracket is built (docs/TODO.md, section 6). The data is
// loaded like on the Tabelle so the page already behaves like the final one.
export default function Page() {
  const games = useRealtimeTable('games', [{ column: 'time' }]);
  const teams = useRealtimeTable('teams', [{ column: 'name' }]);

  if (games.loading || teams.loading) return <Spinner />;

  return (
    <>
      <ConnectionBanner show={games.error || teams.error} />
      <StatusCard>Finalrunde folgt.</StatusCard>
    </>
  );
}
