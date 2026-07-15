'use client';

import { useState } from 'react';
import { Match, LEAGUE_STREAM_SOURCES } from '@/lib/types';
import { isLive, isFinished } from '@/lib/ranking';
import { Tv, ExternalLink, X } from 'lucide-react';

interface WatchButtonProps {
  match: Match;
}

export function WatchButton({ match }: WatchButtonProps) {
  const [open, setOpen] = useState(false);
  const live = isLive(match.status);
  const finished = isFinished(match.status);

  // Get stream sources for this match's league
  const sources = match.league_id
    ? LEAGUE_STREAM_SOURCES[match.league_id] ?? []
    : [];

  // If match has an explicit licensed stream, use it directly
  if (match.stream_url) {
    return (
      <a
        href={match.stream_url}
        target="_blank"
        rel="noopener noreferrer"
        className="watch-btn"
        aria-label={`Watch ${match.home_team?.name} vs ${match.away_team?.name} on ${match.stream_source}`}
        onClick={(e) => e.stopPropagation()}
      >
        <Tv size={12} />
        WATCH
      </a>
    );
  }

  // If league has broadcasters, open modal
  if (sources.length > 0 && !finished) {
    return (
      <>
        <button
          className="watch-btn"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          aria-label="Find where to watch"
        >
          <Tv size={12} />
          WATCH
        </button>

        {open && (
          <div
            className="modal-backdrop"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Watch options"
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <h2 className="modal-title">Where to Watch</h2>
                  <p className="modal-subtitle">
                    {match.home_team?.name} vs {match.away_team?.name}
                    <br />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {match.league?.name} · Licensed streams only
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="btn btn-ghost"
                  style={{ padding: '0.375rem', flexShrink: 0 }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Stream list */}
              <div className="stream-list">
                {sources.map((source) => (
                  <a
                    key={source.name}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="stream-item"
                  >
                    <div>
                      <div className="stream-item-name">{source.name}</div>
                      {source.region && (
                        <div className="stream-item-region">
                          📍 Available in: {source.region}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={source.is_free ? 'free-badge' : 'paid-badge'}>
                        {source.is_free ? 'FREE' : 'SUBSCRIPTION'}
                      </span>
                      <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </a>
                ))}
              </div>

              <p
                style={{
                  marginTop: '1rem',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                }}
              >
                GoalStream only links to officially licensed broadcasters.
                <br />
                Availability may vary by region.
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // No stream available
  return (
    <div
      className="watch-btn no-stream"
      title="No licensed stream available"
    >
      <Tv size={12} />
      {finished ? 'Ended' : 'TBC'}
    </div>
  );
}
