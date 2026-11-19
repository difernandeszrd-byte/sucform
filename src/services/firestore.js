import { supabase } from '../supabase.js';

const SUPABASE_TABLE = 'inscricoes';
const LOCAL_STORAGE_KEY = 'suc_inscricoes_data';
const LOCAL_STORAGE_CONFIG_KEY = 'suc_config_ativas';

// ── LocalStorage helpers ─────────────────────────────────────────────────────

function getLocalInscricoes() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalInscricoes(list) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', e);
  }
}

// ── Inscrições ───────────────────────────────────────────────────────────────

export async function checkCPFExists(cpf) {
  if (!cpf) return false;
  const clean = String(cpf).replace(/\D/g, '');
  if (!clean) return false;

  if (supabase) {
    try {
      // 1. Verifica se já existe como CPF de titular
      const { data: titular, error: errTitular } = await supabase
        .from(SUPABASE_TABLE)
        .select('id')
        .eq('cpf', clean)
        .limit(1);

      if (!errTitular && titular && titular.length > 0) return true;

      // 2. Verifica se o CPF consta dentro do estado_civil (caso formato de resumo)
      const { data: ecData, error: errEc } = await supabase
        .from(SUPABASE_TABLE)
        .select('id')
        .ilike('estado_civil', `%${clean}%`)
        .limit(1);

      if (!errEc && ecData && ecData.length > 0) return true;

      // 3. Verifica se existe na coluna dedicada conjuge_cpf (se já existir na tabela)
      try {
        const { data: conjuge, error: errConjuge } = await supabase
          .from(SUPABASE_TABLE)
          .select('id')
          .eq('conjuge_cpf', clean)
          .limit(1);

        if (!errConjuge && conjuge && conjuge.length > 0) return true;
      } catch {
        // Coluna ainda não criada na tabela
      }
    } catch (e) {
      console.warn('⚠️ Supabase checkCPF exception:', e.message);
    }
  }

  // Fallback localStorage caso Supabase esteja temporariamente indisponível
  const list = getLocalInscricoes();
  return list.some(item => {
    const itemCpf = String(item.cpf || '').replace(/\D/g, '');
    const itemConjugeCpf = String(item.conjuge_cpf || '').replace(/\D/g, '');
    const itemEc = String(item.estado_civil || '');
    return itemCpf === clean || itemConjugeCpf === clean || itemEc.includes(clean);
  });
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

  let inserted = null;
  // 1. Tenta salvar com todos os campos (incluindo colunas dedicadas de cônjuge se já criadas no banco)
  const { data: resData, error } = await supabase
    .from(SUPABASE_TABLE)
    .insert([payload])
    .select()
    .single();

  if (!error) {
    inserted = resData;
  } else if (error.code === 'PGRST204' || error.message?.includes('schema cache') || error.message?.includes('column')) {
    // 2. Se as colunas de cônjuge ainda não tiverem sido adicionadas à tabela no Supabase,
    // salva os dados básicos sem perder as informações do cônjuge (anexadas legivelmente no estado_civil)
    console.warn('⚠️ Supabase: colunas adicionais de cônjuge não encontradas no schema cache. Salvando formato compatível com dados preservados no estado_civil...');
    const safePayload = { ...payload };
    delete safePayload.conjuge_nome;
    delete safePayload.conjuge_cpf;
    delete safePayload.conjuge_telefone;
    delete safePayload.conjuge_data_nascimento;
    delete safePayload.aceite_lgpd;

    if (data.conjuge_nome) {
      const conjugeResumo = [
        data.conjuge_nome,
        data.conjuge_cpf ? `CPF: ${data.conjuge_cpf}` : '',
        data.conjuge_telefone ? `Tel: ${data.conjuge_telefone}` : '',
        data.conjuge_data_nascimento ? `Nasc: ${data.conjuge_data_nascimento}` : ''
      ].filter(Boolean).join(' | ');
      safePayload.estado_civil = `${data.estado_civil || 'União Estável'} (Cônjuge: ${conjugeResumo})`;
    }

    const retry = await supabase
      .from(SUPABASE_TABLE)
      .insert([safePayload])
      .select()
      .single();

    if (retry.error) {
      console.error('❌ Supabase createInscricao retry error:', retry.error);
      throw new Error(`Erro ao salvar no banco de dados: ${retry.error.message}`);
    }
    inserted = retry.data;
  } else {
    console.error('❌ Supabase createInscricao error:', error);
    throw new Error(`Erro ao salvar no banco de dados: ${error.message}`);
  }

  console.log('✅ Inscrição salva com sucesso:', inserted);

  // Guarda uma cópia de segurança completa no localStorage do usuário (sempre com todos os campos)
  const fullRecord = { ...payload, ...(inserted || {}) };
  try {
    const list = getLocalInscricoes();
    list.unshift(fullRecord);
    saveLocalInscricoes(list);
  } catch (err) {
    console.warn('Aviso ao salvar cópia local:', err);
  }

  return fullRecord;
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
        // Normaliza registros recuperando dados do cônjuge caso tenham sido salvos no estado_civil
        return data.map(r => {
          if (!r.conjuge_nome && r.estado_civil?.includes('(Cônjuge:')) {
            const matchNome = r.estado_civil.match(/\(Cônjuge:\s*([^|)]+)/);
            const matchCpf = r.estado_civil.match(/CPF:\s*([^|)]+)/);
            const matchTel = r.estado_civil.match(/Tel:\s*([^|)]+)/);
            const matchNasc = r.estado_civil.match(/Nasc:\s*([^|)]+)/);
            return {
              ...r,
              conjuge_nome: matchNome ? matchNome[1].trim() : '',
              conjuge_cpf: matchCpf ? matchCpf[1].trim() : (r.conjuge_cpf || ''),
              conjuge_telefone: matchTel ? matchTel[1].trim() : (r.conjuge_telefone || ''),
              conjuge_data_nascimento: matchNasc ? matchNasc[1].trim() : (r.conjuge_data_nascimento || ''),
            };
          }
          return r;
        });
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
