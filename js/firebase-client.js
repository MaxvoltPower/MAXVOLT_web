// ============================================
// MAXVOLT — Firebase Client SDK
// Loads Firebase Web SDK and exposes window.maxvoltAuth
// Config is fetched from /api/config (env vars on Vercel)
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// Fallback config used only if /api/config fails (e.g. local dev without env vars).
// Replace these with real values OR rely entirely on env vars via /api/config.
const FALLBACK_CONFIG = {
  apiKey: "AIzaSy...",
  authDomain: "maxvolt-app.firebaseapp.com",
  projectId: "maxvolt-app",
  storageBucket: "maxvolt-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

async function loadFirebaseConfig() {
  try {
    const res = await fetch('/api/config', { cache: 'no-store' });
    if (!res.ok) throw new Error('Config endpoint returned ' + res.status);
    const json = await res.json();
    if (!json || !json.firebase || !json.firebase.apiKey) {
      throw new Error('Invalid config response');
    }
    return json.firebase;
  } catch (err) {
    console.warn('Falling back to hardcoded Firebase config:', err.message);
    return FALLBACK_CONFIG;
  }
}

const firebaseConfig = await loadFirebaseConfig();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.maxvoltAuth = {
  app,
  auth,
  signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
  signUp: (email, password, name) =>
    createUserWithEmailAndPassword(auth, email, password).then(async (cred) => {
      if (name) await updateProfile(cred.user, { displayName: name });
      return cred;
    }),
  signInGoogle: () => signInWithPopup(auth, new GoogleAuthProvider()),
  signOutUser: () => signOut(auth),
  onAuthChange: (cb) => onAuthStateChanged(auth, cb),
  resetPassword: (email) => sendPasswordResetEmail(auth, email),
  getIdToken: () =>
    auth.currentUser ? auth.currentUser.getIdToken() : Promise.resolve(null),
};

// Notify any listeners waiting for auth to be ready
window.dispatchEvent(new CustomEvent('maxvolt-auth-ready'));