import { createClient } from '@/lib/supabase/server';
import { Match, MatchEvent } from '@/lib/types';
import { getStatusLabel, getStatusColor } from '@/lib/ranking';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, Activity, Info } from 'lucide-react';
import { WatchButton } from '@/components/WatchButton';
import { FavoriteButton } from '@/components/FavoriteButton';

interface MatchPageProps {
  params: {
    id: string;
  };
}

async function getMatchData(externalId: number) {
  const supabase = createClient();

  // Fetch match details
  const { data: matchData, error } = await supabase
    .from('matches')
    .select(`
      *,
      league:leagues(*),
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `)
    .eq('external_id', externalId)
    .maybeSingle();

  if (error || !matchData) return null;

  // Increment view count in background via RPC
  await supabase.rpc('increment_view_count', { p_match_id: matchData.id });

  // Fetch match events
  const { data: events } = await supabase
    .from('match_events')
    .select('*')
    .eq('match_id', matchData.id)
    .order('elapsed', { ascending: true });

  return {
    match: matchData as unknown as Match,
    events: (events ?? []) as MatchEvent[],
  };
}

export default async function MatchDetailPage({ params }: MatchPageProps) {
  const externalId = parseInt(params.id);
  if (isNaN(externalId)) notFound();

  const data = await getMatchData(externalId);
  if (!data) notFound();

  const { match, events } = data;
  const kickoff = new Date(match.kickoff_utc);

  return (
    <div className="page-enter" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <Link href="/" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.875rem' }}>
          <ArrowLeft size={16} />
          Back
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FavoriteButton matchId={match.id} leagueId={match.league_id} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            👁️ {match.view_count + 1} views
          </span>
        </div>
      </div>

      {/* Main Scoreboard card */}
      <div className="hero-match" style={{ marginBottom: '2rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '999px',
              background: getStatusColor(match.status) + '20',
              color: getStatusColor(match.status),
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {getStatusLabel(match)}
          </span>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {match.league?.name} {match.round ? `· ${match.round}` : ''}
          </p>
        </div>

        <div className="hero-teams">
          {/* Home */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            {match.home_team?.logo_url ? (
              <Image
                src={match.home_team.logo_url}
                alt={match.home_team.name}
                width={64}
                height={64}
                style={{ objectFit: 'contain' }}
                unoptimized
              />
            ) : (
              <span style={{ fontSize: '3rem' }}>🏠</span>
            )}
            <span className="hero-team-name" style={{ textAlign: 'center' }}>
              {match.home_team?.name}
            </span>
          </div>

          {/* Score */}
          <div style={{ textAlign: 'center' }}>
            <div className="hero-score" style={{ fontSize: '3.5rem' }}>
              {match.home_score !== null ? `${match.home_score} – ${match.away_score}` : 'vs'}
            </div>
            {match.home_ht_score !== null && (
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Halftime: {match.home_ht_score} – {match.away_ht_score}
              </span>
            )}
          </div>

          {/* Away */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            {match.away_team?.logo_url ? (
              <Image
                src={match.away_team.logo_url}
                alt={match.away_team.name}
                width={64}
                height={64}
                style={{ objectFit: 'contain' }}
                unoptimized
              />
            ) : (
              <span style={{ fontSize: '3rem' }}>✈️</span>
            )}
            <span className="hero-team-name" style={{ textAlign: 'center' }}>
              {match.away_team?.name}
            </span>
          </div>
        </div>
      </div>

      {/* Info / Stream panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={16} /> Match Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Date & Time</span>
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={14} /> {kickoff.toLocaleString()}
              </span>
            </div>
            {match.venue_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Stadium</span>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={14} /> {match.venue_name} ({match.venue_city})
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Season</span>
              <span style={{ fontWeight: 600 }}>{match.season}</span>
            </div>
          </div>
        </div>

        {/* Legal stream selection */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Broadcaster & Streams</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Legal licensed streams from official broadcasters. Availability is subject to your geographical location.
            </p>
          </div>
          <WatchButton match={match} />
        </div>
      </div>

      {/* Match Timeline / Events */}
      <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={16} /> Match Timeline
        </h3>

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
            <p style={{ fontSize: '0.875rem' }}>No events logged for this match yet.</p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Goals, cards, and substitutions appear here once play begins.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
            {/* Center line for timeline visual */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '2px', background: 'var(--border)', transform: 'translateX(-50%)' }} />

            {events.map((e) => {
              const isHomeEvent = e.team_id === match.home_team_id;
              return (
                <div
                  key={e.id}
                  style={{
                    display: 'flex',
                    justifyContent: isHomeEvent ? 'flex-start' : 'flex-end',
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {/* Timeline node */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--bg-surface-3)',
                      border: '2px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      zIndex: 10,
                    }}
                  >
                    {e.elapsed}'
                  </div>

                  {/* Event Bubble */}
                  <div
                    style={{
                      width: '45%',
                      background: 'var(--bg-surface-2)',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      textAlign: isHomeEvent ? 'right' : 'left',
                    }}
                  >
                    <p style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'flex', justifyContent: isHomeEvent ? 'flex-end' : 'flex-start', alignItems: 'center', gap: '0.375rem' }}>
                      {e.type === 'Goal' && '⚽'}
                      {e.type === 'Card' && (e.detail?.toLowerCase().includes('red') ? '🟥' : '🟨')}
                      {e.type === 'Subst' && '🔄'}
                      {e.player_name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                      {e.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
