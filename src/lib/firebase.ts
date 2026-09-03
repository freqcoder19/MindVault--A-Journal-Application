import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  signInAnonymously
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { 
  initializeAppCheck, 
  ReCaptchaEnterpriseProvider, 
  CustomProvider, 
  getToken, 
  AppCheck 
} from "firebase/app-check";
import firebaseConfigJson from "../../firebase-applet-config.json";

// Initialize Firebase SDK
export const app = !getApps().length ? initializeApp(firebaseConfigJson) : getApp();

// Target designated Firestore database ID
export const db = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// =========================================================================
// FIREBASE APP CHECK INITIALIZATION (Client-Side Attestation)
// Attests that incoming requests originate from the authentic MindVault web client.
// Works alongside (never replacing) Firebase Authentication.
// =========================================================================
let appCheckInstance: AppCheck | null = null;

if (typeof window !== "undefined") {
  try {
    const metaEnv = ((import.meta as unknown) as { env?: Record<string, string> }).env || {};
    const recaptchaSiteKey = (
      (metaEnv.VITE_RECAPTCHA_SITE_KEY as string) ||
      (firebaseConfigJson as any).recaptchaSiteKey ||
      ""
    ).trim();

    // Enable App Check debug token in development or test mode if configured
    if (metaEnv.DEV || metaEnv.VITE_APPCHECK_DEBUG_TOKEN) {
      const debugToken = metaEnv.VITE_APPCHECK_DEBUG_TOKEN || true;
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
    }

    if (recaptchaSiteKey) {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      console.log("[Security] App Check initialized with ReCaptchaEnterpriseProvider.");
    } else if (metaEnv.VITE_APPCHECK_DEBUG_TOKEN) {
      // Optional development / testing attestation capability
      appCheckInstance = initializeAppCheck(app, {
        provider: new CustomProvider({
          getToken: async () => ({
            token: String(metaEnv.VITE_APPCHECK_DEBUG_TOKEN),
            expireTimeMillis: Date.now() + 60 * 60 * 1000,
          })
        }),
        isTokenAutoRefreshEnabled: true,
      });
      console.log("[Security] App Check initialized with custom debug provider.");
    } else {
      // App Check is optional; inactive when no provider keys are supplied
      appCheckInstance = null;
    }
  } catch (err: any) {
    console.warn("[Security] App Check optional setup notice:", err.message);
  }
}

export { appCheckInstance };

// Helper to retrieve fresh App Check token for backend verification
export async function getAppCheckToken(forceRefresh = false): Promise<string | null> {
  if (!appCheckInstance) return null;
  try {
    const tokenResult = await getToken(appCheckInstance, forceRefresh);
    return tokenResult.token || null;
  } catch (err: any) {
    console.warn("[Security] App Check token acquisition notice:", err.message);
    return null;
  }
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  signInAnonymously
};
export type { User };

// Helper to get fresh user ID token for backend authentication
// Cryptographically signed Firebase ID token containing user UID, email, and verified custom claims
export async function getUserIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (err) {
    console.error("Failed to get ID token:", err);
    return null;
  }
}

