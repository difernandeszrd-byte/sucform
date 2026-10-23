import { supabase } from '../supabase';

const SUPABASE_TABLE = 'inscricoes';
const LOCAL_STORAGE_KEY = 'suc_inscricoes_data';
const LOCAL_STORAGE_CONFIG_KEY = 'suc_config_ativas';

// ── LocalStorage helpers ─────────────────────────────────────────────────────

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
    console.error('Erro ao salvar no localStorage:', e);
  }
}

// ── Inscrições ───────────────────────────────────────────────────────────────

export async function checkCPFExists(cpf) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE)
        .select('id')
        .eq('cpf', cpf)
        .limit(1);
      if (!error) return data && data.length > 0;
      console.warn('⚠️ Supabase checkCPF error:', error.message);
    } catch (e) {
      console.warn('⚠️ Supabase checkCPF exception:', e.message);
    }
  }

  // Fallback localStorage caso Supabase esteja temporariamente indisponível
  const list = getLocalInscricoes();
  return list.some(item => item.cpf === cpf);
}

export async function createInscricao(data) {
  if (!supabase) {
    console.error('❌ Supabase não configurado ou cliente nulo.');
    throw new Error('Banco de dados (Supabase) não configurado. Verifique as credenciais.');
  }

  const payload = {
    ...data,
    created_at: new Date().toISOString(),
  };

  const { data: inserted, error } = await supabase
    .from(SUPABASE_TABLE)
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase createInscricao error:', error);
    throw new Error(`Erro ao salvar no banco de dados: ${error.message}`);
  }

  console.log('✅ Inscrição salva no Supabase com sucesso:', inserted);

  // Guarda uma cópia de segurança no localStorage do usuário
  try {
    const list = getLocalInscricoes();
    list.unshift(inserted || payload);
    saveLocalInscricoes(list);
  } catch (err) {
    console.warn('Aviso ao salvar cópia local:', err);
  }

  return inserted;
}

export async function getInscricoes() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        console.log(`✅ ${data.length} inscrições carregadas do Supabase.`);
        return data;
      }
      console.warn('⚠️ Supabase getInscricoes error:', error?.message);
    } catch (e) {
      console.warn('⚠️ Supabase getInscricoes exception:', e.message);
    }
  }

  // Fallback localStorage
  return getLocalInscricoes();
}

export async function deleteInscricao(id) {
  if (supabase) {
    try {
      const { error } = await supabase
        .from(SUPABASE_TABLE)
        .delete()
        .eq('id', id);

      if (!error) {
        console.log('✅ Inscrição deletada do Supabase.');
      } else {
        console.warn('⚠️ Supabase deleteInscricao error:', error.message);
        throw new Error(`Erro ao excluir do Supabase: ${error.message}`);
      }
    } catch (e) {
      console.warn('⚠️ Supabase deleteInscricao exception:', e.message);
      throw e;
    }
  }

  // Atualiza também cache local
  let list = getLocalInscricoes();
  list = list.filter(item => item.id !== id);
  saveLocalInscricoes(list);
}


// ── Configuração (inscrições abertas/fechadas) ───────────────────────────────

export async function getInscricoesAtivas() {
  // 1. Tenta Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('ativas')
        .eq('id', 'inscricoes')
        .single();
      if (!error && data) return data.ativas !== false;
      // PGRST116 = row not found → retorna true por padrão
      if (error && error.code !== 'PGRST116') {
        console.warn('⚠️ Supabase getInscricoesAtivas error:', error.message);
      }
    } catch (e) {
      console.warn('⚠️ Supabase getInscricoesAtivas exception:', e.message);
    }
  }

  // 2. Fallback localStorage
  const saved = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
  return saved !== null ? saved === 'true' : true;
}

export async function setInscricoesAtivas(ativas) {
  // 1. Tenta Supabase (upsert)
  if (supabase) {
    try {
      const { error } = await supabase
        .from('config')
        .upsert({ id: 'inscricoes', ativas }, { onConflict: 'id' });
      if (!error) {
        console.log('✅ Config salva no Supabase.');
      } else {
        console.warn('⚠️ Supabase setInscricoesAtivas error:', error.message);
      }
    } catch (e) {
      console.warn('⚠️ Supabase setInscricoesAtivas exception:', e.message);
    }
  }

  // 2. Sempre salva no localStorage como cache local
  localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, String(ativas));
}
