import { createClient } from '@/lib/supabase/server';
import { Match } from '@/lib/types';
import { HeroMatch } from '@/components/HeroMatch';
import { TabNav } from '@/components/TabNav';
import { MatchesSection } from '@/components/MatchesSection';
import { FilterBar } from '@/components/FilterBar';

// Revalidate every 60 seconds for near real-time freshness
export const revalidate = 60;

async function getMatches(): Promise<Match[]> {
  const supabase = createClient();

  // Get today and tomorrow's matches + featured
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const tomorrowEnd = new Date();
  tomorrowEnd.setUTCDate(tomorrowEnd.getUTCDate() + 2);
  tomorrowEnd.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      league:leagues(*),
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `)
    .gte('kickoff_utc', todayStart.toISOString())
    .lt('kickoff_utc', tomorrowEnd.toISOString())
    .order('popularity_score', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching matches:', error);
    return [];
  }

  return (data ?? []) as unknown as Match[];
}

async function getLiveMatches(): Promise<Match[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      league:leagues(*),
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*),
      events:match_events(*)
    `)
    .in('status', ['1H', '2H', 'ET', 'P', 'HT'])
    .order('popularity_score', { ascending: false });

  if (error) return [];
  return (data ?? []) as unknown as Match[];
}

async function getTrendingMatches(): Promise<Match[]> {
  const supabase = createClient();

  const weekAgo = new Date();
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 3);

  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      league:leagues(*),
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `)
    .gte('kickoff_utc', weekAgo.toISOString())
    .eq('league.is_featured', true)
    .order('popularity_score', { ascending: false })
    .limit(20);

  if (error) return [];
  return (data ?? []) as unknown as Match[];
}

export default async function HomePage() {
  const [allMatches, liveMatches, trendingMatches] = await Promise.all([
    getMatches(),
    getLiveMatches(),
    getTrendingMatches(),
  ]);

  // Split today vs tomorrow
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMatches = allMatches.filter((m) =>
    m.kickoff_utc.startsWith(todayStr)
  );
  const tomorrowMatches = allMatches.filter(
    (m) => !m.kickoff_utc.startsWith(todayStr)
  );

  // Hero match = top live match, or most popular today match
  const heroMatch = liveMatches[0] ?? todayMatches[0] ?? null;

  return (
    <div className="page-enter">
      {/* Hero */}
      {heroMatch && (
        <section style={{ marginBottom: '2rem' }}>
          <HeroMatch match={heroMatch} />
        </section>
      )}

      {/* Filter Bar */}
      <FilterBar />

      {/* Tab Navigation + Match Sections */}
      <TabNav
        liveCount={liveMatches.length}
        todayCount={todayMatches.length}
        tomorrowCount={tomorrowMatches.length}
        trendingCount={trendingMatches.length}
      />

      {/* Live Matches */}
      <MatchesSection
        id="live"
        title="🔴 Live Now"
        matches={liveMatches}
        emptyMessage="No matches currently live"
        emptyIcon="📺"
        isLiveSection
      />

      {/* Today */}
      <MatchesSection
        id="today"
        title="📅 Today's Matches"
        matches={todayMatches}
        emptyMessage="No matches scheduled for today"
        emptyIcon="📅"
      />

      {/* Tomorrow */}
      <MatchesSection
        id="tomorrow"
        title="📆 Tomorrow"
        matches={tomorrowMatches}
        emptyMessage="No fixtures for tomorrow yet"
        emptyIcon="📆"
      />

      {/* Trending */}
      <MatchesSection
        id="trending"
        title="🔥 Trending Matches"
        matches={trendingMatches}
        emptyMessage="No trending matches right now"
        emptyIcon="🔥"
      />
    </div>
  );
}
