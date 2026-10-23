import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

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
    console.log('✅ Supabase inicializado com sucesso como fallback do Firebase.');
  } catch (e) {
    console.warn('⚠️ Falha ao inicializar o Supabase:', e);
  }
}

export { supabase };
