import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDnuZkYMkDpgjZ2Jug1KLJBAEfX5oduq64",
  authDomain: "sucform.firebaseapp.com",
  projectId: "sucform",
  storageBucket: "sucform.firebasestorage.app",
  messagingSenderId: "806068952566",
  appId: "1:806068952566:web:304f61ca0d16ce1bd5fbd7",
  measurementId: "G-L62ETPK0DM",
};

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId;

const isPlaceholder = (val) =>
  !val ||
  val.includes('SUA_API_KEY') ||
  val.includes('SEU_PROJECT_ID') ||
  val.includes('SEU_PROJETO') ||
  val.includes('YOUR_API_KEY');

export const hasFirebaseConfig = Boolean(
  apiKey && projectId && !isPlaceholder(apiKey) && !isPlaceholder(projectId)
);

let db = null;
if (hasFirebaseConfig) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
      appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
    };
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (e) {
    console.warn('Firebase init warning, falling back to LocalStorage:', e);
  }
}

export { db };



