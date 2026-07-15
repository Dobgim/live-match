'use client';

import { useEffect, useState } from 'react';
import { Match } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export function useRealtimeMatches(initialMatches: Match[], enabled: boolean = false) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const supabase = createClient();

  // Sync state if initialMatches changes (e.g. page transition or reload)
  useEffect(() => {
    setMatches(initialMatches);
  }, [initialMatches]);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('public:matches')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          const updatedMatch = payload.new as Match;
          setMatches((prev) =>
            prev.map((m) => {
              if (m.external_id === updatedMatch.external_id) {
                return {
                  ...m,
                  status: updatedMatch.status,
                  elapsed: updatedMatch.elapsed,
                  home_score: updatedMatch.home_score,
                  away_score: updatedMatch.away_score,
                  home_ht_score: updatedMatch.home_ht_score,
                  away_ht_score: updatedMatch.away_ht_score,
                  popularity_score: updatedMatch.popularity_score,
                  updated_at: updatedMatch.updated_at,
                };
              }
              return m;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, supabase]);

  return matches;
}
