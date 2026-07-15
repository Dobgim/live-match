# ⚽ GoalStream — Live Football Scores & Fixtures

A mobile-first, performance-optimized, and dark-theme football score application. Build with Next.js 14 App Router, Supabase, and API-Football. Features realtime live scores, personalized favorite lists, low-data saver mode, and legal streaming recommendations.

---

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Vanilla CSS design system, SWR
- **Backend/Database**: Supabase PostgreSQL, Supabase Auth
- **Realtime**: Supabase Realtime (WebSockets)
- **Background Jobs**: Supabase Edge Functions + `pg_cron`

---

## 📦 Features

1. **Today's matches, Tomorrow's fixtures, and Trending list**: Automatically grouped and sort-ordered using popularity scoring algorithms.
2. **Automated Daily Syncing & Live Polling**: Syncs matches once daily, and polls live updates every 2 minutes during active match windows only (preserving API limits).
3. **Flexible Filters**: Filter by League, Country, and live status.
4. **Data Saver Mode**: Text-only match cards, no images, disabled animations, and adjusted polling rates.
5. **Legally Licensed Streaming**: Shows official broadcasters per league (e.g. beIN Sports, SuperSport, Amazon Prime Video) with region specifications.

---

## 🔧 Setup & Installation

### 1. Configure Local Environment Variables
Rename `.env.example` to `.env.local` and configure your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=api-football-v1.p.rapidapi.com

CRON_SECRET=some_random_secret_string
```

### 2. Configure Database & Functions
Follow the database setup guide inside:
[Supabase Setup Guide](file:///c:/Users/Dobgima%20Joshua/Desktop/watch%20live%20match/supabase/migrations/001_initial_schema.sql)

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Build Production Bundle
```bash
npm run build
```
