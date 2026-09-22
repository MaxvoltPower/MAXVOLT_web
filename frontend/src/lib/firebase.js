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

const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => `VITE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

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
  // Provide a stub so imports don't crash the whole app.
  auth = {
    currentUser: null,
    onAuthStateChanged: () => () => {},
  };
}

export { auth };
export default app;