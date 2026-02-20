import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

if (!apiKey || !authDomain || !projectId || !appId) {
  throw new Error(
    'Missing required Firebase env variables. Check VITE_FIREBASE_* in your .env file.',
  );
}

const firebaseApp = initializeApp({ apiKey, authDomain, projectId, appId });

export const auth = getAuth(firebaseApp);
