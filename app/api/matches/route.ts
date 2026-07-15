import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get('tab') ?? 'today'; // live | today | tomorrow | trending
  const leagueId = searchParams.get('league_id');
  const country = searchParams.get('country');
  const liveOnly = searchParams.get('live_only') === 'true';

  const supabase = createClient();

  let query = supabase.from('matches').select(`
    *,
    league:leagues(*),
    home_team:teams!matches_home_team_id_fkey(*),
    away_team:teams!matches_away_team_id_fkey(*)
  `);

  // Handle Tab filter
  const todayStr = new Date().toISOString().split('T')[0];
  if (tab === 'live') {
    query = query.in('status', ['1H', '2H', 'ET', 'P', 'HT']);
  } else if (tab === 'today') {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);
    query = query.gte('kickoff_utc', todayStart.toISOString()).lte('kickoff_utc', todayEnd.toISOString());
  } else if (tab === 'tomorrow') {
    const tomorrowStart = new Date();
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
    tomorrowStart.setUTCHours(0, 0, 0, 0);
    const tomorrowEnd = new Date();
    tomorrowEnd.setUTCDate(tomorrowEnd.getUTCDate() + 1);
    tomorrowEnd.setUTCHours(23, 59, 59, 999);
    query = query.gte('kickoff_utc', tomorrowStart.toISOString()).lte('kickoff_utc', tomorrowEnd.toISOString());
  } else if (tab === 'trending') {
    const weekAgo = new Date();
    weekAgo.setUTCDate(weekAgo.getUTCDate() - 3);
    query = query.gte('kickoff_utc', weekAgo.toISOString()).eq('leagues.is_featured', true);
  }

  // Live Only toggle
  if (liveOnly && tab !== 'live') {
    query = query.in('status', ['1H', '2H', 'ET', 'P', 'HT']);
  }

  // League filter
  if (leagueId) {
    query = query.eq('league_id', parseInt(leagueId));
  }

  // Country filter
  if (country) {
    query = query.eq('leagues.country', country);
  }

  query = query.order('popularity_score', { ascending: false }).limit(100);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Set Cache Control headers for Edge / CDN caching
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
    },
  });
}
