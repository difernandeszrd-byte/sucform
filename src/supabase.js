import { createClient } from '@supabase/supabase-js';

// Resolução de variáveis:
// 1. window.__ENV__ (injetado em tempo de execução pelo server.js no Easypanel)
// 2. import.meta.env (embutido em tempo de build pelo Vite)
// 3. Fallback das credenciais do projeto
const getEnv = (key, fallback = '') => {
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
    return window.__ENV__[key];
  }
  return import.meta.env[key] || fallback;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://hnqzpwxdarllezyhijqh.supabase.co');
const supabaseAnonKey = getEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_5e8E8brZs6dS08og8slVPQ_durURMQH');

const isPlaceholder = (val) =>
  !val ||
  val.includes('SUA_URL') ||
  val.includes('SUA_CHAVE') ||
  val.includes('YOUR_') ||
  val === '';

export const hasSupabaseConfig = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !isPlaceholder(supabaseUrl) &&
  !isPlaceholder(supabaseAnonKey)
);

let supabase = null;

if (hasSupabaseConfig) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase inicializado com sucesso.');
  } catch (e) {
    console.warn('⚠️ Falha ao inicializar o Supabase:', e);
  }
} else {
  console.warn('⚠️ Supabase não configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.');
}

export { supabase };
