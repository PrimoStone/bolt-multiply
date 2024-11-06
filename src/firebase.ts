import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Skopiuj te dane z Firebase Console
  apiKey: "twój-api-key",
  authDomain: "twój-projekt.firebaseapp.com",
  projectId: "twój-projekt",
  storageBucket: "twój-projekt.appspot.com",
  messagingSenderId: "twój-messaging-id",
  appId: "twój-app-id"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 