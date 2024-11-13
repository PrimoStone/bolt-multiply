import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useUserStats = (userId: string | undefined) => {
  const [userStats, setUserStats] = useState({
    totalGames: 0,
    bestScore: 0,
    bestTime: 0,
    perfectGames: 0
  });

  const fetchUserStats = async () => {
    if (!userId) {
      console.log('No userId provided to useUserStats');
      return;
    }

    try {
      // Sprawdź, czy mamy dostęp do bazy
      console.log('DB reference:', db);
      console.log('Attempting to fetch stats for userId:', userId);

      // Pobierz referencję do kolekcji
      const statsRef = collection(db, 'stats');
      console.log('Collection reference created');

      // Utwórz zapytanie
      const q = query(statsRef, where('userId', '==', userId));
      console.log('Query created:', q);

      // Wykonaj zapytanie
      const querySnapshot = await getDocs(q);
      console.log('Query executed, documents found:', querySnapshot.size);

      // Wyświetl wszystkie dokumenty
      querySnapshot.forEach(doc => {
        console.log('Document data:', {
          id: doc.id,
          data: doc.data()
        });
      });

      if (!querySnapshot.empty) {
        const allGames = querySnapshot.docs.map(doc => doc.data());
        console.log('All games data:', allGames);

        // Oblicz statystyki
        const stats = {
          totalGames: allGames.length,
          bestScore: Math.max(...allGames.map(game => game.score || 0)),
          bestTime: Math.min(...allGames.map(game => game.timeSpent || Infinity)),
          perfectGames: allGames.filter(game => game.score === 20).length
        };

        console.log('Calculated stats:', stats);
        setUserStats(stats);
      } else {
        console.log('No documents found for user');
        setUserStats({
          totalGames: 0,
          bestScore: 0,
          bestTime: 0,
          perfectGames: 0
        });
      }
    } catch (error) {
      console.error('Error in fetchUserStats:', error);
      // Wyświetl pełny stack trace
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
    }
  };

  // Dodajmy więcej logów w useEffect
  useEffect(() => {
    console.log('useUserStats useEffect triggered');
    console.log('Current userId:', userId);
    if (userId) {
      console.log('Calling fetchUserStats');
      fetchUserStats();
    }
  }, [userId]);

  return { userStats, refreshStats: fetchUserStats };
}; 