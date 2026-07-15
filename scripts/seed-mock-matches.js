const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local file not found. Please create one with Supabase credentials first.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[key] = val.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('Seeding mock teams...');

  const teams = [
    { id: 33, name: 'Manchester United', short_name: 'Man United', logo_url: 'https://media.api-sports.io/football/teams/33.png', country: 'England' },
    { id: 34, name: 'Newcastle', short_name: 'Newcastle', logo_url: 'https://media.api-sports.io/football/teams/34.png', country: 'England' },
    { id: 40, name: 'Liverpool', short_name: 'Liverpool', logo_url: 'https://media.api-sports.io/football/teams/40.png', country: 'England' },
    { id: 42, name: 'Arsenal', short_name: 'Arsenal', logo_url: 'https://media.api-sports.io/football/teams/42.png', country: 'England' },
    { id: 50, name: 'Manchester City', short_name: 'Man City', logo_url: 'https://media.api-sports.io/football/teams/50.png', country: 'England' },
    { id: 529, name: 'Barcelona', short_name: 'Barcelona', logo_url: 'https://media.api-sports.io/football/teams/529.png', country: 'Spain' },
    { id: 541, name: 'Real Madrid', short_name: 'Real Madrid', logo_url: 'https://media.api-sports.io/football/teams/541.png', country: 'Spain' },
    { id: 157, name: 'Bayern Munich', short_name: 'Bayern', logo_url: 'https://media.api-sports.io/football/teams/157.png', country: 'Germany' },
    { id: 85, name: 'Paris Saint Germain', short_name: 'PSG', logo_url: 'https://media.api-sports.io/football/teams/85.png', country: 'France' },
    { id: 1530, name: 'Cameroon', short_name: 'Cameroon', logo_url: 'https://media.api-sports.io/football/teams/1530.png', country: 'Cameroon' },
    { id: 1503, name: 'Egypt', short_name: 'Egypt', logo_url: 'https://media.api-sports.io/football/teams/1503.png', country: 'Egypt' },
  ];

  const { error: teamError } = await supabase.from('teams').upsert(teams);
  if (teamError) {
    console.error('Error seeding teams:', teamError.message);
    return;
  }
  console.log('Successfully seeded teams!');

  console.log('Seeding mock matches...');

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const matches = [
    // Live Match 1
    {
      external_id: 100001,
      league_id: 39,
      home_team_id: 33,
      away_team_id: 50,
      kickoff_utc: today.toISOString(),
      status: '1H',
      elapsed: 38,
      home_score: 2,
      away_score: 1,
      home_ht_score: null,
      away_ht_score: null,
      venue_name: 'Old Trafford',
      venue_city: 'Manchester',
      round: 'Regular Season - 20',
      season: 2024,
      is_featured: true,
      view_count: 1420,
    },
    // Live Match 2
    {
      external_id: 100002,
      league_id: 140,
      home_team_id: 541,
      away_team_id: 529,
      kickoff_utc: today.toISOString(),
      status: 'HT',
      elapsed: 45,
      home_score: 0,
      away_score: 0,
      home_ht_score: 0,
      away_ht_score: 0,
      venue_name: 'Santiago Bernabéu',
      venue_city: 'Madrid',
      round: 'Regular Season - 28',
      season: 2024,
      is_featured: true,
      view_count: 3200,
    },
    // Today Upcoming Match
    {
      external_id: 100003,
      league_id: 2,
      home_team_id: 40,
      away_team_id: 157,
      kickoff_utc: new Date(today.getTime() + 4 * 60 * 60 * 1000).toISOString(), // in 4 hours
      status: 'NS',
      elapsed: null,
      home_score: null,
      away_score: null,
      venue_name: 'Anfield',
      venue_city: 'Liverpool',
      round: 'Quarter-finals',
      season: 2024,
      is_featured: false,
      view_count: 850,
    },
    // Tomorrow Match 1
    {
      external_id: 100004,
      league_id: 6,
      home_team_id: 1530,
      away_team_id: 1503,
      kickoff_utc: new Date(tomorrow.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'NS',
      elapsed: null,
      home_score: null,
      away_score: null,
      venue_name: 'Stade Olembe',
      venue_city: 'Yaoundé',
      round: 'Group Stage - 2',
      season: 2025,
      is_featured: true,
      view_count: 1100,
    },
  ];

  const { error: matchError } = await supabase.from('matches').upsert(matches);
  if (matchError) {
    console.error('Error seeding matches:', matchError.message);
    return;
  }
  console.log('Successfully seeded mock matches!');
  console.log('Database populated! Refresh your website now to view matches.');
}

seed();
