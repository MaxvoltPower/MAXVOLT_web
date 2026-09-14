import admin from 'firebase-admin';

let initialized = false;

export function initFirebaseAdmin() {
  if (initialized) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials missing');
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

export async function verifyIdToken(idToken) {
  const app = initFirebaseAdmin();
  try {
    const decoded = await app.auth().verifyIdToken(idToken);
    return decoded;
  } catch (err) {
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