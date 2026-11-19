/**
 * Serviço de envio de e-mails de confirmação para inscritos.
 * Utiliza a rota de API do servidor (/api/send-email → Gmail SMTP com Senha de App do Google).
 */

export function generateEmailHtml(participantData) {
  const nome = participantData.nome || 'Participante';
  const cpf = participantData.cpf || '-';
  const email = participantData.email || '-';
  const telefone = participantData.telefone || '-';
  const dataNasc = participantData.data_nascimento || '-';
  const estadoCivil = participantData.estado_civil || '-';
  const conjugeNome = participantData.conjuge_nome || '';
  const conjugeTelefone = participantData.conjuge_telefone || '';
  const isMenor = (estadoCivil || '').toLowerCase().includes('menor');
  const chefe = isMenor ? 'Não aplicável (Menor)' : (participantData.chefe_de_equipe ? 'Sim' : 'Não');
  const local = [participantData.cidade_estado, participantData.bairro].filter(Boolean).join(' - ') || '-';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Inscrição</title>
  <style>
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      background-color: #0f172a;
      color: #f1f5f9;
      margin: 0;
      padding: 24px 12px;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      background: #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      border: 1px solid #334155;
    }
    .header-banner {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 800;
    }
    .header-subtitle {
      color: #e0e7ff;
      margin: 0;
      font-size: 15px;
    }
    .content {
      padding: 32px 24px;
    }
    .status-badge {
      display: inline-block;
      background-color: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #4ade80;
      padding: 8px 18px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 24px;
    }
    .greeting {
      font-size: 18px;
      color: #f8fafc;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .message-text {
      font-size: 15px;
      line-height: 1.6;
      color: #cbd5e1;
      margin-bottom: 24px;
    }
    .details-card {
      background-color: #0f172a;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #334155;
      margin-bottom: 28px;
    }
    .details-header {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #818cf8;
      margin-bottom: 16px;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 8px;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
    }
    .details-table td {
      padding: 8px 0;
      font-size: 14px;
      border-bottom: 1px dashed #1e293b;
    }
    .details-table tr:last-child td {
      border-bottom: none;
    }
    .label-col {
      color: #94a3b8;
      width: 40%;
    }
    .val-col {
      color: #f1f5f9;
      font-weight: 600;
      text-align: right;
    }
    .info-box {
      background: rgba(99, 102, 241, 0.1);
      border-left: 4px solid #6366f1;
      padding: 16px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 24px;
      font-size: 14px;
      color: #c7d2fe;
      line-height: 1.5;
    }
    .footer {
      text-align: center;
      padding: 24px;
      border-top: 1px solid #334155;
      color: #64748b;
      font-size: 12px;
      background-color: #0b1120;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header-banner">
      <h1 class="header-title">Semana Universitária Cajuruense 🚀</h1>
      <p class="header-subtitle">Confirmação Oficial de Inscrição</p>
    </div>
    <div class="content">
      <div style="text-align: center;">
        <span class="status-badge">✓ Inscrição Concluída com Êxito</span>
      </div>
      <h2 class="greeting">Olá, <strong>${nome}</strong>!</h2>
      <p class="message-text">
        Notificamos que seu cadastro na <strong>Semana Universitária Cajuruense</strong> foi concluído com sucesso e todas as suas informações foram gravadas em nosso sistema.
      </p>

      <div class="details-card">
        <div class="details-header">Comprovante de Cadastro</div>
        <table class="details-table">
          <tr>
            <td class="label-col">Nome Completo:</td>
            <td class="val-col">${nome}</td>
          </tr>
          <tr>
            <td class="label-col">CPF:</td>
            <td class="val-col">${cpf}</td>
          </tr>
          <tr>
            <td class="label-col">E-mail Cadastrado:</td>
            <td class="val-col">${email}</td>
          </tr>
          <tr>
            <td class="label-col">Estado Civil:</td>
            <td class="val-col">${estadoCivil}</td>
          </tr>
          ${conjugeNome ? `<tr>
            <td class="label-col">Cônjuge:</td>
            <td class="val-col">${conjugeNome}${conjugeTelefone ? ` (${conjugeTelefone})` : ''}</td>
          </tr>` : ''}
          <tr>
            <td class="label-col">Telefone:</td>
            <td class="val-col">${telefone}</td>
          </tr>
          <tr>
            <td class="label-col">Data de Nascimento:</td>
            <td class="val-col">${dataNasc}${participantData.idade ? ` (${participantData.idade} anos)` : ''}</td>
          </tr>
          <tr>
            <td class="label-col">Localização:</td>
            <td class="val-col">${local}</td>
          </tr>
          <tr>
            <td class="label-col">Interesse em Chefe:</td>
            <td class="val-col">${chefe}</td>
          </tr>
        </table>
      </div>

      <div class="info-box">
        💡 <strong>Guarde este e-mail:</strong> Ele serve como seu comprovante oficial de participação. Acompanhe nossas redes para saber o cronograma completo!
      </div>
    </div>
    <div class="footer">
      <p>Semana Universitária Cajuruense • E-mail automático de notificação</p>
      <p>Este e-mail confirma que seu cadastro foi concluído com êxito no sistema.</p>
    </div>
  </div>
</body>
</html>`;
}


export async function sendConfirmationEmail(participantData) {
  if (!participantData?.email) {
    console.warn('⚠️ E-mail não informado para envio.');
    return { success: false, reason: 'no_email', message: 'E-mail não informado.' };
  }

  // Monta a URL absoluta para garantir que funcione em Vercel, EasyPanel e dev local
  const apiUrl = `${window.location.origin}/api/send-email`;

  try {
    console.log(`📧 Chamando ${apiUrl} para: ${participantData.email}`);
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(participantData),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      console.log(`✅ E-mail enviado! Provider: ${data.provider || 'gmail'} | ID: ${data.messageId || '-'}`);
      return { success: true, method: 'api', data };
    }

    const errorMsg = data.error || `Erro HTTP ${res.status}`;
    console.warn('⚠️ Falha no envio de e-mail:', errorMsg);
    return { success: false, reason: 'api_error', message: errorMsg };

  } catch (err) {
    const errorMsg = err.message || 'Falha de conexão com o servidor';
    console.error('❌ Exceção ao chamar /api/send-email:', err);
    return { success: false, reason: 'network_error', message: errorMsg };
  }
}
