import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const participantData = req.body || {};
  const { nome, email, cpf, data_nascimento, chefe_de_equipe, telefone, cidade_estado, bairro } = participantData;

  if (!email || !nome) {
    return res.status(400).json({ error: 'E-mail e nome são obrigatórios.' });
  }

  const local = [cidade_estado, bairro].filter(Boolean).join(' - ') || '-';
  const chefe = chefe_de_equipe ? 'Sim' : 'Não';
  const subject = '🎉 Cadastro Concluído com Êxito - Semana Universitária Cajuruense';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmação de Inscrição</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f1f5f9; margin: 0; padding: 24px 12px; }
        .wrapper { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
        .header-banner { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; }
        .header-title { color: #ffffff; margin: 0 0 8px 0; font-size: 24px; font-weight: 800; }
        .header-subtitle { color: #e0e7ff; margin: 0; font-size: 15px; }
        .content { padding: 32px 24px; }
        .status-badge { display: inline-block; background-color: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ade80; padding: 8px 18px; border-radius: 9999px; font-weight: 700; font-size: 14px; margin-bottom: 24px; }
        .greeting { font-size: 18px; color: #f8fafc; margin-top: 0; margin-bottom: 12px; }
        .message-text { font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px; }
        .details-card { background-color: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 28px; }
        .details-header { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #818cf8; margin-bottom: 16px; border-bottom: 1px solid #1e293b; padding-bottom: 8px; }
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table td { padding: 8px 0; font-size: 14px; border-bottom: 1px dashed #1e293b; }
        .details-table tr:last-child td { border-bottom: none; }
        .label-col { color: #94a3b8; width: 40%; }
        .val-col { color: #f1f5f9; font-weight: 600; text-align: right; }
        .info-box { background: rgba(99, 102, 241, 0.1); border-left: 4px solid #6366f1; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; font-size: 14px; color: #c7d2fe; }
        .footer { text-align: center; padding: 24px; border-top: 1px solid #334155; color: #64748b; font-size: 12px; background-color: #0b1120; }
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
            Notificamos que seu cadastro na <strong>Semana Universitária Cajuruense</strong> foi concluído com sucesso e todas as suas informações foram registradas no sistema.
          </p>
          <div class="details-card">
            <div class="details-header">Comprovante de Cadastro</div>
            <table class="details-table">
              <tr><td class="label-col">Nome Completo:</td><td class="val-col">${nome}</td></tr>
              <tr><td class="label-col">CPF:</td><td class="val-col">${cpf || '-'}</td></tr>
              <tr><td class="label-col">E-mail:</td><td class="val-col">${email}</td></tr>
              <tr><td class="label-col">Telefone:</td><td class="val-col">${telefone || '-'}</td></tr>
              <tr><td class="label-col">Data de Nasc.:</td><td class="val-col">${data_nascimento || '-'}</td></tr>
              <tr><td class="label-col">Localização:</td><td class="val-col">${local}</td></tr>
              <tr><td class="label-col">Interesse em Chefe:</td><td class="val-col">${chefe}</td></tr>
            </table>
          </div>
          <div class="info-box">
            💡 <strong>Guarde este e-mail:</strong> Ele confirma que seu cadastro foi concluído com êxito.
          </div>
        </div>
        <div class="footer">
          <p>Semana Universitária Cajuruense • Notificação Automática de Sistema</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. Tentar envio via Gmail API REST sobre HTTPS se credenciais estiverem configuradas
  const gmailUser = process.env.GMAIL_USER;
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (gmailUser && clientId && clientSecret && refreshToken) {
    try {
      console.log('🔄 Obtendo Access Token do Google OAuth2...');
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
        console.error('❌ Erro no Google OAuth2 Token Refresh:', tokenData);
        if (tokenData.error === 'invalid_grant') {
          return res.status(401).json({
            error: 'Google OAuth2 invalid_grant: O Refresh Token expirou ou não pertence a este Client ID/Secret. Gere um novo Refresh Token no OAuth Playground marcando "Use your own OAuth credentials".',
            details: tokenData,
          });
        }
        throw new Error(`Falha na autenticação OAuth2 do Google: ${tokenData.error_description || tokenData.error}`);
      }

      const accessToken = tokenData.access_token;
      const senderName = process.env.GMAIL_FROM_NAME || 'Semana Universitária';

      const rawMessage = [
        `From: "${senderName}" <${gmailUser}>`,
        `To: ${email}`,
        `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        htmlContent,
      ].join('\r\n');

      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedMessage }),
      });

      const sendData = await sendResponse.json();

      if (sendResponse.ok) {
        console.log('✅ E-mail enviado com sucesso via Gmail REST API:', sendData.id);
        return res.status(200).json({ success: true, provider: 'gmail_oauth2_rest', messageId: sendData.id });
      } else {
        console.error('❌ Erro retornado pela API do Gmail ao enviar:', sendData);
        throw new Error(`Gmail API Error: ${sendData.error?.message || JSON.stringify(sendData)}`);
      }
    } catch (gmailError) {
      console.error('❌ Erro ao enviar e-mail via Gmail OAuth2:', gmailError.message);
      // Caso ocorra excecao e exista Resend API Key, tenta o fallback
    }
  }


  // 2. Fallback para Resend API se RESEND_API_KEY estiver configurado
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Semana Universitária <onboarding@resend.dev>';
      const data = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: subject,
        html: htmlContent,
      });

      console.log('✅ E-mail enviado com sucesso via Resend API');
      return res.status(200).json({ success: true, provider: 'resend', data });
    } catch (resendError) {
      console.error('❌ Erro ao enviar e-mail via Resend:', resendError);
      return res.status(500).json({ error: resendError.message || 'Erro ao enviar e-mail via Resend' });
    }
  }

  return res.status(500).json({
    error: 'Nenhum provedor de e-mail configurado. Por favor, configure as variáveis de ambiente do Gmail OAuth2 (GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN) ou RESEND_API_KEY.',
  });
}


