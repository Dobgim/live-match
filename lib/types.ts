// ─── Shared TypeScript Types ────────────────────────────────────

export type MatchStatus =
  | 'NS'   // Not Started
  | '1H'   // First Half
  | 'HT'   // Half Time
  | '2H'   // Second Half
  | 'ET'   // Extra Time
  | 'P'    // Penalty
  | 'FT'   // Full Time
  | 'AET'  // After Extra Time
  | 'PEN'  // Penalty Shootout (finished)
  | 'CANC' // Cancelled
  | 'PST'  // Postponed
  | 'INT'  // Interrupted
  | 'ABD'  // Abandoned
  | 'AWD'  // Technical Loss
  | 'WO';  // WalkOver

export type LiveStatus = '1H' | 'HT' | '2H' | 'ET' | 'P';

export interface League {
  id: number;
  name: string;
  country: string;
  country_code: string | null;
  logo_url: string | null;
  type: string;
  is_featured: boolean;
  priority: number;
}

export interface Team {
  id: number;
  name: string;
  short_name: string | null;
  logo_url: string | null;
  country: string | null;
}

export interface Match {
  id: string;
  external_id: number;
  league_id: number;
  home_team_id: number;
  away_team_id: number;
  kickoff_utc: string;
  status: MatchStatus;
  elapsed: number | null;
  home_score: number | null;
  away_score: number | null;
  home_ht_score: number | null;
  away_ht_score: number | null;
  venue_name: string | null;
  venue_city: string | null;
  round: string | null;
  season: number | null;
  view_count: number;
  popularity_score: number;
  is_featured: boolean;
  stream_url: string | null;
  stream_source: string | null;
  last_synced_at: string;
  updated_at?: string;
  // Joined from related tables:
  league?: League;
  home_team?: Team;
  away_team?: Team;
  events?: MatchEvent[];
}

export interface MatchEvent {
  id: string;
  match_id: string;
  type: 'Goal' | 'Card' | 'Subst' | 'Var';
  detail: string | null;
  team_id: number | null;
  player_name: string | null;
  elapsed: number | null;
}

export interface MatchFilters {
  tab: 'live' | 'today' | 'tomorrow' | 'trending';
  league_id?: number;
  country?: string;
  date?: string; // ISO date string YYYY-MM-DD
  live_only?: boolean;
}

export interface ApiFootballFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: { first: number | null; second: number | null };
    venue: { id: number | null; name: string | null; city: string | null };
    status: { long: string; short: string; elapsed: number | null };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
  events?: Array<{
    time: { elapsed: number; extra: number | null };
    team: { id: number; name: string; logo: string };
    player: { id: number; name: string };
    assist: { id: number | null; name: string | null };
    type: string;
    detail: string;
    comments: string | null;
  }>;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  team_id?: number;
  league_id?: number;
  created_at: string;
}

export interface SyncLog {
  id: string;
  job_name: string;
  status: 'running' | 'success' | 'error';
  matches_synced: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface StreamSource {
  name: string;
  url: string;
  logo?: string;
  is_free: boolean;
  region?: string; // e.g. "Africa", "Europe", "Global"
}

// Streaming broadcaster map per league
export const LEAGUE_STREAM_SOURCES: Record<number, StreamSource[]> = {
  // Premier League
  39: [
    { name: 'Amazon Prime Video', url: 'https://www.amazon.co.uk/gp/video/storefront', is_free: false, region: 'UK' },
    { name: 'Sky Sports', url: 'https://www.skysports.com/football', is_free: false, region: 'UK' },
    { name: 'NBC Sports', url: 'https://www.nbcsports.com/soccer', is_free: false, region: 'US' },
  ],
  // La Liga
  140: [
    { name: 'ESPN+', url: 'https://www.espnplus.com', is_free: false, region: 'US' },
    { name: 'beIN Sports', url: 'https://www.beinsports.com', is_free: false, region: 'MENA/Africa' },
  ],
  // Champions League
  2: [
    { name: 'CBS Sports Golazo', url: 'https://www.paramount.com/networks/cbs-sports-golazo', is_free: true, region: 'US' },
    { name: 'DAZN', url: 'https://www.dazn.com', is_free: false, region: 'Europe' },
    { name: 'beIN Sports', url: 'https://www.beinsports.com', is_free: false, region: 'MENA/Africa' },
  ],
  // Bundesliga
  78: [
    { name: 'DAZN', url: 'https://www.dazn.com', is_free: false, region: 'Global' },
    { name: 'ESPN+', url: 'https://www.espnplus.com', is_free: false, region: 'US' },
  ],
  // Serie A
  135: [
    { name: 'Paramount+', url: 'https://www.paramountplus.com', is_free: false, region: 'US' },
    { name: 'DAZN', url: 'https://www.dazn.com', is_free: false, region: 'Italy' },
  ],
  // Ligue 1
  61: [
    { name: "beIN Sports", url: 'https://www.beinsports.com', is_free: false, region: 'Global' },
    { name: 'DAZN', url: 'https://www.dazn.com', is_free: false, region: 'Europe' },
  ],
  // AFCON (id: 6)
  6: [
    { name: 'beIN Sports', url: 'https://www.beinsports.com', is_free: false, region: 'Africa/MENA' },
    { name: 'SuperSport', url: 'https://supersport.com', is_free: false, region: 'Africa' },
    { name: 'CAF TV (YouTube)', url: 'https://www.youtube.com/@caf_online', is_free: true, region: 'Global' },
  ],
  // FIFA World Cup (id: 1)
  1: [
    { name: 'FIFA+ (Free)', url: 'https://www.fifa.com/fifaplus', is_free: true, region: 'Global' },
    { name: 'ITV (Free)', url: 'https://www.itv.com/sport/football', is_free: true, region: 'UK' },
    { name: 'SuperSport', url: 'https://supersport.com', is_free: false, region: 'Africa' },
  ],
};
