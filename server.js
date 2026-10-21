import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import handler from './api/send-email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware CORS (necessário quando frontend e backend podem ter origens diferentes) ──
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Middleware para JSON no body
app.use(express.json());

// ── Health-check (útil para diagnóstico no EasyPanel) ──
app.get('/api/health', (_req, res) => {
  const hasGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_CLIENT_ID && process.env.GMAIL_REFRESH_TOKEN);
  const hasResend = !!(process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('SUA_CHAVE'));
  res.json({
    status: 'ok',
    providers: { gmail: hasGmail, resend: hasResend },
    env: process.env.NODE_ENV || 'development',
  });
});

// Rota de API para envio de e-mail (Gmail OAuth2 / Resend)
app.post('/api/send-email', async (req, res) => {
  console.log(`📨 [send-email] Requisição recebida para: ${req.body?.email || '(sem e-mail)'}`);
  try {
    await handler(req, res);
  } catch (error) {
    console.error('Erro no handler da API /api/send-email:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Erro interno no servidor' });
    }
  }
});

// Servir arquivos estáticos do build do React (dist)
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback SPA - Direcionar todas as outras rotas GET para o index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Gmail configurado: ${!!(process.env.GMAIL_USER && process.env.GMAIL_REFRESH_TOKEN)}`);
  console.log(`📧 Resend configurado: ${!!(process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('SUA_CHAVE'))}`);
});
