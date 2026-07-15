import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'GoalStream — Live Football Scores & Fixtures',
  description:
    'Watch live football scores, upcoming fixtures, and trending matches from Premier League, La Liga, Champions League, Bundesliga, Serie A, Ligue 1, AFCON, and the World Cup. Updated in real-time.',
  keywords: [
    'live football', 'live scores', 'football fixtures', 'Premier League',
    'Champions League', 'AFCON', 'World Cup', 'La Liga', 'Bundesliga',
  ],
  openGraph: {
    title: 'GoalStream — Live Football Scores & Fixtures',
    description: 'Real-time football scores and fixtures from the world\'s top leagues.',
    type: 'website',
    siteName: 'GoalStream',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoalStream — Live Football Scores',
    description: 'Real-time football scores from Premier League, Champions League, AFCON & more.',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080C18',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <SiteHeader />
          <main className="container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
