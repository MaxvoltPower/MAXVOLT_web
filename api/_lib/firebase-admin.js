import admin from 'firebase-admin';

let initialized = false;

export function initFirebaseAdmin() {
  if (initialized) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin credentials missing (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY)'
    );
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  initialized = true;
  return admin;
}

/**
 * Verify a Firebase ID token.
 * Returns the decoded claims, or null if the token is invalid / Firebase
 * Admin is misconfigured. NEVER throws — callers rely on a null return
 * to mean "unauthenticated", not "server crashed".
 */
export async function verifyIdToken(idToken) {
  let app;
  try {
    app = initFirebaseAdmin();
  } catch (err) {
    console.error('[firebase-admin] init failed:', err.message);
    return null;
  }
  try {
    const decoded = await app.auth().verifyIdToken(idToken);
    return decoded;
  } catch {
    return null;
  }
}

export async function getUserById(uid) {
  const app = initFirebaseAdmin();
  return app.auth().getUser(uid);
}

export async function setUserRole(uid, role) {
  const app = initFirebaseAdmin();
  return app.auth().setCustomUserClaims(uid, { role });
}