-- ================================================================
-- Football Live App — Complete Database Schema
-- Run this in Supabase SQL Editor
-- ================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net";   -- for HTTP calls from pg_cron
CREATE EXTENSION IF NOT EXISTS "pg_cron";  -- for scheduled jobs

-- ================================================================
-- LEAGUES TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS leagues (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  country       TEXT NOT NULL DEFAULT '',
  country_code  TEXT,
  logo_url      TEXT,
  type          TEXT DEFAULT 'League',
  is_featured   BOOLEAN DEFAULT false,
  priority      INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TEAMS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS teams (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  short_name TEXT,
  logo_url   TEXT,
  country    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- MATCHES TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS matches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id      INTEGER UNIQUE NOT NULL,
  league_id        INTEGER REFERENCES leagues(id) ON DELETE SET NULL,
  home_team_id     INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  away_team_id     INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  kickoff_utc      TIMESTAMPTZ NOT NULL,
  status           TEXT NOT NULL DEFAULT 'NS',
  elapsed          INTEGER,
  home_score       INTEGER,
  away_score       INTEGER,
  home_ht_score    INTEGER,
  away_ht_score    INTEGER,
  venue_name       TEXT,
  venue_city       TEXT,
  round            TEXT,
  season           INTEGER,
  view_count       INTEGER DEFAULT 0,
  popularity_score FLOAT DEFAULT 0,
  is_featured      BOOLEAN DEFAULT false,
  stream_url       TEXT,
  stream_source    TEXT,
  last_synced_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_kickoff    ON matches(kickoff_utc);
CREATE INDEX IF NOT EXISTS idx_matches_status     ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_league     ON matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_featured   ON matches(is_featured);
CREATE INDEX IF NOT EXISTS idx_matches_popularity ON matches(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_external   ON matches(external_id);

-- ================================================================
-- MATCH_EVENTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS match_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID REFERENCES matches(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  detail      TEXT,
  team_id     INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  player_name TEXT,
  elapsed     INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_match ON match_events(match_id);

-- ================================================================
-- USER FAVORITES TABLE (requires Supabase Auth)
-- ================================================================
CREATE TABLE IF NOT EXISTS user_favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id    INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  league_id  INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ufav_team_or_league CHECK (
    (team_id IS NOT NULL AND league_id IS NULL) OR
    (team_id IS NULL AND league_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ufav_team
  ON user_favorites(user_id, team_id) WHERE team_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ufav_league
  ON user_favorites(user_id, league_id) WHERE league_id IS NOT NULL;

-- ================================================================
-- USER ALERTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS user_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id    UUID REFERENCES matches(id) ON DELETE CASCADE,
  alert_type  TEXT NOT NULL DEFAULT 'kickoff', -- kickoff | goal | fulltime
  sent        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- SYNC_LOG TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS sync_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name       TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'running',
  matches_synced INTEGER DEFAULT 0,
  error_message  TEXT,
  started_at     TIMESTAMPTZ DEFAULT NOW(),
  completed_at   TIMESTAMPTZ
);

-- ================================================================
-- POPULARITY SCORE TRIGGER
-- ================================================================
CREATE OR REPLACE FUNCTION update_match_popularity()
RETURNS TRIGGER AS $$
DECLARE
  v_priority INTEGER;
  live_bonus FLOAT := 0;
  time_bonus FLOAT := 0;
  score FLOAT;
BEGIN
  SELECT COALESCE(priority, 0) INTO v_priority
  FROM leagues WHERE id = NEW.league_id;

  IF NEW.status IN ('1H', '2H', 'ET', 'P', 'HT') THEN
    live_bonus := 10000;
  END IF;

  IF NEW.kickoff_utc > NOW() AND NEW.kickoff_utc < NOW() + INTERVAL '3 hours' THEN
    time_bonus := 500;
  ELSIF NEW.kickoff_utc > NOW() AND NEW.kickoff_utc < NOW() + INTERVAL '24 hours' THEN
    time_bonus := 100;
  END IF;

  score := live_bonus
    + (v_priority * 50)
    + (LN(1 + NEW.view_count) * 10)
    + time_bonus
    + CASE WHEN NEW.is_featured THEN 200 ELSE 0 END;

  NEW.popularity_score := score;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_match_popularity ON matches;
CREATE TRIGGER trg_match_popularity
  BEFORE INSERT OR UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_match_popularity();

-- ================================================================
-- INCREMENT VIEW COUNT FUNCTION (called from frontend)
-- ================================================================
CREATE OR REPLACE FUNCTION increment_view_count(p_match_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE matches SET view_count = view_count + 1 WHERE id = p_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- REALTIME
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_events;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE leagues       ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams         ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts   ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read leagues"   ON leagues       FOR SELECT USING (true);
CREATE POLICY "Public read teams"     ON teams         FOR SELECT USING (true);
CREATE POLICY "Public read matches"   ON matches       FOR SELECT USING (true);
CREATE POLICY "Public read events"    ON match_events  FOR SELECT USING (true);

-- User favorites (own rows only)
CREATE POLICY "Users manage own favorites" ON user_favorites
  FOR ALL USING (auth.uid() = user_id);

-- User alerts (own rows only)
CREATE POLICY "Users manage own alerts" ON user_alerts
  FOR ALL USING (auth.uid() = user_id);

-- ================================================================
-- SEED: Featured Leagues (priority order)
-- ================================================================
INSERT INTO leagues (id, name, country, country_code, priority, is_featured) VALUES
  (2,   'UEFA Champions League', 'Europe',   'EU',  10, true),
  (39,  'Premier League',        'England',  'GB',  9,  true),
  (140, 'La Liga',               'Spain',    'ES',  8,  true),
  (78,  'Bundesliga',            'Germany',  'DE',  7,  true),
  (135, 'Serie A',               'Italy',    'IT',  6,  true),
  (61,  'Ligue 1',               'France',   'FR',  5,  true),
  (1,   'FIFA World Cup',        'World',    'WW',  10, true),
  (6,   'AFCON',                 'Africa',   'AF',  7,  true)
ON CONFLICT (id) DO UPDATE SET
  priority    = EXCLUDED.priority,
  is_featured = EXCLUDED.is_featured;

-- ================================================================
-- CRON JOBS (run after enabling pg_cron)
-- Replace <PROJECT_REF> and <SERVICE_ROLE_KEY> with actual values
-- ================================================================
-- Daily fixture sync at 02:00 UTC
-- SELECT cron.schedule(
--   'daily-fixture-sync',
--   '0 2 * * *',
--   $$SELECT net.http_post(
--     url := 'https://<PROJECT_REF>.supabase.co/functions/v1/sync-fixtures',
--     headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb,
--     body := '{}'::jsonb
--   );$$
-- );
--
-- Live score poll every 2 minutes
-- SELECT cron.schedule(
--   'live-score-poll',
--   '*/2 * * * *',
--   $$SELECT net.http_post(
--     url := 'https://<PROJECT_REF>.supabase.co/functions/v1/live-poll',
--     headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb,
--     body := '{}'::jsonb
--   );$$
-- );
