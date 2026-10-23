# cache-bust: 2026-10-23-v5
# Usando node:20-slim (Debian/glibc) - compatível com binários nativos do Rolldown/Vite8
FROM node:20-slim

WORKDIR /app

# Instala TODAS as dependências (devDependencies incluídas — Vite/Rolldown são devDependencies)
COPY package*.json ./
RUN NODE_ENV=development npm ci --no-audit --no-fund

# Copia todo o código fonte
COPY . .

# ── Variáveis VITE_* embutidas no bundle pelo Vite em tempo de build ──────────
# Estas variáveis são PÚBLICAS por natureza (Vite as incorpora no bundle JS).
# Não precisam de Build Args no Easypanel — estão fixas aqui no Dockerfile.
ENV VITE_SUPABASE_URL=https://hnqzpwxdarllezyhijqh.supabase.co
ENV VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_5e8E8brZs6dS08og8slVPQ_durURMQH
ENV VITE_ADMIN_PASSWORD=cajuru@2026

# Build do React com Vite
RUN npm run build

# ── Runtime ───────────────────────────────────────────────────────────────────
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
