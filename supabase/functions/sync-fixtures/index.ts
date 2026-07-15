// supabase/functions/sync-fixtures/index.ts
// Deno Edge Function — runs daily at 02:00 UTC
// Fetches today + tomorrow fixtures for all priority leagues and upserts into DB

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY')!;

const PRIORITY_LEAGUE_IDS = [2, 39, 140, 78, 135, 61, 1, 6];

const RAPIDAPI_HEADERS = {
  'X-RapidAPI-Key': RAPIDAPI_KEY,
  'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
};

function getDateString(daysOffset = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

async function fetchFixturesForDate(date: string) {
  const url = `https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${date}&timezone=UTC`;
  const res = await fetch(url, { headers: RAPIDAPI_HEADERS });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.response ?? [];
}

function transformFixture(f: any) {
  return {
    external_id: f.fixture.id,
    league_id: f.league.id,
    home_team_id: f.teams.home.id,
    away_team_id: f.teams.away.id,
    kickoff_utc: f.fixture.date,
    status: f.fixture.status.short,
    elapsed: f.fixture.status.elapsed ?? null,
    home_score: f.goals.home,
    away_score: f.goals.away,
    home_ht_score: f.score.halftime.home,
    away_ht_score: f.score.halftime.away,
    venue_name: f.fixture.venue.name ?? null,
    venue_city: f.fixture.venue.city ?? null,
    round: f.league.round ?? null,
    season: f.league.season,
    last_synced_at: new Date().toISOString(),
  };
}

Deno.serve(async (req: Request) => {
  // Basic auth check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const logId = crypto.randomUUID();

  // Insert sync log entry
  await supabase.from('sync_log').insert({
    id: logId,
    job_name: 'daily-fixture-sync',
    status: 'running',
  });

  try {
    const today = getDateString(0);
    const tomorrow = getDateString(1);

    console.log(`[sync-fixtures] Fetching ${today} and ${tomorrow}`);

    const [todayFixtures, tomorrowFixtures] = await Promise.all([
      fetchFixturesForDate(today),
      fetchFixturesForDate(tomorrow),
    ]);

    const allFixtures = [...todayFixtures, ...tomorrowFixtures].filter(
      (f: any) => PRIORITY_LEAGUE_IDS.includes(f.league.id)
    );

    console.log(`[sync-fixtures] Found ${allFixtures.length} priority fixtures`);

    // Upsert teams
    const teamsMap = new Map<number, any>();
    for (const f of allFixtures) {
      teamsMap.set(f.teams.home.id, {
        id: f.teams.home.id,
        name: f.teams.home.name,
        logo_url: f.teams.home.logo,
        country: f.league.country,
      });
      teamsMap.set(f.teams.away.id, {
        id: f.teams.away.id,
        name: f.teams.away.name,
        logo_url: f.teams.away.logo,
        country: f.league.country,
      });
    }
    if (teamsMap.size > 0) {
      await supabase.from('teams').upsert(
        Array.from(teamsMap.values()),
        { onConflict: 'id' }
      );
    }

    // Upsert leagues (only if not already in DB with priority set)
    const leagueMap = new Map<number, any>();
    for (const f of allFixtures) {
      if (!leagueMap.has(f.league.id)) {
        leagueMap.set(f.league.id, {
          id: f.league.id,
          name: f.league.name,
          country: f.league.country,
          logo_url: f.league.logo,
        });
      }
    }
    if (leagueMap.size > 0) {
      await supabase.from('leagues').upsert(
        Array.from(leagueMap.values()),
        { onConflict: 'id', ignoreDuplicates: true }
      );
    }

    // Upsert matches
    const matches = allFixtures.map(transformFixture);
    let matchesSynced = 0;
    if (matches.length > 0) {
      const { error } = await supabase
        .from('matches')
        .upsert(matches, { onConflict: 'external_id' });
      if (error) throw new Error(error.message);
      matchesSynced = matches.length;
    }

    // Update sync log
    await supabase.from('sync_log').update({
      status: 'success',
      matches_synced: matchesSynced,
      completed_at: new Date().toISOString(),
    }).eq('id', logId);

    return new Response(
      JSON.stringify({ success: true, matches_synced: matchesSynced }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[sync-fixtures] Error:', err.message);
    await supabase.from('sync_log').update({
      status: 'error',
      error_message: err.message,
      completed_at: new Date().toISOString(),
    }).eq('id', logId);

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
