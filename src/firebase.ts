import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import bundledConfig from '../firebase-applet-config.json';

const env = import.meta.env;

export const firebaseConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || bundledConfig.projectId,
  appId: env.VITE_FIREBASE_APP_ID || bundledConfig.appId,
  apiKey: env.VITE_FIREBASE_API_KEY || bundledConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || bundledConfig.authDomain,
  firestoreDatabaseId:
    env.VITE_FIREBASE_DATABASE_ID || bundledConfig.firestoreDatabaseId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || bundledConfig.storageBucket,
  messagingSenderId:
    env.VITE_FIREBASE_MESSAGING_SENDER_ID || bundledConfig.messagingSenderId,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Auth persistence setup warning:', err);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function mapFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  const hostname =
    typeof window !== 'undefined' ? window.location.hostname : 'this domain';

  switch (code) {
    case 'auth/unauthorized-domain':
      return `Sign-in blocked: "${hostname}" is not in Firebase Console → Authentication → Settings → Authorized domains. Add "${hostname}" there to enable login on this deployment.`;
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase Console → Authentication → Sign-in method.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Allow popups for this site or try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completing authentication.';
    case 'auth/cancelled-popup-request':
      return 'Previous sign-in request was cancelled. Please try again.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Switch to Sign In instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes before trying again.';
    case 'auth/network-request-failed':
      return 'Network error while contacting Firebase Authentication. Check your connection.';
    default:
      return (err as { message?: string })?.message || 'Authentication failed. Please try again.';
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<{ ok: boolean; offline: boolean }> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { ok: true, offline: false };
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return { ok: false, offline: true };
    }
    // permission-denied on /test/connection confirms server connectivity
    return { ok: true, offline: false };
  }
}
