import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const participantData = req.body || {};
  const { nome, email, cpf, data_nascimento, chefe_de_equipe, telefone, cidade_estado, bairro } = participantData;

  if (!email || !nome) {
    return res.status(400).json({ error: 'E-mail e nome são obrigatórios.' });
  }

  // ── Credenciais SMTP (Gmail + Senha de App) ─────────────────────────────────
  const gmailUser     = process.env.GMAIL_USER         || 'difernandeszrd@gmail.com';
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || 'dwouhzqplxqjnfgs';
  const fromName      = process.env.GMAIL_FROM_NAME    || 'Semana Universitária Cajuruense';

  if (!gmailUser || !gmailAppPassword) {
    console.error('❌ Variáveis de ambiente Gmail não configuradas (GMAIL_USER / GMAIL_APP_PASSWORD).');
    return res.status(500).json({
      error: 'Provedor de e-mail não configurado. Configure GMAIL_USER e GMAIL_APP_PASSWORD no servidor.',
    });
  }

  // ── Conteúdo do e-mail ───────────────────────────────────────────────────────
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

  // ── Transporter Nodemailer com Gmail SMTP ────────────────────────────────────
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,    // STARTTLS (mais compatível que SSL porta 465)
      requireTLS: true,
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
      tls: {
        rejectUnauthorized: false, // necessário em alguns ambientes com proxy/certificado self-signed
      },
    });

    const mailOptions = {
      from: `"${fromName}" <${gmailUser}>`,
      to: email,
      subject,
      html: htmlContent,
    };

    console.log(`📧 Enviando e-mail para: ${email} via Gmail SMTP (Senha de App)...`);
    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ E-mail enviado com sucesso! Message ID: ${info.messageId}`);
    return res.status(200).json({
      success: true,
      provider: 'gmail_smtp_app_password',
      messageId: info.messageId,
    });
  } catch (err) {
    console.error('❌ Erro ao enviar e-mail via Gmail SMTP:', err.message);
    return res.status(500).json({ error: `Erro no envio via Gmail SMTP: ${err.message}` });
  }
}
