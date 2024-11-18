import { useState, useEffect } from 'react';
import { getUserStats, getUserAchievements } from '../firebase/utils';
import { GameType, GameStats, Achievement } from '../types/stats';

interface GameStatsHook {
  loading: boolean;
  error: Error | null;
  stats: {
    [key in GameType]: GameStats;
  } & {
    overall: {
      totalGames: number;
      perfectGames: number;
      bestScore: number;
      bestTime: number | null;
      totalCorrect: number;
      averageTime: number;
      lastPlayed: Date;
      favoriteGame: GameType | null;
    };
  };
  achievements: Achievement[];
  refreshStats: () => Promise<void>;
}

export const useGameStats = (userId: string | undefined): GameStatsHook => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const fetchStats = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [userStats, userAchievements] = await Promise.all([
        getUserStats(userId),
        getUserAchievements(userId)
      ]);
      
      setStats(userStats);
      setAchievements(userAchievements);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userId]);

  return {
    loading,
    error,
    stats,
    achievements,
    refreshStats: fetchStats
  };
};
