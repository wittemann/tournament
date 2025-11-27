'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import StandingsTable from './StandingsTable';

type Standing = {
  id: number;
  position: string;
  team: string;
  wins: number;
  losses: number;
  diff: number;
  class: string;
};

export default function Page() {
  const [standings, setStandings] = useState<Standing[]>([]);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initial fetch
    const fetchStandings = async () => {
      const { data, error } = await supabase
        .from('standings')
        .select()
        .order('position');
      if (error) {
        console.error('Supabase error:', error);
      } else if (data) {
        setStandings(data);
      }
    };

    fetchStandings();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('standings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'standings' },
        async () => {
          const { data } = await supabase
            .from('standings')
            .select()
            .order('position');
          if (data) {
            setStandings(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter standings by class
  const schuelerStandings = standings.filter(
    (standing) => standing.class === 'Schüler'
  );
  const tballStandings = standings.filter(
    (standing) => standing.class === 'T-Ball'
  );

  return (
    <div className="space-y-8">
      <StandingsTable standings={schuelerStandings} title="Schüler" />
      <div className="divider"></div>
      <StandingsTable standings={tballStandings} title="T-Ball" />
    </div>
  );
}
