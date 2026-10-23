import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDnuZkYMkDpgjZ2Jug1KLJBAEfX5oduq64",
  authDomain: "sucform.firebaseapp.com",
  databaseURL: "https://sucform-default-rtdb.firebaseio.com",
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
let analytics = null;

if (hasFirebaseConfig) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || DEFAULT_FIREBASE_CONFIG.databaseURL,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
      appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId,
    };

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    db = getFirestore(app);

    // Inicializa Analytics apenas em ambientes que suportam (navegador com cookies)
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
        console.log('✅ Firebase Analytics inicializado. MeasurementId:', firebaseConfig.measurementId);
      } else {
        console.info('ℹ️ Firebase Analytics não suportado neste ambiente.');
      }
    });

  } catch (e) {
    console.warn('Firebase init warning, falling back to LocalStorage:', e);
  }
}

/**
 * Registra um evento customizado no Firebase Analytics.
 * Seguro para chamar mesmo se o Analytics não estiver pronto.
 * @param {string} eventName - Nome do evento (ex: 'inscricao_concluida')
 * @param {object} [params] - Parâmetros opcionais do evento
 */
export function logAnalyticsEvent(eventName, params = {}) {
  if (analytics) {
    logEvent(analytics, eventName, params);
  }
}

export { db, analytics };
