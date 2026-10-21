// ============================================================
// MAXVOLT — Firebase client init
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const ENV_NAMES = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
};

const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => ENV_NAMES[k]);

if (missing.length) {
  // eslint-disable-next-line no-console
  console.error(
    '[firebase] Missing required env vars:',
    missing.join(', '),
    '\nCopy .env.example to .env, fill in real values, then restart the dev server.'
  );
}

let app;
let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[firebase] Failed to initialize:', err?.message);

  // Minimal stub so imports don't crash the whole app.
  // Any call to a real SDK function (signInWithEmailAndPassword, etc.)
  // will throw a clear error instead of a cryptic one.
  const notConfigured = () => {
    throw new Error(
      'Firebase is not configured. Set the VITE_FIREBASE_* env vars in .env and restart the dev server.'
    );
  };

  auth = {
    currentUser: null,
    onAuthStateChanged: (cb) => {
      try { cb(null); } catch { /* ignore */ }
      return () => {};
    },
    onIdTokenChanged: (cb) => {
      try { cb(null); } catch { /* ignore */ }
      return () => {};
    },
    signInWithEmailAndPassword: notConfigured,
    createUserWithEmailAndPassword: notConfigured,
    signInWithPopup: notConfigured,
    signOut: notConfigured,
    sendPasswordResetEmail: notConfigured,
  };
}

export { auth };
export default app;