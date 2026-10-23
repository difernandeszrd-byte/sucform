# cache-bust: 2026-10-23-v2
# Usando node:20-slim (Debian/glibc) - compatível com binários nativos do Rolldown/Vite8
FROM node:20-slim

WORKDIR /app

# Instala TODAS as dependências (devDependencies incluídas — Vite/Rolldown são devDependencies)
COPY package*.json ./
RUN NODE_ENV=development npm ci --no-audit --no-fund

# Copia todo o código fonte
COPY . .

# ── Variáveis VITE_* embutidas no bundle pelo Vite em tempo de build ──────────
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_ADMIN_PASSWORD

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_ADMIN_PASSWORD=$VITE_ADMIN_PASSWORD

# Build do React com Vite
RUN npm run build

# ── Runtime ───────────────────────────────────────────────────────────────────
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
