'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const LEAGUES = [
  { id: '',    name: 'All Leagues' },
  { id: '2',   name: 'Champions League' },
  { id: '39',  name: 'Premier League' },
  { id: '140', name: 'La Liga' },
  { id: '78',  name: 'Bundesliga' },
  { id: '135', name: 'Serie A' },
  { id: '61',  name: 'Ligue 1' },
  { id: '6',   name: 'AFCON' },
  { id: '1',   name: 'World Cup' },
];

const COUNTRIES = [
  { code: '', name: 'All Countries' },
  { code: 'Europe',  name: '🇪🇺 Europe' },
  { code: 'England', name: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England' },
  { code: 'Spain',   name: '🇪🇸 Spain' },
  { code: 'Germany', name: '🇩🇪 Germany' },
  { code: 'Italy',   name: '🇮🇹 Italy' },
  { code: 'France',  name: '🇫🇷 France' },
  { code: 'Africa',  name: '🌍 Africa' },
  { code: 'World',   name: '🌐 World' },
];

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [liveOnly, setLiveOnly] = useState(searchParams.get('live') === '1');
  const [league, setLeague] = useState(searchParams.get('league') ?? '');
  const [country, setCountry] = useState(searchParams.get('country') ?? '');

  const hasFilters = liveOnly || league !== '' || country !== '';

  const applyFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearAll = () => {
    setLiveOnly(false);
    setLeague('');
    setCountry('');
    router.push(pathname, { scroll: false });
  };

  return (
    <div className="filter-bar" role="search" aria-label="Filter matches">
      {/* Filter icon label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          color: 'var(--text-muted)',
          fontSize: '0.8125rem',
          flexShrink: 0,
        }}
      >
        <SlidersHorizontal size={14} />
        <span>Filter</span>
      </div>

      {/* Live Only toggle */}
      <button
        className={`filter-chip${liveOnly ? ' active' : ''}`}
        onClick={() => {
          const next = !liveOnly;
          setLiveOnly(next);
          applyFilter('live', next ? '1' : '');
        }}
        aria-pressed={liveOnly}
      >
        <span className={liveOnly ? 'live-dot' : ''} style={liveOnly ? {} : { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }} />
        Live Only
      </button>

      {/* League filter */}
      <select
        className="filter-select"
        value={league}
        onChange={(e) => {
          setLeague(e.target.value);
          applyFilter('league', e.target.value);
        }}
        aria-label="Filter by league"
      >
        {LEAGUES.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>

      {/* Country filter */}
      <select
        className="filter-select"
        value={country}
        onChange={(e) => {
          setCountry(e.target.value);
          applyFilter('country', e.target.value);
        }}
        aria-label="Filter by country"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Clear filters */}
      {hasFilters && (
        <button
          className="filter-chip"
          onClick={clearAll}
          style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--accent-red)' }}
        >
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  );
}
