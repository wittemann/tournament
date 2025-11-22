import { createClient } from '@supabase/supabase-js';
import GamesTable from './GamesTable';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.from('games').select();

  if (error) {
    console.error('Supabase error:', error);
  }

  return (
    <>
      <h1>Spielplan</h1>
      <GamesTable games={data || []} />
    </>
  );
}
