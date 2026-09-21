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

// Fail loudly if any required env var is missing.
// (Falling back to hard-coded keys is a security risk — the fallback value
// gets bundled into the production JS even after you rotate keys.)
const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => `VITE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

if (missing.length) {
  // eslint-disable-next-line no-console
  console.error(
    '[firebase] Missing required env vars:',
    missing.join(', '),
    '\nCopy .env.example to .env and fill in real values, then restart the dev server.'
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;