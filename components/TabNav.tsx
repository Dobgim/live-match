'use client';

interface TabNavProps {
  liveCount: number;
  todayCount: number;
  tomorrowCount: number;
  trendingCount: number;
}

export function TabNav({ liveCount, todayCount, tomorrowCount, trendingCount }: TabNavProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const tabs = [
    { id: 'live',      label: '🔴 Live',      count: liveCount,     isLive: true  },
    { id: 'today',     label: '📅 Today',      count: todayCount,    isLive: false },
    { id: 'tomorrow',  label: '📆 Tomorrow',   count: tomorrowCount, isLive: false },
    { id: 'trending',  label: '🔥 Trending',   count: trendingCount, isLive: false },
  ];

  return (
    <nav
      className="tab-nav"
      role="navigation"
      aria-label="Match sections"
      style={{ marginBottom: '1.5rem' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn${tab.isLive && tab.count > 0 ? ' live active' : ''}`}
          onClick={() => scrollTo(tab.id)}
          aria-label={`Go to ${tab.label} section`}
        >
          {tab.label}
          {tab.count > 0 && (
            <span className="tab-count">{tab.count}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
