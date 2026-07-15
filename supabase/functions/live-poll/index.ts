// supabase/functions/live-poll/index.ts
// Deno Edge Function — runs every 2 minutes
// Only fetches live fixtures from API-Football and updates scores + events
// Supabase Realtime automatically pushes changes to subscribed browsers

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY')!;

const RAPIDAPI_HEADERS = {
  'X-RapidAPI-Key': RAPIDAPI_KEY,
  'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
};

const PRIORITY_LEAGUE_IDS = [2, 39, 140, 78, 135, 61, 1, 6];

async function fetchLiveFixtures() {
  const url = 'https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all&timezone=UTC';
  const res = await fetch(url, { headers: RAPIDAPI_HEADERS });
  if (!res.ok) throw new Error(`API live fetch error: ${res.status}`);
  const json = await res.json();
  return json.response ?? [];
}

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // First check: are there any live matches in our DB?
    const { data: liveMatches } = await supabase
      .from('matches')
      .select('id, external_id')
      .in('status', ['1H', '2H', 'ET', 'P', 'HT'])
      .in('league_id', PRIORITY_LEAGUE_IDS)
      .limit(1);

    // If no live matches, skip API call (saves quota)
    if (!liveMatches || liveMatches.length === 0) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'No live matches' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const liveFixtures = await fetchLiveFixtures();
    const priorityLive = liveFixtures.filter(
      (f: any) => PRIORITY_LEAGUE_IDS.includes(f.league.id)
    );

    console.log(`[live-poll] ${priorityLive.length} live fixtures to update`);

    let updated = 0;
    for (const f of priorityLive) {
      const { error } = await supabase
        .from('matches')
        .update({
          status: f.fixture.status.short,
          elapsed: f.fixture.status.elapsed ?? null,
          home_score: f.goals.home,
          away_score: f.goals.away,
          home_ht_score: f.score.halftime.home,
          away_ht_score: f.score.halftime.away,
          last_synced_at: new Date().toISOString(),
        })
        .eq('external_id', f.fixture.id);

      if (!error) {
        updated++;

        // Upsert events if any (goals, cards)
        if (f.events && f.events.length > 0) {
          const { data: matchRow } = await supabase
            .from('matches')
            .select('id')
            .eq('external_id', f.fixture.id)
            .single();

          if (matchRow) {
            const events = f.events.map((e: any) => ({
              match_id: matchRow.id,
              type: e.type,
              detail: e.detail,
              team_id: e.team.id,
              player_name: e.player.name,
              elapsed: e.time.elapsed,
            }));

            // Replace all events for this match
            await supabase.from('match_events').delete().eq('match_id', matchRow.id);
            await supabase.from('match_events').insert(events);
          }
        }
      }
    }

    // Also mark matches that were live but now finished
    const liveExternalIds = priorityLive.map((f: any) => f.fixture.id);
    if (liveExternalIds.length === 0) {
      // All our "live" matches must have finished
      await supabase
        .from('matches')
        .update({ status: 'FT', elapsed: 90 })
        .in('status', ['1H', '2H'])
        .not('external_id', 'in', `(${liveExternalIds.join(',')})`);
    }

    return new Response(
      JSON.stringify({ success: true, updated }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[live-poll] Error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
