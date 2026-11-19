import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type Auth,
  type User as FirebaseUser,
  type UserCredential,
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: 'AIzaSyCCFnR4Vx_qigbLWtMEoqSMH45sfOf_I8o',
  authDomain: 'sarigram-c56e3.firebaseapp.com',
  projectId: 'sarigram-c56e3',
  storageBucket: 'sarigram-c56e3.firebasestorage.app',
  messagingSenderId: '928015875384',
  appId: '1:928015875384:web:569a90598edab1affa15cd',
};

export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(firebaseApp);

export class FirebaseEmailNotVerifiedError extends Error {
  readonly code = 'auth/email-not-verified';
  readonly email: string;

  constructor(email: string) {
    super('Check your email & verify, then log in');
    this.name = 'FirebaseEmailNotVerifiedError';
    this.email = email;
  }
}

export async function firebaseRegisterWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  try {
    if (displayName?.trim()) {
      await updateProfile(credential.user, { displayName: displayName.trim() }).catch(() => {});
    }
    await sendEmailVerification(credential.user);
  } finally {
    await signOut(auth).catch(() => {});
  }
}

export async function firebaseSignInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await credential.user.reload().catch(() => {});
  if (!credential.user.emailVerified) {
    await signOut(auth).catch(() => {});
    throw new FirebaseEmailNotVerifiedError(credential.user.email || email);
  }
  return credential;
}

export async function firebaseResendVerificationEmail(
  email: string,
  password: string
): Promise<void> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  try {
    await credential.user.reload().catch(() => {});
    if (!credential.user.emailVerified) {
      await sendEmailVerification(credential.user);
    }
  } finally {
    await signOut(auth).catch(() => {});
  }
}

export async function firebaseSendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

export async function firebaseSignOut(): Promise<void> {
  await signOut(auth).catch(() => {});
}

export function subscribeFirebaseAuth(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export function formatFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';
  switch (code) {
    case 'auth/email-not-verified':
      return 'Check your email & verify, then log in';
    case 'auth/email-already-in-use':
      return 'This email is already registered in Firebase Authentication. Try signing in.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/missing-email':
      return 'Please enter your email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters for Firebase Authentication.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a moment and try again.';
    case 'auth/operation-not-allowed':
      return 'Enable Email/Password sign-in in your Firebase Console (Authentication → Sign-in method).';
    case 'auth/network-request-failed':
      return 'Network error communicating with Firebase Authentication.';
    default:
      return error instanceof Error ? error.message : 'Firebase authentication failed.';
  }
}

export type { FirebaseUser };
