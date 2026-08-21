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

export { onAuthStateChanged };
