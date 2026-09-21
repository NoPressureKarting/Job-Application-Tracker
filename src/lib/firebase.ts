import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import localConfigFile from '../../firebase-applet-config.json';

const localConfig = (localConfigFile as any) || {};

// Support environment variables (e.g. in CI/CD, deployment, or custom setups) with fallback to local config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId || '',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    localConfig.authDomain ||
    (localConfig.projectId ? `${localConfig.projectId}.firebaseapp.com` : ''),
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    localConfig.storageBucket ||
    (localConfig.projectId ? `${localConfig.projectId}.firebasestorage.app` : ''),
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId || '',
  firestoreDatabaseId:
    import.meta.env.VITE_FIRESTORE_DATABASE_ID ||
    localConfig.firestoreDatabaseId ||
    '(default)',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Firebase Auth error:', error);
    throw error;
  }
}

export async function logOut() {
  await signOut(auth);
}
