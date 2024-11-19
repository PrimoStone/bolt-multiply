import { useState, useEffect, useContext } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { GameType, UserGameStats, UserProfile } from '../types/stats';
import { UserContext } from '../contexts/UserContext';

export const useUserStats = (userId: string | undefined, gameType: GameType) => {
  const [stats, setStats] = useState<UserGameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useContext(UserContext);

  const fetchUserStats = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const userStatsRef = doc(db, 'userStats', userId);
      const userStatsDoc = await getDoc(userStatsRef);
      
      // Use user data from context
      const userData = user ? {
        id: user.id,
        username: user.username || user.email?.split('@')[0] || 'User',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        photoURL: user.photoURL || null,
        email: user.email || null
      } : null;

      console.log('User data in useUserStats:', userData);
      
      if (userStatsDoc.exists()) {
        const statsData = userStatsDoc.data();
        console.log('Stats data from Firestore:', statsData);
        
        setStats({
          user: userData,
          stats: {
            ...statsData.stats,
            [gameType]: statsData.stats?.[gameType] || {
              totalGames: 0,
              perfectGames: 0,
              bestScore: 0,
              bestTime: null,
              totalCorrect: 0,
              averageTime: 0,
              lastPlayed: new Date()
            },
            overall: statsData.stats?.overall || {
              totalGames: 0,
              perfectGames: 0,
              bestScore: 0,
              bestTime: null,
              totalCorrect: 0,
              averageTime: 0,
              lastPlayed: new Date(),
              favoriteGame: null
            }
          }
        });
      } else {
        // Return default stats structure
        const defaultStats = {
          user: userData,
          stats: {
            [gameType]: {
              totalGames: 0,
              perfectGames: 0,
              bestScore: 0,
              bestTime: null,
              totalCorrect: 0,
              averageTime: 0,
              lastPlayed: new Date()
            },
            overall: {
              totalGames: 0,
              perfectGames: 0,
              bestScore: 0,
              bestTime: null,
              totalCorrect: 0,
              averageTime: 0,
              lastPlayed: new Date(),
              favoriteGame: null
            }
          }
        };
        console.log('Setting default stats:', defaultStats);
        setStats(defaultStats);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to load user stats'));
      setLoading(false);
    }
  };

  const refreshStats = () => {
    setLoading(true);
    fetchUserStats();
  };

  useEffect(() => {
    fetchUserStats();
  }, [userId, gameType]);

  return { stats, loading, error, refreshStats };
};