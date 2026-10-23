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
import { supabase, hasSupabaseConfig } from '../supabase';

const INSCRICOES_COL = 'inscricoes';
const SUPABASE_TABLE = 'inscricoes';
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
  // 1. Tenta Firebase
  if (db) {
    try {
      const q = query(collection(db, INSCRICOES_COL), where('cpf', '==', cpf));
      const snap = await withTimeout(getDocs(q));
      return !snap.empty;
    } catch (e) {
      console.warn('🔄 Firebase indisponível (checkCPF), tentando Supabase...', e.message);
    }
  }

  // 2. Tenta Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE)
        .select('id')
        .eq('cpf', cpf)
        .limit(1);
      if (!error) return data.length > 0;
      console.warn('⚠️ Supabase checkCPF error:', error.message);
    } catch (e) {
      console.warn('⚠️ Supabase checkCPF exception:', e.message);
    }
  }

  // 3. Fallback localStorage
  const list = getLocalInscricoes();
  return list.some(item => item.cpf === cpf);
}

export async function createInscricao(data) {
  // 1. Tenta Firebase
  if (db) {
    try {
      const docRef = await withTimeout(
        addDoc(collection(db, INSCRICOES_COL), {
          ...data,
          created_at: serverTimestamp(),
        })
      );
      console.log('✅ Inscrição salva no Firebase.');
      return docRef;
    } catch (e) {
      console.warn('🔄 Firebase indisponível (createInscricao), tentando Supabase...', e.message);
    }
  }

  // 2. Tenta Supabase
  if (supabase) {
    try {
      const { data: inserted, error } = await supabase
        .from(SUPABASE_TABLE)
        .insert([{ ...data, created_at: new Date().toISOString() }])
        .select()
        .single();
      if (!error) {
        console.log('✅ Inscrição salva no Supabase (fallback do Firebase).');
        return inserted;
      }
      console.warn('⚠️ Supabase createInscricao error:', error.message);
    } catch (e) {
      console.warn('⚠️ Supabase createInscricao exception:', e.message);
    }
  }

  // 3. Fallback localStorage
  console.warn('⚠️ Firebase e Supabase indisponíveis. Salvando no localStorage.');
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
  // 1. Tenta Firebase
  if (db) {
    try {
      const q = query(collection(db, INSCRICOES_COL), orderBy('created_at', 'desc'));
      const snap = await withTimeout(getDocs(q));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('🔄 Firebase indisponível (getInscricoes), tentando Supabase...', e.message);
    }
  }

  // 2. Tenta Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE)
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) {
        console.log('✅ Inscrições carregadas do Supabase (fallback do Firebase).');
        return data;
      }
      console.warn('⚠️ Supabase getInscricoes error:', error.message);
    } catch (e) {
      console.warn('⚠️ Supabase getInscricoes exception:', e.message);
    }
  }

  // 3. Fallback localStorage
  return getLocalInscricoes();
}

export async function deleteInscricao(id) {
  // 1. Tenta Firebase
  if (db) {
    try {
      await withTimeout(deleteDoc(doc(db, INSCRICOES_COL, id)));
      console.log('✅ Inscrição deletada do Firebase.');
      return;
    } catch (e) {
      console.warn('🔄 Firebase indisponível (deleteInscricao), tentando Supabase...', e.message);
    }
  }

  // 2. Tenta Supabase
  if (supabase) {
    try {
      const { error } = await supabase
        .from(SUPABASE_TABLE)
        .delete()
        .eq('id', id);
      if (!error) {
        console.log('✅ Inscrição deletada do Supabase (fallback do Firebase).');
        return;
      }
      console.warn('⚠️ Supabase deleteInscricao error:', error.message);
    } catch (e) {
      console.warn('⚠️ Supabase deleteInscricao exception:', e.message);
    }
  }

  // 3. Fallback localStorage
  let list = getLocalInscricoes();
  list = list.filter(item => item.id !== id);
  saveLocalInscricoes(list);
}

// ── Configuração (inscrições abertas/fechadas) ──────────────────────────────

export async function getInscricoesAtivas() {
  // 1. Tenta Firebase
  if (db) {
    try {
      const ref = doc(db, 'config', 'inscricoes');
      const snap = await withTimeout(getDoc(ref));
      if (snap.exists()) {
        return snap.data().ativas !== false;
      }
    } catch (e) {
      console.warn('🔄 Firebase indisponível (getInscricoesAtivas), tentando Supabase...', e.message);
    }
  }

  // 2. Tenta Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('ativas')
        .eq('id', 'inscricoes')
        .single();
      if (!error && data) return data.ativas !== false;
      // Se o registro não existir (PGRST116), retorna true por padrão
      if (error && error.code !== 'PGRST116') {
        console.warn('⚠️ Supabase getInscricoesAtivas error:', error.message);
      }
    } catch (e) {
      console.warn('⚠️ Supabase getInscricoesAtivas exception:', e.message);
    }
  }

  // 3. Fallback localStorage
  const saved = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
  return saved !== null ? saved === 'true' : true;
}

export async function setInscricoesAtivas(ativas) {
  // 1. Tenta Firebase
  if (db) {
    try {
      const ref = doc(db, 'config', 'inscricoes');
      await withTimeout(setDoc(ref, { ativas }, { merge: true }));
      console.log('✅ Config salva no Firebase.');
    } catch (e) {
      console.warn('🔄 Firebase indisponível (setInscricoesAtivas), tentando Supabase...', e.message);
    }
  }

  // 2. Tenta Supabase (upsert)
  if (supabase) {
    try {
      const { error } = await supabase
        .from('config')
        .upsert({ id: 'inscricoes', ativas }, { onConflict: 'id' });
      if (!error) {
        console.log('✅ Config salva no Supabase (fallback do Firebase).');
      } else {
        console.warn('⚠️ Supabase setInscricoesAtivas error:', error.message);
      }
    } catch (e) {
      console.warn('⚠️ Supabase setInscricoesAtivas exception:', e.message);
    }
  }

  // 3. Sempre salva no localStorage como cache local
  localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, String(ativas));
}
