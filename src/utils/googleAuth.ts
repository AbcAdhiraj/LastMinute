import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';

let auth: any = null;
let provider: any = null;
let isInitialized = false;

// Cache the access token in memory.
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export async function initFirebase(): Promise<boolean> {
  if (isInitialized) return true;
  try {
    const res = await fetch('/firebase-applet-config.json');
    if (!res.ok) {
      console.warn("firebase-applet-config.json not found or not provisioned yet.");
      return false;
    }
    const config = await res.json();
    const app = initializeApp(config);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar');
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    isInitialized = true;
    return true;
  } catch (err) {
    console.error("Failed to initialize Firebase Auth:", err);
    return false;
  }
}

export const initAuthListener = async (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  const ok = await initFirebase();
  if (!ok) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: any; accessToken: string } | null> => {
  const ok = await initFirebase();
  if (!ok) {
    // High-fidelity fallback simulated login for initial preview compatibility
    console.log("Simulating Google Calendar login (Firebase config not ready)...");
    const simulatedToken = "simulated_gcal_token_" + Math.random().toString(36).substr(2, 9);
    cachedAccessToken = simulatedToken;
    return {
      user: { displayName: "Adhiraj Tiwari", email: "adhirajtiwari01@gmail.com" },
      accessToken: simulatedToken
    };
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = () => cachedAccessToken;

export const logout = async () => {
  if (auth) {
    await auth.signOut();
  }
  cachedAccessToken = null;
};
