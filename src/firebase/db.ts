import { db } from './config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { UserData, UserStatistics } from '../types/user';

// Funkcja zapisująca nowego użytkownika
export const saveNewUser = async (userData: UserData): Promise<boolean> => {
    try {
        await setDoc(doc(db, 'users', userData.username), userData);
        return true;
    } catch (error) {
        console.error('Błąd podczas zapisywania użytkownika:', error);
        return false;
    }
};

// Funkcja pobierająca dane użytkownika
export const getUser = async (username: string): Promise<UserData | null> => {
    try {
        const docRef = doc(db, 'users', username);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data() as UserData;
        }
        return null;
    } catch (error) {
        console.error('Błąd podczas pobierania użytkownika:', error);
        return null;
    }
};

// Funkcja aktualizująca statystyki
export const updateUserStats = async (
    username: string, 
    newStats: UserStatistics
): Promise<boolean> => {
    try {
        const docRef = doc(db, 'users', username);
        await updateDoc(docRef, { statistics: newStats });
        return true;
    } catch (error) {
        console.error('Błąd podczas aktualizacji statystyk:', error);
        return false;
    }
}; 