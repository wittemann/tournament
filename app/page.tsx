'use client';

import { createClient } from '@supabase/supabase-js';
import GamesTable from './GamesTable';
import { useEffect, useState } from 'react';
import { Game } from './types';

export default function Page() {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initial fetch
    const fetchGames = async () => {
      const { data, error } = await supabase
        .from('games')
        .select()
        .order('time')
        .order('location');
      if (error) {
        console.error('Supabase error:', error);
      } else if (data) {
        setGames(data);
      }
    };

    fetchGames();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('games-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games' },
        async () => {
          const { data } = await supabase
            .from('games')
            .select()
            .order('time')
            .order('location');
          if (data) {
            setGames(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return <GamesTable games={games} />;
}
