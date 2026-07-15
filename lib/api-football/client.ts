import { ApiFootballFixture } from '@/lib/types';

const BASE_URL = 'https://api-football-v1.p.rapidapi.com/v3';

const headers = {
  'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
  'X-RapidAPI-Host': process.env.RAPIDAPI_HOST ?? 'api-football-v1.p.rapidapi.com',
};

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers,
    next: { revalidate: 0 }, // never cache raw API calls — caching is done in DB
  });

  if (!res.ok) {
    throw new Error(`API-Football error ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  return json.response as T;
}

/** Fetch all fixtures for a specific date (YYYY-MM-DD) */
export async function fetchFixturesByDate(date: string): Promise<ApiFootballFixture[]> {
  return apiFetch<ApiFootballFixture[]>('/fixtures', { date, timezone: 'UTC' });
}

/** Fetch fixtures for specific league + season */
export async function fetchFixturesByLeague(
  leagueId: number,
  season: number,
  from: string,
  to: string
): Promise<ApiFootballFixture[]> {
  return apiFetch<ApiFootballFixture[]>('/fixtures', {
    league: leagueId.toString(),
    season: season.toString(),
    from,
    to,
    timezone: 'UTC',
  });
}

/** Fetch all currently LIVE fixtures */
export async function fetchLiveFixtures(): Promise<ApiFootballFixture[]> {
  return apiFetch<ApiFootballFixture[]>('/fixtures', { live: 'all' });
}

/** Fetch a single fixture by its API-Football ID (includes events) */
export async function fetchFixtureById(fixtureId: number): Promise<ApiFootballFixture | null> {
  const results = await apiFetch<ApiFootballFixture[]>('/fixtures', {
    id: fixtureId.toString(),
  });
  return results[0] ?? null;
}

/** Priority leagues we sync for (API-Football IDs) */
export const PRIORITY_LEAGUES = [
  { id: 39,  name: 'Premier League',    season: 2024 },
  { id: 140, name: 'La Liga',           season: 2024 },
  { id: 2,   name: 'Champions League',  season: 2024 },
  { id: 78,  name: 'Bundesliga',        season: 2024 },
  { id: 135, name: 'Serie A',           season: 2024 },
  { id: 61,  name: 'Ligue 1',           season: 2024 },
  { id: 6,   name: 'AFCON',             season: 2025 },
  { id: 1,   name: 'World Cup',         season: 2026 },
];
