// Validação de CPF
export function cleanCPF(value) {
  return (value || '').replace(/\D/g, '');
}

export function formatCPF(value) {
  const digits = cleanCPF(value).substring(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0,3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;
  return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9,11)}`;
}

export function formatPhone(value) {
  const digits = (value || '').replace(/\D/g, '').substring(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`;
}

export function formatDate(value) {
  const digits = (value || '').replace(/\D/g, '').substring(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0,2)}/${digits.slice(2)}`;
  return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4,8)}`;
}

export function validateCPF(cpf) {
  const c = cleanCPF(cpf);
  if (c.length !== 11) return false;
  if (c === c[0].repeat(11)) return false;

  const calcDigit = (slice, factor) => {
    let total = 0;
    for (const ch of slice) {
      total += parseInt(ch) * factor--;
    }
    const rest = total % 11;
    return rest < 2 ? '0' : String(11 - rest);
  };

  const d1 = calcDigit(c.slice(0, 9), 10);
  const d2 = calcDigit(c.slice(0, 10), 11);
  return c[9] === d1 && c[10] === d2;
}

export function parseDateBR(dateStr) {
  if (!dateStr || dateStr.length < 10) return null;
  // Normaliza barras normais, barras invertidas, pontos e traços (ex: 11\11\1981 ou 11-11-1981)
  const normalized = dateStr.replace(/[\\\\.-]/g, '/');
  const parts = normalized.split('/');
  if (parts.length !== 3) return null;
  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);
  if (!day || !month || !year || month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > new Date().getFullYear()) {
    return null;
  }
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return null;
  // Previne dias inválidos como 31/02
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return d;
}

export function calcAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age >= 0 && age <= 125 ? age : null;
}

export function formatCPFDisplay(cpf) {
  if (!cpf || cpf.length !== 11) return cpf;
  return `${cpf.slice(0,3)}.${cpf.slice(3,6)}.${cpf.slice(6,9)}-${cpf.slice(9,11)}`;
}

export async function exportToXLSX(registros) {
  const XLSX = await import('xlsx');

  const headers = [
    'ID', 'CPF', 'Nome', 'E-mail', 'Estado Civil',
    'Nome do Cônjuge', 'CPF do Cônjuge', 'Telefone do Cônjuge', 'Data Nasc. do Cônjuge',
    'Sexo', 'Data de Nascimento', 'Idade', 'Endereço', 'Bairro', 'Cidade/Estado',
    'Telefone', 'Chefe de Equipe', 'Aceite LGPD', 'Criado em',
  ];

  const rows = registros.map(r => {
    let idadeVal = r.idade;
    if ((idadeVal === null || idadeVal === undefined || idadeVal === '') && r.data_nascimento) {
      const parsed = parseDateBR(r.data_nascimento);
      idadeVal = calcAge(parsed);
    }

    let createdStr = '';
    if (r.created_at) {
      const d = r.created_at.seconds ? new Date(r.created_at.seconds * 1000) : new Date(r.created_at);
      createdStr = isNaN(d.getTime()) ? '' : d.toLocaleString('pt-BR');
    }

    // Extração inteligente de dados do cônjuge caso tenham sido gravados em campos dedicados ou anexados
    let conjugeNome = r.conjuge_nome || r.nome_conjuge || r.esposo_nome || r.esposa_nome || '';
    let conjugeCpf = (r.conjuge_cpf || r.cpf_conjuge || r.esposo_cpf || r.esposa_cpf) ? formatCPFDisplay(r.conjuge_cpf || r.cpf_conjuge || r.esposo_cpf || r.esposa_cpf) : '';
    let conjugeTel = r.conjuge_telefone || r.telefone_conjuge || r.telefone_esposo || r.telefone_esposa || '';
    let conjugeNasc = r.conjuge_data_nascimento || r.data_nascimento_conjuge || '';

    if (!conjugeNome && r.estado_civil?.includes('(Cônjuge:')) {
      const match = r.estado_civil.match(/\(Cônjuge:\s*([^|)]+)/);
      if (match) conjugeNome = match[1].trim();
      const matchCpf = r.estado_civil.match(/CPF:\s*([^|)]+)/);
      if (matchCpf) conjugeCpf = formatCPFDisplay(matchCpf[1].trim());
      const matchTel = r.estado_civil.match(/Tel:\s*([^|)]+)/);
      if (matchTel) conjugeTel = matchTel[1].trim();
      const matchNasc = r.estado_civil.match(/Nasc:\s*([^|)]+)/);
      if (matchNasc) conjugeNasc = matchNasc[1].trim();
    }

    const isMenor = (r.estado_civil || '').toLowerCase().includes('menor');
    const chefeStr = isMenor ? 'Não aplicável (Menor)' : (r.chefe_de_equipe ? 'Sim' : 'Não');

    return {
      'ID': r.id,
      'CPF': formatCPFDisplay(r.cpf),
      'Nome': r.nome || '',
      'E-mail': r.email || '',
      'Estado Civil': r.estado_civil || '',
      'Nome do Cônjuge': conjugeNome,
      'CPF do Cônjuge': conjugeCpf,
      'Telefone do Cônjuge': conjugeTel ? formatPhone(conjugeTel) : '',
      'Data Nasc. do Cônjuge': conjugeNasc,
      'Sexo': r.sexo || '',
      'Data de Nascimento': r.data_nascimento || '',
      'Idade': idadeVal ?? '',
      'Endereço': r.endereco || '',
      'Bairro': r.bairro || '',
      'Cidade/Estado': r.cidade_estado || '',
      'Telefone': r.telefone ? formatPhone(r.telefone) : '',
      'Chefe de Equipe': chefeStr,
      'Aceite LGPD': r.aceite_lgpd === false ? 'Não' : 'Sim',
      'Criado em': createdStr,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });

  // Ajuste automático de largura das colunas
  const colWidths = headers.map(h => ({
    wch: Math.max(h.length + 2, ...rows.map(r => String(r[h] ?? '').length))
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inscritos');

  const filename = `inscritos_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
