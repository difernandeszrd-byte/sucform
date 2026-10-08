import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import handler from './api/send-email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON no body
app.use(express.json());

// Rota de API para envio de e-mail (Gmail OAuth2 / Resend)
app.post('/api/send-email', async (req, res) => {
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
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
