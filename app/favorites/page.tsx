import { createClient } from '@/lib/supabase/server';
import { Match } from '@/lib/types';
import { MatchCard } from '@/components/MatchCard';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Star, ArrowLeft } from 'lucide-react';

export const revalidate = 0; // Dynamic page

async function getFavoritesData() {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }

  // Get user's favorites
  const { data: favorites } = await supabase
    .from('user_favorites')
    .select('team_id, league_id')
    .eq('user_id', session.user.id);

  if (!favorites || favorites.length === 0) {
    return { matches: [], favorites: [] };
  }

  const teamIds = favorites.map(f => f.team_id).filter(Boolean) as number[];
  const leagueIds = favorites.map(f => f.league_id).filter(Boolean) as number[];

  if (teamIds.length === 0 && leagueIds.length === 0) {
    return { matches: [], favorites };
  }

  // Fetch matches matching favorited teams or leagues
  let query = supabase.from('matches').select(`
    *,
    league:leagues(*),
    home_team:teams!matches_home_team_id_fkey(*),
    away_team:teams!matches_away_team_id_fkey(*)
  `);

  const filterParts = [];
  if (leagueIds.length > 0) {
    filterParts.push(`league_id.in.(${leagueIds.join(',')})`);
  }
  if (teamIds.length > 0) {
    filterParts.push(`home_team_id.in.(${teamIds.join(',')})`, `away_team_id.in.(${teamIds.join(',')})`);
  }

  const { data: matches, error } = await query.or(filterParts.join(',')).order('kickoff_utc', { ascending: true });

  if (error) {
    console.error('Error fetching favorites matches:', error);
    return { matches: [], favorites };
  }

  return {
    matches: (matches ?? []) as unknown as Match[],
    favorites,
  };
}

export default async function FavoritesPage() {
  const { matches, favorites } = await getFavoritesData();

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/" className="btn btn-ghost" style={{ padding: '0.375rem 0.875rem' }}>
          <ArrowLeft size={16} />
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Star size={24} fill="var(--accent-amber)" stroke="var(--accent-amber)" /> My Favorites
        </h1>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">⭐</span>
          <p className="empty-state-title">No Favorites Added</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Click the star icon on any match card to follow your favorite leagues and teams.
          </p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Browse Matches
          </Link>
        </div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📅</span>
          <p className="empty-state-title">No Upcoming Matches</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            There are no scheduled matches for your favorite teams/leagues in the next 48 hours.
          </p>
        </div>
      ) : (
        <div className="matches-grid">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
