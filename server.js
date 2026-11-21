import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import handler from './api/send-email.js';

// Carrega .env.local ou .env nativamente no Node.js (v20.6+) se existir
try {
  if (fs.existsSync('.env.local')) {
    process.loadEnvFile('.env.local');
  } else if (fs.existsSync('.env')) {
    process.loadEnvFile('.env');
  }
} catch {
  // Em ambientes de produção (Docker/PaaS), as variáveis já vêm injetadas no ambiente
}

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
  const gmailUser = (process.env.GMAIL_USER || 'zrdeltatec@gmail.com').trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || 'tblquqhatpekyirg').replace(/\s+/g, '').replace(/['"]/g, '');
  const hasGmail   = !!(gmailUser && gmailPass);
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hnqzpwxdarllezyhijqh.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_5e8E8brZs6dS08og8slVPQ_durURMQH';
  const hasSupabase = !!(supabaseUrl && supabaseKey);
  res.json({
    status: 'ok',
    providers: {
      gmail: hasGmail,
      supabase: hasSupabase,
    },
    supabaseUrl: supabaseUrl,
    env: process.env.NODE_ENV || 'development',
  });
});

// ── Injeção de variáveis de ambiente em tempo de execução no frontend ──
app.get('/env-config.js', (_req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const env = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://hnqzpwxdarllezyhijqh.supabase.co',
    VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_5e8E8brZs6dS08og8slVPQ_durURMQH',
    VITE_ADMIN_PASSWORD: process.env.VITE_ADMIN_PASSWORD || 'cajuru@2026',
  };
  res.send(`window.__ENV__ = Object.freeze(${JSON.stringify(env)});`);
});

// Rota de API para envio de e-mail (Gmail SMTP com Senha de App)
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
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Fallback SPA - Direcionar todas as outras rotas GET para o index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', (_req, res) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Servidor Ativo</title></head>
      <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f172a; color: #f8fafc;">
        <h2>🚀 Servidor backend Node.js ativo!</h2>
        <p>A API <code>/api/send-email</code> está operacional.</p>
        <p style="color: #94a3b8;">Para acessar a interface visual via este servidor, execute <code>npm run build</code> primeiro, ou utilize <code>npm run dev</code> para desenvolvimento.</p>
      </body>
      </html>
    `);
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`  ➜ Local:   http://localhost:${PORT}/`);
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`  ➜ Network: http://${net.address}:${PORT}/`);
      }
    }
  }
  console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  const gmailUser = (process.env.GMAIL_USER || 'zrdeltatec@gmail.com').trim();
  console.log(`📧 Gmail configurado: true (user: ${gmailUser})`);
});
