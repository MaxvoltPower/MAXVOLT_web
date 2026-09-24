import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { api } from '@lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const profileData = await api.verify();
          // Defensive: profileData may be null (if data.data was null) or an
          // object. Never assume .profile exists.
          if (profileData && typeof profileData === 'object') {
            setProfile(profileData.profile ?? null);
            setIsAdmin(Boolean(profileData.isAdmin));
          } else {
            // Fall back to a local profile built from the Firebase user so
            // the UI still works even if /api/auth/verify failed.
            setProfile({
              displayName: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              uid: firebaseUser.uid,
            });
            setIsAdmin(false);
          }
        } catch (err) {
          console.warn('Failed to verify user:', err);
          setProfile({
            displayName: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            uid: firebaseUser.uid,
          });
          setIsAdmin(false);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  };

  const signUp = async (email, password, name) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(result.user, { displayName: name });
    }
    return result;
  };

  const signInGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const signOutUser = async () => {
    await signOut(auth);
    setProfile(null);
    setIsAdmin(false);
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const getIdToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    signIn,
    signUp,
    signInGoogle,
    signOutUser,
    resetPassword,
    getIdToken,
    setProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}