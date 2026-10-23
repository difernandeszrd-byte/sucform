import { createClient } from '@supabase/supabase-js';

// Resolução de variáveis:
// 1. window.__ENV__ (injetado em tempo de execução pelo server.js no Easypanel)
// 2. import.meta.env (embutido em tempo de build pelo Vite)
// 3. Fallback das credenciais oficiais do projeto Supabase
const supabaseUrl =
  (typeof window !== 'undefined' && window.__ENV__?.VITE_SUPABASE_URL) ||
  import.meta.env.VITE_SUPABASE_URL ||
  'https://hnqzpwxdarllezyhijqh.supabase.co';

const supabaseAnonKey =
  (typeof window !== 'undefined' && window.__ENV__?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_5e8E8brZs6dS08og8slVPQ_durURMQH';

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
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('✅ Supabase inicializado com sucesso para:', supabaseUrl);
  } catch (e) {
    console.error('❌ Falha ao inicializar o Supabase:', e);
  }
} else {
  console.error('❌ Supabase não configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.');
}

export { supabase };

