import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

const firebaseConfig = {
  projectId: "chungsuclq-auto",
  appId: "1:822134134901:web:20df6a46e8c59459be003c",
  storageBucket: "chungsuclq-auto.firebasestorage.app",
  apiKey: "AIzaSyBn_0JWeFNiSxNA7CO2PHA5zyIy_C1vtCg",
  authDomain: "chungsuclq-auto.firebaseapp.com",
  messagingSenderId: "822134134901",
};

// Initialize Firebase Client
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
let resolveAuthReady;
const authReady = new Promise((resolve) => {
  resolveAuthReady = resolve;
});
const stopAuthReadyListener = onAuthStateChanged(auth, (user) => {
  resolveAuthReady(user);
  stopAuthReadyListener();
});

// Google Sign-In helper with popup
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      uid: user.uid,
      displayName: user.displayName || 'Gamer LQ',
      email: user.email,
      avatar: user.photoURL || 'https://cdn-icons-png.flaticon.com/512/3408/3408545.png',
    };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

// Sign-Out helper
export async function signOutUser() {
  return signOut(auth);
}

// The backend uses this short-lived token to verify that an order really
// belongs to a signed-in Firebase user. Never send the client-side user
// object as proof of identity.
export async function getCurrentUserIdToken(forceRefresh = false) {
  const currentUser = auth.currentUser || await authReady;
  if (!currentUser) return null;
  return currentUser.getIdToken(forceRefresh);
}

// Used by protected pages to wait for Firebase's persisted session before
// deciding whether to show a login form. This prevents the admin login card
// from flashing for an already authenticated administrator on reload.
export async function waitForAuthReady() {
  return auth.currentUser || await authReady;
}

export { onAuthStateChanged };
