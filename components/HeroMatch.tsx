'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Match } from '@/lib/types';
import { isLive, getStatusLabel } from '@/lib/ranking';
import { WatchButton } from './WatchButton';
import { format } from 'date-fns';
import { Trophy } from 'lucide-react';

interface HeroMatchProps {
  match: Match;
}

export function HeroMatch({ match }: HeroMatchProps) {
  const live = isLive(match.status);
  const kickoff = new Date(match.kickoff_utc);
  const [homeImgError, setHomeImgError] = useState(false);
  const [awayImgError, setAwayImgError] = useState(false);

  return (
    <div className="hero-match">
      {/* Badge */}
      <div className="hero-badge">
        <Trophy size={10} />
        {live ? '🔴 LIVE NOW — Featured Match' : '⭐ Top Match Today'}
      </div>

      {/* League */}
      <p
        style={{
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
        }}
      >
        {match.league?.logo_url && (
          <Image
            src={match.league.logo_url}
            alt={match.league.name ?? ''}
            width={16}
            height={16}
            style={{ objectFit: 'contain' }}
            unoptimized
          />
        )}
        {match.league?.name}
        {match.round && <span style={{ color: 'var(--text-muted)' }}>· {match.round}</span>}
      </p>

      {/* Teams + Score */}
      <div className="hero-teams">
        {/* Home */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '8px', display: 'inline-flex' }}>
            {match.home_team?.logo_url && !homeImgError ? (
              <Image
                src={match.home_team.logo_url}
                alt={match.home_team.name}
                width={64}
                height={64}
                className="hero-team-logo"
                onError={() => setHomeImgError(true)}
                unoptimized
              />
            ) : (
              <span style={{ fontSize: '3rem', lineHeight: 1 }}>🏠</span>
            )}
          </div>
          <p className="hero-team-name">
            {match.home_team?.name ?? 'Home Team'}
          </p>
        </div>

        {/* Score / Time */}
        <div style={{ textAlign: 'center' }}>
          {live || match.home_score !== null ? (
            <>
              <div className="hero-score">
                {match.home_score ?? 0} – {match.away_score ?? 0}
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: live ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.2)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: live ? 'var(--accent-red)' : 'var(--text-muted)',
                  marginTop: '0.5rem',
                }}
              >
                {live && <span className="live-dot" />}
                {getStatusLabel(match)}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                {format(kickoff, 'HH:mm')}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {format(kickoff, 'EEE d MMM')}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent-blue)',
                  marginTop: '0.5rem',
                  fontWeight: 600,
                }}
              >
                KO {format(kickoff, 'HH:mm')} UTC
              </div>
            </>
          )}
        </div>

        {/* Away */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '8px', display: 'inline-flex' }}>
            {match.away_team?.logo_url && !awayImgError ? (
              <Image
                src={match.away_team.logo_url}
                alt={match.away_team.name}
                width={64}
                height={64}
                className="hero-team-logo"
                onError={() => setAwayImgError(true)}
                unoptimized
              />
            ) : (
              <span style={{ fontSize: '3rem', lineHeight: 1 }}>✈️</span>
            )}
          </div>
          <p className="hero-team-name" style={{ textAlign: 'right' }}>
            {match.away_team?.name ?? 'Away Team'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border)',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {match.venue_name && `📍 ${match.venue_name}`}
          {match.venue_city && `, ${match.venue_city}`}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link
            href={`/match/${match.external_id}`}
            className="btn btn-ghost"
            style={{ fontSize: '0.8125rem' }}
          >
            Match Details
          </Link>
          <WatchButton match={match} />
        </div>
      </div>
    </div>
  );
}
