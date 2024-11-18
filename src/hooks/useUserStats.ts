import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserGameStats } from '../types/stats';

export const useUserStats = (userId: string | undefined) => {
  const [userStats, setUserStats] = useState<UserGameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserStats = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const userStatsRef = doc(db, 'userStats', userId);
      const userStatsDoc = await getDoc(userStatsRef);
      
      if (userStatsDoc.exists()) {
        setUserStats(userStatsDoc.data() as UserGameStats);
      } else {
        // Return default stats structure
        setUserStats({
          stats: {
            addition: {
              totalGames: 0,
              perfectGames: 0,
              bestScore: 0,
              bestTime: null,
              totalCorrect: 0,
              averageTime: 0,
              lastPlayed: new Date()
            },
            subtraction: {
              totalGames: 0,
              perfectGames: 0,
              bestScore: 0,
              bestTime: null,
              totalCorrect: 0,
              averageTime: 0,
              lastPlayed: new Date()
            },
            multiplication: {
              totalGames: 0,
              perfectGames: 0,
              bestScore: 0,
              bestTime: null,
              totalCorrect: 0,
              averageTime: 0,
              lastPlayed: new Date()
            },
            division: {
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
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setError('Failed to load user stats');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, [userId]);

  const refreshStats = () => {
    fetchUserStats();
  };

  return { userStats, loading, error, refreshStats };
};