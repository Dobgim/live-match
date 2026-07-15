'use client';

import { useState } from 'react';
import { Match } from '@/lib/types';
import { MatchCard } from './MatchCard';
import { MatchCardSkeleton } from './MatchCardSkeleton';
import { useRealtimeMatches } from '@/hooks/useRealtimeMatches';

interface MatchesSectionProps {
  id: string;
  title: string;
  matches: Match[];
  emptyMessage: string;
  emptyIcon: string;
  isLiveSection?: boolean;
}

export function MatchesSection({
  id,
  title,
  matches: initialMatches,
  emptyMessage,
  emptyIcon,
  isLiveSection = false,
}: MatchesSectionProps) {
  // Subscribe to realtime updates for live sections
  const matches = useRealtimeMatches(initialMatches, isLiveSection);
  const [expanded, setExpanded] = useState(false);

  const INITIAL_SHOW = 6;
  const displayMatches = expanded ? matches : matches.slice(0, INITIAL_SHOW);
  const hasMore = matches.length > INITIAL_SHOW;

  return (
    <section
      id={id}
      className="matches-section"
      style={{ scrollMarginTop: '80px' }}
    >
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <span className="section-count">
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
        </span>
      </div>

      {matches.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">{emptyIcon}</span>
          <p className="empty-state-title">{emptyMessage}</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Check back soon — fixtures update daily at 2:00 AM UTC
          </p>
        </div>
      ) : (
        <>
          <div className="matches-grid">
            {displayMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={() => setExpanded(!expanded)}
                className="btn btn-ghost"
              >
                {expanded
                  ? 'Show less'
                  : `Show all ${matches.length} matches`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
