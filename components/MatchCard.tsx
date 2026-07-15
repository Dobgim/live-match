'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Match } from '@/lib/types';
import { isLive, isFinished, getStatusLabel, getStatusColor } from '@/lib/ranking';
import { WatchButton } from './WatchButton';
import { FavoriteButton } from './FavoriteButton';
import { format, isToday, isTomorrow } from 'date-fns';
import { MapPin } from 'lucide-react';
import clsx from 'clsx';

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const live = isLive(match.status);
  const finished = isFinished(match.status);
  const kickoff = new Date(match.kickoff_utc);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const statusLabel = getStatusLabel(match);

  const kickoffLabel = isToday(kickoff)
    ? format(kickoff, 'HH:mm')
    : isTomorrow(kickoff)
    ? `Tomorrow ${format(kickoff, 'HH:mm')}`
    : format(kickoff, 'dd MMM HH:mm');

  const statusClass =
    match.status === 'HT' ? 'halftime'
    : live ? 'live'
    : finished ? 'finished'
    : match.status === 'CANC' || match.status === 'PST' ? 'cancelled'
    : 'upcoming';

  return (
    <article
      className={clsx('match-card', {
        'is-live': live,
        'is-featured': match.is_featured,
      })}
    >
      {/* Header row: League + Status */}
      <div className="match-card-header">
        <div className="league-info">
          {match.league?.logo_url && !imgErrors['league'] ? (
            <Image
              src={match.league.logo_url}
              alt={match.league.name ?? ''}
              width={18}
              height={18}
              className="league-logo"
              onError={() => setImgErrors((p) => ({ ...p, league: true }))}
              unoptimized
            />
          ) : (
            <div className="league-logo-placeholder">⚽</div>
          )}
          <span>{match.league?.name ?? 'League'}</span>
          {match.round && (
            <span style={{ color: 'var(--text-muted)' }}>· {match.round}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FavoriteButton matchId={match.id} leagueId={match.league_id} />
          <div className={`status-badge ${statusClass}`}>
            {live && <span className="live-dot" />}
            <span>{statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Teams + Score */}
      <Link href={`/match/${match.external_id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div className="match-teams">
          {/* Home team */}
          <div className="team-block home">
            <div className="team-logo-wrap">
              {match.home_team?.logo_url && !imgErrors['home'] ? (
                <Image
                  src={match.home_team.logo_url}
                  alt={match.home_team.name}
                  width={36}
                  height={36}
                  className="team-logo"
                  onError={() => setImgErrors((p) => ({ ...p, home: true }))}
                  unoptimized
                />
              ) : (
                <span style={{ fontSize: '1.25rem' }}>🏠</span>
              )}
            </div>
            <span className="team-name">
              {match.home_team?.short_name ?? match.home_team?.name ?? 'Home'}
            </span>
          </div>

          {/* Score / Time Center */}
          <div className="score-center">
            {live || finished ? (
              <>
                <div className="score-display">
                  <span>{match.home_score ?? 0}</span>
                  <span className="score-separator">-</span>
                  <span>{match.away_score ?? 0}</span>
                </div>
                {(match.home_ht_score !== null && match.away_ht_score !== null) && (
                  <span className="ht-score">
                    HT {match.home_ht_score}–{match.away_ht_score}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="kickoff-time">{kickoffLabel}</span>
                <span className="score-vs">vs</span>
              </>
            )}
          </div>

          {/* Away team */}
          <div className="team-block away">
            <div className="team-logo-wrap">
              {match.away_team?.logo_url && !imgErrors['away'] ? (
                <Image
                  src={match.away_team.logo_url}
                  alt={match.away_team.name}
                  width={36}
                  height={36}
                  className="team-logo"
                  onError={() => setImgErrors((p) => ({ ...p, away: true }))}
                  unoptimized
                />
              ) : (
                <span style={{ fontSize: '1.25rem' }}>✈️</span>
              )}
            </div>
            <span className="team-name">
              {match.away_team?.short_name ?? match.away_team?.name ?? 'Away'}
            </span>
          </div>
        </div>
      </Link>

      {/* Footer: Venue + Watch */}
      <div className="match-card-footer">
        <div className="venue-info">
          <MapPin size={12} />
          <span className="venue-text">
            {match.venue_name
              ? `${match.venue_name}${match.venue_city ? `, ${match.venue_city}` : ''}`
              : match.venue_city ?? 'Venue TBC'}
          </span>
        </div>
        <WatchButton match={match} />
      </div>
    </article>
  );
}
