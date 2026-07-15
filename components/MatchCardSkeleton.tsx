export function MatchCardSkeleton() {
  return (
    <div className="skeleton-card">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div className="skeleton skeleton-line" style={{ width: '120px' }} />
        <div className="skeleton skeleton-line" style={{ width: '50px' }} />
      </div>

      {/* Teams */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', flex: 1 }}>
          <div className="skeleton skeleton-circle" style={{ width: '44px', height: '44px' }} />
          <div className="skeleton skeleton-line" style={{ width: '80%', height: '14px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <div className="skeleton skeleton-line" style={{ width: '60px', height: '28px' }} />
          <div className="skeleton skeleton-line" style={{ width: '40px', height: '10px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flex: 1 }}>
          <div className="skeleton skeleton-circle" style={{ width: '44px', height: '44px' }} />
          <div className="skeleton skeleton-line" style={{ width: '80%', height: '14px' }} />
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div className="skeleton skeleton-line" style={{ width: '100px' }} />
        <div className="skeleton skeleton-line" style={{ width: '70px', height: '28px', borderRadius: '999px' }} />
      </div>
    </div>
  );
}

export function MatchesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="matches-grid">
      {Array.from({ length: count }).map((_, i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  );
}
