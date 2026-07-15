'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '@/components/Providers';
import { createClient } from '@/lib/supabase/client';

interface FavoriteButtonProps {
  matchId?: string;
  teamId?: number;
  leagueId?: number;
}

export function FavoriteButton({ matchId, teamId, leagueId }: FavoriteButtonProps) {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setIsFavorited(false);
      return;
    }

    async function checkFavorite() {
      if (teamId) {
        const { data } = await supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', user!.id)
          .eq('team_id', teamId)
          .maybeSingle();
        setIsFavorited(!!data);
      } else if (leagueId) {
        const { data } = await supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', user!.id)
          .eq('league_id', leagueId)
          .maybeSingle();
        setIsFavorited(!!data);
      }
    }

    checkFavorite();
  }, [user, teamId, leagueId, supabase]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      alert('Please sign in to favorite leagues or teams.');
      return;
    }

    setLoading(true);
    try {
      if (isFavorited) {
        if (teamId) {
          await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('team_id', teamId);
        } else if (leagueId) {
          await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('league_id', leagueId);
        }
        setIsFavorited(false);
      } else {
        if (teamId) {
          await supabase
            .from('user_favorites')
            .insert({ user_id: user.id, team_id: teamId });
        } else if (leagueId) {
          await supabase
            .from('user_favorites')
            .insert({ user_id: user.id, league_id: leagueId });
        }
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`fav-btn${isFavorited ? ' active' : ''}`}
      onClick={toggleFavorite}
      disabled={loading}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star
        size={14}
        fill={isFavorited ? 'var(--accent-amber)' : 'none'}
        stroke={isFavorited ? 'var(--accent-amber)' : 'currentColor'}
      />
    </button>
  );
}
