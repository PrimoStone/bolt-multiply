import { db } from './config';
import { collection, query, where, getDocs, addDoc, getDoc, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
}

const storage = getStorage();

export const uploadUserPhoto = async (userId: string, file: File): Promise<string> => {
  try {
    const storageRef = ref(storage, `userPhotos/${userId}`);
    await uploadBytes(storageRef, file);
    const photoURL = await getDownloadURL(storageRef);
    return photoURL;
  } catch (error) {
    console.error('Błąd podczas przesyłania zdjęcia:', error);
    throw error;
  }
};

export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.1, // 100KB
    maxWidthOrHeight: 200, // Maksymalny wymiar avatara
    useWebWorker: true
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Błąd podczas kompresji zdjęcia:', error);
    throw error;
  }
};

// Funkcja do konwersji File na Base64
export const convertToBase64 = async (file: File): Promise<string> => {
  try {
    // Najpierw kompresuj
    const compressedFile = await compressImage(file);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  } catch (error) {
    console.error('Błąd podczas konwersji zdjęcia:', error);
    throw error;
  }
};

export const registerUser = async (
  username: string, 
  password: string, 
  firstName: string, 
  lastName: string,
  photoFile?: File
) => {
  try {
    let photoBase64 = '';
    
    if (photoFile) {
      try {
        photoBase64 = await convertToBase64(photoFile);
      } catch (error) {
        throw new Error('Problem ze zdjęciem: ' + error.message);
      }
    }

    const userRef = await addDoc(collection(db, 'users'), {
      username,
      password,
      firstName,
      lastName,
      photoURL: photoBase64, // zapisujemy Base64 string
      createdAt: new Date()
    });

    return {
      id: userRef.id,
      username,
      firstName,
      lastName,
      photoURL: photoBase64
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
      lastName: userData.lastName,
      photoURL: userData.photoURL
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
    // Pobierz dane użytkownika, aby uzyskać photoURL
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    await addDoc(collection(db, 'stats'), {
      userId,
      username,
      firstName,
      lastName,
      photoURL: userData?.photoURL || '', // Dodaj photoURL ze danych użytkownika
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

interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  photoURL: string;
  score: number;
  timeSpent: number;
  timestamp: Date;
}

export const getLeaderboard = async () => {
  try {
    // Pobierz wszystkie statystyki
    const statsRef = collection(db, 'stats');
    const statsSnapshot = await getDocs(statsRef);
    
    // Pobierz wszystkich użytkowników (żeby mieć dostęp do ich zdjęć)
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    // Utwórz mapę użytkowników dla szybkiego dostępu
    const usersMap = new Map();
    usersSnapshot.docs.forEach(doc => {
      usersMap.set(doc.id, doc.data());
    });

    const bestScores = new Map();
    const timeSpentMap = new Map();
    const fastestPerfectGames = new Map();

    statsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;
      const userData = usersMap.get(userId) || {};

      // Aktualizuj najlepszy wynik użytkownika
      if (!bestScores.has(userId) || bestScores.get(userId).score < data.score) {
        bestScores.set(userId, {
          id: doc.id,
          userId: data.userId,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          photoURL: userData.photoURL || '', // Użyj zdjęcia z danych użytkownika
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
          photoURL: userData.photoURL || '', // Użyj zdjęcia z danych użytkownika
          timeSpent: 0,
          timestamp: data.timestamp
        });
      }
      timeSpentMap.get(userId).timeSpent += data.timeSpent;

      // Dodaj logikę dla najszybszych perfekcyjnych gier
      if (data.score === 20) { // Zakładając, że 20 to maksymalny wynik
        if (!fastestPerfectGames.has(userId) || 
            fastestPerfectGames.get(userId).timeSpent > data.timeSpent) {
          fastestPerfectGames.set(userId, {
            id: doc.id,
            userId: data.userId,
            username: data.username,
            firstName: data.firstName,
            lastName: data.lastName,
            photoURL: userData.photoURL || '',
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