'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth, useDataSaver } from '@/components/Providers';
import { Menu, X, Zap, User, LogOut, Star } from 'lucide-react';

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const { dataSaver, toggleDataSaver } = useDataSaver();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container">
        <div className="header-inner">
          {/* Logo */}
          <Link href="/" className="logo">
            <span className="logo-icon">⚽</span>
            <span className="logo-text">GoalStream</span>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Data Saver Toggle */}
            <button
              onClick={toggleDataSaver}
              className="btn btn-ghost"
              title={dataSaver ? 'Data Saver ON' : 'Data Saver OFF'}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.75rem',
                gap: '0.375rem',
                borderColor: dataSaver ? 'rgba(0,220,130,0.4)' : undefined,
                color: dataSaver ? 'var(--accent-green)' : undefined,
              }}
            >
              <Zap size={14} />
              <span className="hide-mobile">{dataSaver ? 'Data Saver ON' : 'Data Saver'}</span>
            </button>

            {/* Auth */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link href="/favorites" className="btn btn-ghost" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                  <Star size={14} />
                  <span className="hide-mobile">Favorites</span>
                </Link>
                <button
                  onClick={signOut}
                  className="btn btn-ghost"
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                >
                  <LogOut size={14} />
                  <span className="hide-mobile">Sign Out</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link href="/auth/login" className="btn btn-ghost" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem' }}>
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn btn-primary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem' }}>
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>

      <style>{`
        .hide-mobile { display: none; }
        @media (min-width: 640px) { .hide-mobile { display: inline; } }
      `}</style>
    </header>
  );
}
