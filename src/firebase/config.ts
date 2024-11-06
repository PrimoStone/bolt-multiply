import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBjRwgnqxRBjKlmiuHvcMIrHr72gQFAwLg",
  authDomain: "multiplygame-9f5df.firebaseapp.com",
  projectId: "multiplygame-9f5df",
  storageBucket: "multiplygame-9f5df.firebasestorage.app",
  messagingSenderId: "746561384313",
  appId: "1:746561384313:web:b491ec113cce4a574bc9a8",
  measurementId: "G-39MK05YHH4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); 