/**
 * Servico de envio de e-mails de confirmacao para inscritos.
 * Suporta rota de API (/api/send-email) e fallback direto via Resend REST API.
 */

export function generateEmailHtml(participantData) {
  const nome = participantData.nome || 'Participante';
  const cpf = participantData.cpf || '-';
  const email = participantData.email || '-';
  const telefone = participantData.telefone || '-';
  const dataNasc = participantData.data_nascimento || '-';
  const local = [participantData.cidade_estado, participantData.bairro].filter(Boolean).join(' - ') || '-';
  const chefe = participantData.chefe_de_equipe ? 'Sim' : 'Não';

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
            <td class="label-col">Telefone:</td>
            <td class="val-col">${telefone}</td>
          </tr>
          <tr>
            <td class="label-col">Data de Nascimento:</td>
            <td class="val-col">${dataNasc}</td>
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

async function sendViaGmailOAuth2Direct(participantData) {
  const gmailUser = import.meta.env.VITE_GMAIL_USER;
  const clientId = import.meta.env.VITE_GMAIL_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_GMAIL_CLIENT_SECRET;
  const refreshToken = import.meta.env.VITE_GMAIL_REFRESH_TOKEN;

  if (!gmailUser || !clientId || !clientSecret || !refreshToken) {
    return null;
  }

  try {
    // 1. Obter Access Token atualizado via Refresh Token do Google OAuth2
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.warn('⚠️ Falha ao renovar token OAuth2 do Gmail:', tokenData);
      return null;
    }

    const accessToken = tokenData.access_token;
    const htmlContent = generateEmailHtml(participantData);
    const subject = '🎉 Cadastro Concluído com Êxito - Semana Universitária Cajuruense';
    const senderName = import.meta.env.VITE_GMAIL_FROM_NAME || 'Semana Universitária';

    // 2. Montar mensagem MIME RFC 2822
    const rawMessage = [
      `From: "${senderName}" <${gmailUser}>`,
      `To: ${participantData.email}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlContent,
    ].join('\r\n');

    // 3. Converter para formato Base64URL aceito pela API do Gmail
    const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 4. Enviar mensagem via REST API oficial do Gmail
    const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    const sendResult = await gmailResponse.json();
    if (gmailResponse.ok) {
      console.log('✅ E-mail enviado com sucesso via Gmail OAuth2 REST API no navegador!', sendResult);
      return { success: true, method: 'gmail_oauth2_rest', data: sendResult };
    } else {
      console.warn('⚠️ Erro retornado pela API do Gmail:', sendResult);
      return null;
    }
  } catch (err) {
    console.error('❌ Exceção ao enviar e-mail via Gmail OAuth2 no navegador:', err);
    return null;
  }
}

export async function sendConfirmationEmail(participantData) {
  if (!participantData?.email) {
    console.warn('⚠️ E-mail não informado para envio.');
    return { success: false, reason: 'no_email', message: 'E-mail não informado.' };
  }

  // 1. Tenta rota serverless /api/send-email (Processa Gmail OAuth2 ou Resend no backend)
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(participantData),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`✅ E-mail de confirmação enviado via rota serverless /api/send-email! Provider: ${data.provider || 'default'}`);
      return { success: true, method: 'api', data };
    }
  } catch {
    // Rota serverless não disponível no ambiente de dev estático puro (Vite)
  }

  // 2. Fallback Dev Direct: Tenta enviar via Gmail OAuth2 REST API no navegador se VITE_GMAIL_* estiverem definidos
  const gmailDirectResult = await sendViaGmailOAuth2Direct(participantData);
  if (gmailDirectResult && gmailDirectResult.success) {
    return gmailDirectResult;
  }

  // 3. Fallback Dev Direct: Envio via chamada direta à REST API do Resend no navegador
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  if (apiKey && apiKey.startsWith('re_') && !apiKey.includes('SUA_CHAVE')) {
    try {
      const fromEmail = import.meta.env.VITE_RESEND_FROM_EMAIL || 'Semana Universitária <onboarding@resend.dev>';
      const htmlContent = generateEmailHtml(participantData);

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [participantData.email],
          subject: '🎉 Cadastro Concluído com Êxito - Semana Universitária Cajuruense',
          html: htmlContent,
        }),
      });

      const data = await resendResponse.json();

      if (resendResponse.ok) {
        console.log('✅ E-mail enviado com sucesso via Resend REST API!', data);
        return { success: true, method: 'resend_rest', data };
      } else {
        console.warn('⚠️ Erro na resposta do Resend:', data);
        return { success: false, reason: 'resend_error', message: data.message || 'Erro ao enviar e-mail via Resend' };
      }
    } catch (err) {
      console.warn('⚠️ Falha de rede/requisição ao enviar via Resend:', err);
      return { success: false, reason: 'network_error', message: err.message };
    }
  }

  console.info('ℹ️ Nenhuma credencial válida de e-mail (Gmail OAuth2 ou Resend) foi encontrada.');
  return { success: false, reason: 'not_configured', message: 'Credenciais de e-mail não configuradas.' };
}


