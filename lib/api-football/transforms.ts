import { ApiFootballFixture } from '@/lib/types';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Transforms an API-Football fixture object into our database row format
 */
export function transformFixture(f: ApiFootballFixture) {
  return {
    external_id: f.fixture.id,
    league_id: f.league.id,
    home_team_id: f.teams.home.id,
    away_team_id: f.teams.away.id,
    kickoff_utc: f.fixture.date,
    status: f.fixture.status.short,
    elapsed: f.fixture.status.elapsed,
    home_score: f.goals.home,
    away_score: f.goals.away,
    home_ht_score: f.score.halftime.home,
    away_ht_score: f.score.halftime.away,
    venue_name: f.fixture.venue.name,
    venue_city: f.fixture.venue.city,
    round: f.league.round,
    season: f.league.season,
    last_synced_at: new Date().toISOString(),
  };
}

/**
 * Transforms API-Football team data into our teams table format
 */
export function transformTeam(team: ApiFootballFixture['teams']['home'] | ApiFootballFixture['teams']['away'], country?: string) {
  return {
    id: team.id,
    name: team.name,
    logo_url: team.logo,
    country: country ?? null,
  };
}

/**
 * Transforms API-Football league data into our leagues table format
 */
export function transformLeague(league: ApiFootballFixture['league']) {
  return {
    id: league.id,
    name: league.name,
    country: league.country,
    logo_url: league.logo,
  };
}

/**
 * Upserts teams from fixture batch into Supabase
 */
export async function upsertTeams(
  supabase: SupabaseClient,
  fixtures: ApiFootballFixture[]
) {
  const teamsMap = new Map<number, ReturnType<typeof transformTeam>>();
  for (const f of fixtures) {
    teamsMap.set(f.teams.home.id, transformTeam(f.teams.home, f.league.country));
    teamsMap.set(f.teams.away.id, transformTeam(f.teams.away, f.league.country));
  }
  const teams = Array.from(teamsMap.values());
  if (teams.length === 0) return;

  const { error } = await supabase
    .from('teams')
    .upsert(teams, { onConflict: 'id', ignoreDuplicates: false });

  if (error) throw new Error(`upsertTeams: ${error.message}`);
}

/**
 * Upserts leagues from fixture batch into Supabase
 */
export async function upsertLeagues(
  supabase: SupabaseClient,
  fixtures: ApiFootballFixture[]
) {
  const leagueMap = new Map<number, ReturnType<typeof transformLeague>>();
  for (const f of fixtures) {
    leagueMap.set(f.league.id, transformLeague(f.league));
  }
  const leagues = Array.from(leagueMap.values());
  if (leagues.length === 0) return;

  const { error } = await supabase
    .from('leagues')
    .upsert(leagues, { onConflict: 'id', ignoreDuplicates: false });

  if (error) throw new Error(`upsertLeagues: ${error.message}`);
}

/**
 * Upserts matches from fixture batch into Supabase
 */
export async function upsertMatches(
  supabase: SupabaseClient,
  fixtures: ApiFootballFixture[]
): Promise<number> {
  const matches = fixtures.map(transformFixture);
  if (matches.length === 0) return 0;

  const { error } = await supabase
    .from('matches')
    .upsert(matches, { onConflict: 'external_id', ignoreDuplicates: false });

  if (error) throw new Error(`upsertMatches: ${error.message}`);
  return matches.length;
}

/**
 * Upserts match events (goals, cards) into Supabase
 */
export async function upsertMatchEvents(
  supabase: SupabaseClient,
  matchDbId: string,
  fixture: ApiFootballFixture
) {
  if (!fixture.events || fixture.events.length === 0) return;

  // First get the match id
  const events = fixture.events.map((e) => ({
    match_id: matchDbId,
    type: e.type,
    detail: e.detail,
    team_id: e.team.id,
    player_name: e.player.name,
    elapsed: e.time.elapsed,
  }));

  // Delete existing events for this match and re-insert
  await supabase.from('match_events').delete().eq('match_id', matchDbId);
  const { error } = await supabase.from('match_events').insert(events);
  if (error) throw new Error(`upsertMatchEvents: ${error.message}`);
}
