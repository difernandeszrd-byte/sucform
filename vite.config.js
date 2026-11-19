import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import handler from './api/send-email.js';

function apiDevServerPlugin() {
  return {
    name: 'api-dev-server-plugin',
    configureServer(server) {
      // 1. Injeção de variáveis de ambiente no frontend em dev (/env-config.js)
      server.middlewares.use('/env-config.js', (_req, res) => {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        const env = {
          VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://hnqzpwxdarllezyhijqh.supabase.co',
          VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_5e8E8brZs6dS08og8slVPQ_durURMQH',
          VITE_ADMIN_PASSWORD: process.env.VITE_ADMIN_PASSWORD || 'cajuru@2026',
        };
        res.end(`window.__ENV__ = Object.freeze(${JSON.stringify(env)});`);
      });

      // 2. Health check (/api/health)
      server.middlewares.use('/api/health', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        const gmailUser = (process.env.GMAIL_USER || 'difernandeszrd@gmail.com').trim();
        const gmailPass = (process.env.GMAIL_APP_PASSWORD || 'dwouhzqplxqjnfgs').replace(/\s+/g, '').replace(/['"]/g, '');
        res.end(JSON.stringify({
          status: 'ok',
          providers: {
            gmail: !!(gmailUser && gmailPass),
            supabase: true,
          },
          env: 'development',
        }));
      });

      // 3. Rota de envio de e-mails em dev (/api/send-email)
      server.middlewares.use('/api/send-email', (req, res, next) => {
        if (req.method !== 'POST') {
          return next();
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            req.body = body ? JSON.parse(body) : {};
            res.status = (code) => {
              res.statusCode = code;
              return res;
            };
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return res;
            };
            await handler(req, res);
          } catch (err) {
            console.error('❌ Erro no envio de e-mail via Vite dev server:', err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Erro interno no servidor dev' }));
            }
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), apiDevServerPlugin()],
    server: {
      host: true, // Libera para acesso na rede local (0.0.0.0)
      port: 5173,
    },
    preview: {
      host: true,
      port: 4173,
    },
  };
});
