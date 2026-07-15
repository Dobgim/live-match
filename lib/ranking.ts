import { Match, MatchStatus, LiveStatus } from '@/lib/types';

export const LIVE_STATUSES: LiveStatus[] = ['1H', '2H', 'ET', 'P', 'HT'];
export const FINISHED_STATUSES: MatchStatus[] = ['FT', 'AET', 'PEN', 'AWD', 'WO'];

/** Returns true if match is currently live (in play or HT) */
export function isLive(status: MatchStatus): boolean {
  return (LIVE_STATUSES as string[]).includes(status);
}

/** Returns true if match is finished */
export function isFinished(status: MatchStatus): boolean {
  return (FINISHED_STATUSES as string[]).includes(status);
}

/** Returns true if match hasn't started yet */
export function isUpcoming(status: MatchStatus): boolean {
  return status === 'NS';
}

/**
 * Computes a popularity score for client-side sorting.
 * Higher = more prominent in the list.
 */
export function computePopularityScore(match: Match): number {
  const now = Date.now();
  const kickoff = new Date(match.kickoff_utc).getTime();
  const msUntilKickoff = kickoff - now;

  let score = 0;

  // Live matches are always top
  if (isLive(match.status)) score += 10000;

  // Kickoff within 3 hours
  if (isUpcoming(match.status) && msUntilKickoff > 0 && msUntilKickoff < 3 * 60 * 60 * 1000) {
    score += 500;
  }
  // Kickoff within 24 hours
  else if (isUpcoming(match.status) && msUntilKickoff > 0 && msUntilKickoff < 24 * 60 * 60 * 1000) {
    score += 100;
  }

  // League priority (set in DB)
  score += (match.league?.priority ?? 0) * 50;

  // View count (log scale to prevent outlier domination)
  score += Math.log1p(match.view_count) * 10;

  // Featured flag
  if (match.is_featured) score += 200;

  return score;
}

/**
 * Sorts an array of matches by popularity score descending
 */
export function sortByPopularity(matches: Match[]): Match[] {
  return [...matches].sort(
    (a, b) => (b.popularity_score ?? 0) - (a.popularity_score ?? 0)
  );
}

/**
 * Filters matches for the Today tab (UTC day)
 */
export function filterToday(matches: Match[]): Match[] {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  return matches.filter((m) => m.kickoff_utc.startsWith(todayStr));
}

/**
 * Filters matches for Tomorrow tab
 */
export function filterTomorrow(matches: Match[]): Match[] {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  return matches.filter((m) => m.kickoff_utc.startsWith(tomorrowStr));
}

/**
 * Filters live matches only
 */
export function filterLive(matches: Match[]): Match[] {
  return matches.filter((m) => isLive(m.status));
}

/** Returns a human-friendly status label */
export function getStatusLabel(match: Match): string {
  switch (match.status) {
    case '1H': return `${match.elapsed ?? ''}' 1st Half`;
    case '2H': return `${match.elapsed ?? ''}' 2nd Half`;
    case 'HT': return 'Half Time';
    case 'ET': return `${match.elapsed ?? ''}' Extra Time`;
    case 'P':  return 'Penalties';
    case 'FT': return 'Full Time';
    case 'AET': return 'AET';
    case 'PEN': return 'Penalties';
    case 'NS': return 'Upcoming';
    case 'CANC': return 'Cancelled';
    case 'PST': return 'Postponed';
    default: return match.status;
  }
}

/** Returns hex color for status badge */
export function getStatusColor(status: MatchStatus): string {
  if (isLive(status)) return '#ef4444'; // red
  if (isFinished(status)) return '#64748b'; // muted
  if (status === 'CANC' || status === 'PST') return '#f59e0b'; // amber
  return '#3b82f6'; // blue (upcoming)
}
