import { db } from './config';
import { collection, query, where, getDocs, addDoc, getDoc, orderBy, limit } from 'firebase/firestore';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
}

export const registerUser = async (
  username: string, 
  password: string, 
  firstName: string, 
  lastName: string
) => {
  try {
    // Sprawdź czy użytkownik już istnieje
    const userQuery = query(
      collection(db, 'users'), 
      where('username', '==', username)
    );
    const existingUser = await getDocs(userQuery);
    
    if (!existingUser.empty) {
      throw new Error('Ta nazwa użytkownika jest już zajęta');
    }

    // Utwórz nowego użytkownika
    const userRef = await addDoc(collection(db, 'users'), {
      username,
      password, // W prawdziwej aplikacji należy zahashować hasło!
      firstName,
      lastName,
      createdAt: new Date()
    });

    return {
      id: userRef.id,
      username,
      firstName,
      lastName
    };
  } catch (error) {
    console.error('Błąd podczas rejestracji:', error);
    throw error;
  }
};

export const loginUser = async (username: string, password: string) => {
  try {
    const userQuery = query(
      collection(db, 'users'),
      where('username', '==', username),
      where('password', '==', password)
    );
    
    const querySnapshot = await getDocs(userQuery);
    
    if (querySnapshot.empty) {
      throw new Error('Nieprawidłowa nazwa użytkownika lub hasło');
    }

    const userData = querySnapshot.docs[0].data();
    return {
      id: querySnapshot.docs[0].id,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName
    };
  } catch (error) {
    console.error('Błąd podczas logowania:', error);
    throw error;
  }
};

export const saveGameProgress = async (userId: string, gameData: {
  score: number;
  totalQuestions: number;
  duration: number;
  gameHistory: string[];
}) => {
  try {
    await addDoc(collection(db, 'games'), {
      userId,
      ...gameData,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Błąd podczas zapisywania gry:', error);
    throw error;
  }
};

export const getUserStats = async (userId: string) => {
  try {
    const q = query(collection(db, 'games'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Błąd podczas pobierania statystyk:', error);
    return [];
  }
};

interface GameStats {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  score: number;
  timeSpent: number;
  timestamp: Date;
}

export const saveGameStats = async (
  userId: string,
  username: string,
  firstName: string,
  lastName: string,
  score: number,
  timeSpent: number,
  isPerfectScore: boolean
) => {
  try {
    await addDoc(collection(db, 'stats'), {
      userId,
      username,
      firstName,
      lastName,
      score,
      timeSpent,
      isPerfectScore,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Błąd podczas zapisywania statystyk:', error);
    throw error;
  }
};

export const getLeaderboard = async () => {
  try {
    // Pobierz wszystkie statystyki
    const statsRef = collection(db, 'stats');
    const statsSnapshot = await getDocs(statsRef);
    
    // Przygotuj mapy do agregacji danych
    const bestScores = new Map();
    const timeSpentMap = new Map();
    const fastestPerfectGames = new Map();

    statsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;

      // Aktualizuj najlepszy wynik użytkownika
      if (!bestScores.has(userId) || bestScores.get(userId).score < data.score) {
        bestScores.set(userId, {
          id: doc.id,
          userId: data.userId,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          score: data.score,
          timestamp: data.timestamp
        });
      }

      // Sumuj czas spędzony przez użytkownika
      if (!timeSpentMap.has(userId)) {
        timeSpentMap.set(userId, {
          id: doc.id,
          userId: data.userId,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          timeSpent: 0,
          timestamp: data.timestamp
        });
      }
      timeSpentMap.get(userId).timeSpent += data.timeSpent;

      // Śledź najszybsze perfekcyjne gry (tylko gdy wszystkie odpowiedzi są poprawne)
      if (data.isPerfectScore) {
        if (!fastestPerfectGames.has(userId) || 
            fastestPerfectGames.get(userId).timeSpent > data.timeSpent) {
          fastestPerfectGames.set(userId, {
            id: doc.id,
            userId: data.userId,
            username: data.username,
            firstName: data.firstName,
            lastName: data.lastName,
            timeSpent: data.timeSpent,
            timestamp: data.timestamp
          });
        }
      }
    });

    // Konwertuj mapy na tablice i sortuj
    const bestScoresArray = Array.from(bestScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const mostPracticedArray = Array.from(timeSpentMap.values())
      .sort((a, b) => b.timeSpent - a.timeSpent)
      .slice(0, 10);

    const fastestGamesArray = Array.from(fastestPerfectGames.values())
      .sort((a, b) => a.timeSpent - b.timeSpent)
      .slice(0, 10);

    return {
      bestScores: bestScoresArray,
      mostPracticed: mostPracticedArray,
      fastestGames: fastestGamesArray
    };
  } catch (error) {
    console.error('Błąd podczas pobierania statystyk:', error);
    throw error;
  }
}; 