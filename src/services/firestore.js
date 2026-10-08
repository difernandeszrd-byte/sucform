import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const INSCRICOES_COL = 'inscricoes';
const LOCAL_STORAGE_KEY = 'suc_inscricoes_data';
const LOCAL_STORAGE_CONFIG_KEY = 'suc_config_ativas';

// Helper for promise timeout
function withTimeout(promise, ms = 3500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Firestore timeout')), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Helper for local storage
function getLocalInscricoes() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalInscricoes(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

// ── Inscrições ──────────────────────────────────────────────────────────────

export async function checkCPFExists(cpf) {
  if (db) {
    try {
      const q = query(collection(db, INSCRICOES_COL), where('cpf', '==', cpf));
      const snap = await withTimeout(getDocs(q));
      return !snap.empty;
    } catch (e) {
      console.warn('Firestore error/timeout, checking localStorage:', e);
    }
  }
  const list = getLocalInscricoes();
  return list.some(item => item.cpf === cpf);
}

export async function createInscricao(data) {
  if (db) {
    try {
      return await withTimeout(
        addDoc(collection(db, INSCRICOES_COL), {
          ...data,
          created_at: serverTimestamp(),
        })
      );
    } catch (e) {
      console.warn('Firestore create error/timeout, falling back to localStorage:', e);
    }
  }
  const list = getLocalInscricoes();
  const newItem = {
    ...data,
    id: 'loc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    created_at: { seconds: Math.floor(Date.now() / 1000) },
  };
  list.unshift(newItem);
  saveLocalInscricoes(list);
  return newItem;
}

export async function getInscricoes() {
  if (db) {
    try {
      const q = query(collection(db, INSCRICOES_COL), orderBy('created_at', 'desc'));
      const snap = await withTimeout(getDocs(q));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Firestore list error/timeout, falling back to localStorage:', e);
    }
  }
  return getLocalInscricoes();
}

export async function deleteInscricao(id) {
  if (db) {
    try {
      await withTimeout(deleteDoc(doc(db, INSCRICOES_COL, id)));
      return;
    } catch (e) {
      console.warn('Firestore delete error/timeout, falling back to localStorage:', e);
    }
  }
  let list = getLocalInscricoes();
  list = list.filter(item => item.id !== id);
  saveLocalInscricoes(list);
}

// ── Configuração (inscrições abertas/fechadas) ──────────────────────────────

export async function getInscricoesAtivas() {
  if (db) {
    try {
      const ref = doc(db, 'config', 'inscricoes');
      const snap = await withTimeout(getDoc(ref));
      if (snap.exists()) {
        return snap.data().ativas !== false;
      }
    } catch (e) {
      console.warn('Firestore config read error/timeout, falling back to localStorage:', e);
    }
  }
  const saved = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
  return saved !== null ? saved === 'true' : true;
}

export async function setInscricoesAtivas(ativas) {
  if (db) {
    try {
      const ref = doc(db, 'config', 'inscricoes');
      await withTimeout(setDoc(ref, { ativas }, { merge: true }));
    } catch (e) {
      console.warn('Firestore config write error/timeout, falling back to localStorage:', e);
    }
  }
  localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, String(ativas));
}


