import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDkM65-FnMQ3cm9a1VyOux60S-ubVVgFJI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'maxvolt-a1ceb.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'maxvolt-a1ceb',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'maxvolt-a1ceb.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '117152539614',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:117152539614:web:bd54a688c8d4fcc320334f',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;