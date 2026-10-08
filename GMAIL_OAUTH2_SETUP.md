# 📧 Guia de Configuração - Envio de E-mails via Gmail OAuth2 API

Este projeto agora suporta o envio de e-mails de confirmação diretamente pela sua conta do **Gmail utilizando a API oficial OAuth2 do Google**.

---

## 🛠️ Passo a Passo para Obter as Credenciais no Google Cloud

### 1. Criar um Projeto no Google Cloud Console
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. No topo da página, clique no seletor de projetos e selecione **"Novo Projeto"** (ou escolha um projeto existente).
3. Dê um nome ao projeto (ex: `Formulario-Semana-Univ`) e clique em **Criar**.

---

### 2. Ativar a Gmail API
1. No menu lateral esquerdo, vá em **APIs e Serviços** > **Biblioteca**.
2. Pesquise por **Gmail API**.
3. Clique sobre **Gmail API** e clique em **Ativar**.

---

### 3. Configurar a Tela de Permissão OAuth (OAuth Consent Screen)
1. Vá em **APIs e Serviços** > **Tela de permissão OAuth**.
2. Escolha o tipo de usuário: **Externo** (External) e clique em **Criar**.
3. Preencha os campos obrigatórios:
   - **Nome do app:** `Semana Universitária`
   - **E-mail para suporte do usuário:** Seu e-mail do Gmail
   - **Dados de contato do desenvolvedor:** Seu e-mail
4. Clique em **Salvar e Continuar**.
5. Na aba **Escopos (Scopes)**, clique em **Adicionar ou Remover Escopos** e adicione:
   - `https://mail.google.com/` ou `https://www.googleapis.com/auth/gmail.send`
6. Na aba **Usuários de teste (Test users)**, adicione o seu próprio endereço de e-mail do Gmail.
7. Clique em **Salvar e Continuar**.

---

### 4. Criar as Credenciais OAuth 2.0 (Client ID & Client Secret)
1. Vá em **APIs e Serviços** > **Credenciais**.
2. Clique em **+ Criar Credenciais** > **ID do cliente OAuth**.
3. Em **Tipo de aplicativo**, selecione **Aplicativo da Web**.
4. Em **URIs de redirecionamento autorizados**, adicione a seguinte URL do OAuth Playground:
   - `https://developers.google.com/oauthplayground`
5. Clique em **Criar**.
6. **Guarde** o **Client ID** e o **Client Secret** gerados!

---

### 5. Obter o Refresh Token pelo OAuth Playground
1. Acesse o [OAuth 2.0 Playground do Google](https://developers.google.com/oauthplayground).
2. Clique no ícone de engrenagem ⚙️ (no canto superior direito) e:
   - Marque a opção **"Use your own OAuth credentials"**.
   - Cole seu **OAuth Client ID** e seu **OAuth Client Secret**.
3. No painel esquerdo, role até **Gmail API v1** e selecione:
   - `https://mail.google.com/` (ou digite `https://www.googleapis.com/auth/gmail.send`).
4. Clique no botão azul **Authorize APIs**.
5. Faça login com a sua conta do Gmail e confirme a autorização.
6. Você será redirecionado de volta para o Playground. No **Passo 2**, clique em **Exchange authorization code for tokens**.
7. O campo **Refresh token** será exibido na tela. **Copie esse valor!**

---

## ⚙️ Onde Inserir as Variáveis de Ambiente

### No arquivo `.env.local` (para testes e desenvolvimento local):
```env
GMAIL_USER=seu-email@gmail.com
GMAIL_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=seu_client_secret
GMAIL_REFRESH_TOKEN=seu_refresh_token
GMAIL_FROM_NAME=Semana Universitária Cajuruense
```

### No Painel da Vercel (para Produção):
1. Acesse o dashboard do seu projeto na [Vercel](https://vercel.com).
2. Vá em **Settings** > **Environment Variables**.
3. Adicione as seguintes variáveis de ambiente:
   - `GMAIL_USER`
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
   - `GMAIL_REFRESH_TOKEN`
   - `GMAIL_FROM_NAME` (Opcional, ex: `Semana Universitária Cajuruense`)

---

## 🔄 Como Funciona no Sistema
1. Quando um participante se cadastra, o sistema chama a rota Serverless `/api/send-email`.
2. Se as variáveis do Gmail OAuth2 estiverem preenchidas, o servidor usa o `nodemailer` para renovar o access token automaticamente e enviar o e-mail pela sua conta do Gmail.
3. Caso o Gmail não esteja configurado, o sistema tenta enviar via Resend API (se configurado) como fallback.
