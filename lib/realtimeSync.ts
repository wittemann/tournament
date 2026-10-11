// Pure helpers for useRealtimeTable: when to refetch, and which response wins.

// Changes are only delivered while the channel is joined. Whenever it (re)joins,
// anything that happened before (the gap between the first fetch and the first
// join, or the whole time a sleeping phone was disconnected) may be missing, so
// the table is fetched again. supabase-js reports every rejoin as SUBSCRIBED,
// preceded by CHANNEL_ERROR / TIMED_OUT.
export function shouldRefetchOnStatus(
  previous: string | null,
  status: string,
): boolean {
  return status === 'SUBSCRIBED' && previous !== 'SUBSCRIBED';
}

// Overlapping fetches can resolve out of order. Each request takes a ticket
// from `begin()`; `accept()` lets a response through only if no newer one has
// been applied yet, so older data never overwrites newer data.
export function createResponseGate() {
  let issued = 0;
  let applied = 0;
  return {
    begin(): number {
      return ++issued;
    },
    accept(ticket: number): boolean {
      if (ticket <= applied) return false;
      applied = ticket;
      return true;
    },
  };
}
