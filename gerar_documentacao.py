# -*- coding: utf-8 -*-
"""
Gerador de Documentação PDF - Projeto Sucform
Semana Universitária Cajuruense
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from datetime import datetime
import os

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "Documentacao_Sucform.pdf")

# ── Paleta de cores ──────────────────────────────────────────────────────────
AZUL_ESCURO   = colors.HexColor("#0f172a")
AZUL_MEDIO    = colors.HexColor("#1e293b")
AZUL_CLARO    = colors.HexColor("#334155")
INDIGO        = colors.HexColor("#4f46e5")
INDIGO_CLARO  = colors.HexColor("#818cf8")
VERDE         = colors.HexColor("#22c55e")
AMARELO       = colors.HexColor("#f59e0b")
VERMELHO      = colors.HexColor("#ef4444")
CINZA_TEXTO   = colors.HexColor("#94a3b8")
BRANCO        = colors.white
CINZA_LINHA   = colors.HexColor("#e2e8f0")

def build_styles():
    base = getSampleStyleSheet()

    styles = {
        "titulo_principal": ParagraphStyle(
            "titulo_principal",
            fontName="Helvetica-Bold",
            fontSize=22,
            textColor=BRANCO,
            alignment=TA_CENTER,
            spaceAfter=4,
        ),
        "subtitulo_principal": ParagraphStyle(
            "subtitulo_principal",
            fontName="Helvetica",
            fontSize=11,
            textColor=INDIGO_CLARO,
            alignment=TA_CENTER,
            spaceAfter=2,
        ),
        "secao": ParagraphStyle(
            "secao",
            fontName="Helvetica-Bold",
            fontSize=14,
            textColor=INDIGO,
            spaceBefore=16,
            spaceAfter=6,
            borderPad=4,
        ),
        "subsecao": ParagraphStyle(
            "subsecao",
            fontName="Helvetica-Bold",
            fontSize=11,
            textColor=AZUL_ESCURO,
            spaceBefore=10,
            spaceAfter=4,
        ),
        "corpo": ParagraphStyle(
            "corpo",
            fontName="Helvetica",
            fontSize=9.5,
            textColor=colors.HexColor("#1e293b"),
            leading=15,
            alignment=TA_JUSTIFY,
            spaceAfter=5,
        ),
        "codigo": ParagraphStyle(
            "codigo",
            fontName="Courier",
            fontSize=8.5,
            textColor=colors.HexColor("#1e293b"),
            backColor=colors.HexColor("#f1f5f9"),
            leading=13,
            leftIndent=10,
            rightIndent=10,
            spaceBefore=4,
            spaceAfter=4,
            borderColor=CINZA_LINHA,
            borderWidth=1,
            borderPad=6,
            borderRadius=4,
        ),
        "nota": ParagraphStyle(
            "nota",
            fontName="Helvetica-Oblique",
            fontSize=9,
            textColor=colors.HexColor("#475569"),
            leftIndent=12,
            spaceAfter=6,
        ),
        "badge_verde": ParagraphStyle(
            "badge_verde",
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=VERDE,
            spaceAfter=3,
        ),
        "badge_amarelo": ParagraphStyle(
            "badge_amarelo",
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=AMARELO,
            spaceAfter=3,
        ),
        "rodape": ParagraphStyle(
            "rodape",
            fontName="Helvetica",
            fontSize=8,
            textColor=CINZA_TEXTO,
            alignment=TA_CENTER,
        ),
    }
    return styles


def header_banner(styles):
    """Cabeçalho com fundo escuro."""
    data = [[
        Paragraph("🚀  Documentação Técnica — Projeto Sucform", styles["titulo_principal"]),
    ]]
    sub_data = [[
        Paragraph("Semana Universitária Cajuruense  •  formulario-react-psi.vercel.app", styles["subtitulo_principal"]),
    ]]
    date_str = datetime.now().strftime("%d/%m/%Y  %H:%M")
    date_data = [[
        Paragraph(f"Gerado em: {date_str}", styles["subtitulo_principal"]),
    ]]

    t1 = Table(data, colWidths=[17*cm])
    t1.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), AZUL_ESCURO),
        ("TOPPADDING",    (0,0), (-1,-1), 20),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING",   (0,0), (-1,-1), 16),
        ("RIGHTPADDING",  (0,0), (-1,-1), 16),
        ("ROUNDEDCORNERS", [8]),
    ]))

    t2 = Table(sub_data, colWidths=[17*cm])
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), AZUL_ESCURO),
        ("TOPPADDING",    (0,0), (-1,-1), 2),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING",   (0,0), (-1,-1), 16),
        ("RIGHTPADDING",  (0,0), (-1,-1), 16),
    ]))

    t3 = Table(date_data, colWidths=[17*cm])
    t3.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), AZUL_ESCURO),
        ("TOPPADDING",    (0,0), (-1,-1), 2),
        ("BOTTOMPADDING", (0,0), (-1,-1), 18),
        ("LEFTPADDING",   (0,0), (-1,-1), 16),
        ("RIGHTPADDING",  (0,0), (-1,-1), 16),
        ("ROUNDEDCORNERS", [8]),
    ]))

    return [t1, t2, t3, Spacer(1, 0.4*cm)]


def info_table(rows, col_widths=None):
    """Tabela informativa genérica."""
    if col_widths is None:
        col_widths = [5*cm, 12*cm]
    t = Table(rows, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (0, -1), colors.HexColor("#f8fafc")),
        ("BACKGROUND",    (1, 0), (1, -1), BRANCO),
        ("FONTNAME",      (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME",      (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 0), (-1,-1), 9),
        ("TEXTCOLOR",     (0, 0), (0, -1), AZUL_ESCURO),
        ("TEXTCOLOR",     (1, 0), (1, -1), colors.HexColor("#334155")),
        ("GRID",          (0, 0), (-1,-1), 0.5, CINZA_LINHA),
        ("ROWBACKGROUNDS",(0, 0), (-1,-1), [colors.HexColor("#f8fafc"), BRANCO]),
        ("TOPPADDING",    (0, 0), (-1,-1), 6),
        ("BOTTOMPADDING", (0, 0), (-1,-1), 6),
        ("LEFTPADDING",   (0, 0), (-1,-1), 8),
        ("RIGHTPADDING",  (0, 0), (-1,-1), 8),
        ("VALIGN",        (0, 0), (-1,-1), "MIDDLE"),
    ]))
    return t


def status_table(rows):
    """Tabela com coluna de status colorida."""
    t = Table(rows, colWidths=[8*cm, 5*cm, 4*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), INDIGO),
        ("TEXTCOLOR",     (0, 0), (-1, 0), BRANCO),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME",      (0, 1), (-1,-1), "Helvetica"),
        ("FONTSIZE",      (0, 0), (-1,-1), 9),
        ("GRID",          (0, 0), (-1,-1), 0.5, CINZA_LINHA),
        ("ROWBACKGROUNDS",(0, 1), (-1,-1), [BRANCO, colors.HexColor("#f8fafc")]),
        ("TOPPADDING",    (0, 0), (-1,-1), 7),
        ("BOTTOMPADDING", (0, 0), (-1,-1), 7),
        ("LEFTPADDING",   (0, 0), (-1,-1), 8),
        ("RIGHTPADDING",  (0, 0), (-1,-1), 8),
        ("ALIGN",         (1, 0), (-1,-1), "CENTER"),
        ("VALIGN",        (0, 0), (-1,-1), "MIDDLE"),
    ]))
    return t


def eventos_table(rows):
    t = Table(rows, colWidths=[6*cm, 7*cm, 4*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR",     (0, 0), (-1, 0), BRANCO),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME",      (0, 1), (-1,-1), "Helvetica"),
        ("FONTSIZE",      (0, 0), (-1,-1), 9),
        ("GRID",          (0, 0), (-1,-1), 0.5, CINZA_LINHA),
        ("ROWBACKGROUNDS",(0, 1), (-1,-1), [BRANCO, colors.HexColor("#f0fdf4")]),
        ("TOPPADDING",    (0, 0), (-1,-1), 7),
        ("BOTTOMPADDING", (0, 0), (-1,-1), 7),
        ("LEFTPADDING",   (0, 0), (-1,-1), 8),
        ("RIGHTPADDING",  (0, 0), (-1,-1), 8),
        ("VALIGN",        (0, 0), (-1,-1), "MIDDLE"),
    ]))
    return t


def hosting_table(rows):
    t = Table(rows, colWidths=[5*cm, 6*cm, 6*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ("TEXTCOLOR",     (0, 0), (-1, 0), BRANCO),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME",      (0, 1), (-1,-1), "Helvetica"),
        ("FONTSIZE",      (0, 0), (-1,-1), 9),
        ("GRID",          (0, 0), (-1,-1), 0.5, CINZA_LINHA),
        ("ROWBACKGROUNDS",(0, 1), (-1,-1), [BRANCO, colors.HexColor("#f8fafc")]),
        ("TOPPADDING",    (0, 0), (-1,-1), 7),
        ("BOTTOMPADDING", (0, 0), (-1,-1), 7),
        ("LEFTPADDING",   (0, 0), (-1,-1), 8),
        ("RIGHTPADDING",  (0, 0), (-1,-1), 8),
        ("VALIGN",        (0, 0), (-1,-1), "MIDDLE"),
        ("ALIGN",         (1, 0), (-1,-1), "CENTER"),
    ]))
    return t


def divider():
    return HRFlowable(width="100%", thickness=1, color=CINZA_LINHA, spaceAfter=4, spaceBefore=4)


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=1.8*cm,
        bottomMargin=2*cm,
        title="Documentação Técnica — Sucform",
        author="Antigravity AI",
        subject="Formulário React - Semana Universitária Cajuruense",
    )

    s = build_styles()
    story = []

    # ── Cabeçalho ─────────────────────────────────────────────────────────────
    story.extend(header_banner(s))

    # ════════════════════════════════════════════════════════════════════════
    # 1. VISÃO GERAL DO PROJETO
    # ════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("1. Visão Geral do Projeto", s["secao"]))
    story.append(divider())
    story.append(Paragraph(
        "O Sucform é uma aplicação web desenvolvida em React com Vite para gerenciar inscrições "
        "da <b>Semana Universitária Cajuruense</b>. O sistema permite cadastro de participantes, "
        "envio automático de e-mails de confirmação via Gmail OAuth2, painel administrativo para "
        "gerenciamento de inscrições e exportação de dados.",
        s["corpo"]
    ))
    story.append(Spacer(1, 0.2*cm))
    story.append(info_table([
        ["App ID Firebase",   "sucform"],
        ["URL de Produção",   "https://formulario-react-psi.vercel.app"],
        ["Plataforma Hosting","Vercel (Hobby Plan — Gratuito)"],
        ["Banco de Dados",    "Firebase Firestore (principal)"],
        ["Banco Realtime",    "Firebase Realtime Database"],
        ["Autenticação E-mail","Gmail OAuth2 via API REST"],
        ["Analytics",         "Firebase Analytics (G-L62ETPK0DM)"],
        ["Framework",         "React 19 + Vite 8 + React Hook Form + Zod"],
    ]))

    # ════════════════════════════════════════════════════════════════════════
    # 2. CONFIGURAÇÃO DO FIREBASE
    # ════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("2. Configuração do Firebase", s["secao"]))
    story.append(divider())
    story.append(Paragraph(
        "O arquivo <b>src/firebase.js</b> foi configurado e atualizado com todas as credenciais "
        "do projeto sucform, incluindo suporte ao Analytics e ao Realtime Database.",
        s["corpo"]
    ))

    story.append(Paragraph("2.1  Campos configurados no firebaseConfig:", s["subsecao"]))
    story.append(info_table([
        ["apiKey",            "AIzaSyDnuZkYMkDpgjZ2Jug1KLJBAEfX5oduq64"],
        ["authDomain",        "sucform.firebaseapp.com"],
        ["databaseURL",       "https://sucform-default-rtdb.firebaseio.com  ← ADICIONADO"],
        ["projectId",         "sucform"],
        ["storageBucket",     "sucform.firebasestorage.app"],
        ["messagingSenderId", "806068952566"],
        ["appId",             "1:806068952566:web:304f61ca0d16ce1bd5fbd7"],
        ["measurementId",     "G-L62ETPK0DM  ← ADICIONADO (Analytics)"],
    ]))

    story.append(Paragraph("2.2  Padrão de segurança implementado:", s["subsecao"]))
    story.append(Paragraph(
        "Todas as credenciais seguem o padrão de fallback seguro: variáveis de ambiente "
        "(<b>VITE_FIREBASE_*</b>) têm prioridade sobre os valores padrão embutidos no código. "
        "Isso permite sobrescrever credenciais em produção sem alterar o código-fonte.",
        s["corpo"]
    ))
    story.append(Paragraph(
        "Exemplo de variável: VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey",
        s["codigo"]
    ))

    story.append(Paragraph("2.3  Firebase Analytics — inicialização segura:", s["subsecao"]))
    story.append(Paragraph(
        "O Analytics é inicializado com verificação <b>isSupported()</b> para garantir "
        "compatibilidade com qualquer ambiente (SSR, navegadores sem cookies, etc.).",
        s["corpo"]
    ))
    story.append(Paragraph(
        "isSupported().then((supported) => {\n"
        "  if (supported) {\n"
        "    analytics = getAnalytics(app);\n"
        "  }\n"
        "});",
        s["codigo"]
    ))

    story.append(Paragraph("2.4  Helper logAnalyticsEvent:", s["subsecao"]))
    story.append(Paragraph(
        "Uma função utilitária foi criada para rastrear eventos de forma segura, "
        "mesmo se o Analytics ainda não estiver pronto:",
        s["corpo"]
    ))
    story.append(Paragraph(
        "export function logAnalyticsEvent(eventName, params = {}) {\n"
        "  if (analytics) logEvent(analytics, eventName, params);\n"
        "}",
        s["codigo"]
    ))

    # ════════════════════════════════════════════════════════════════════════
    # 3. RASTREAMENTO DE EVENTOS — ANALYTICS
    # ════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("3. Rastreamento de Eventos — Firebase Analytics", s["secao"]))
    story.append(divider())
    story.append(Paragraph(
        "Eventos foram adicionados ao arquivo <b>src/pages/InscricaoForm.jsx</b> nos pontos "
        "mais importantes da jornada do usuário, para popular o painel do Firebase Analytics "
        "com dados reais de uso.",
        s["corpo"]
    ))
    story.append(Spacer(1, 0.2*cm))
    story.append(eventos_table([
        ["Evento",                  "Quando dispara",                        "Parâmetros"],
        ["page_view",               "Ao abrir o formulário",                 "page_title, page_location"],
        ["inscricao_concluida",     "Inscrição salva com sucesso",           "chefe_de_equipe, cidade, sexo"],
        ["inscricao_cpf_duplicado", "CPF já cadastrado bloqueado",           "—"],
        ["inscricao_erro",          "Erro ao salvar inscrição",              "message"],
        ["email_confirmacao_enviado","E-mail enviado com sucesso",           "method"],
    ]))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        "⏱  Importante: O Firebase Analytics leva 24 a 48 horas para exibir dados no painel. "
        "Os eventos aparecem em Firebase Console → Analytics → Eventos.",
        s["nota"]
    ))

    # ════════════════════════════════════════════════════════════════════════
    # 4. DEPLOY NO VERCEL
    # ════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("4. Deploy no Vercel", s["secao"]))
    story.append(divider())
    story.append(Paragraph(
        "O deploy é realizado via <b>Vercel CLI</b> diretamente do diretório do projeto. "
        "Foram executados 3 deploys em produção durante a sessão.",
        s["corpo"]
    ))

    story.append(Paragraph("4.1  Histórico de Deploys realizados:", s["subsecao"]))
    story.append(status_table([
        ["Deploy",                          "ID",                           "Status"],
        ["Deploy inicial (configuração)",   "dpl_DsGJhYhbme8Q...",          "✅ READY"],
        ["Atualização Refresh Token",       "dpl_HbwVMssjUjMD...",          "✅ READY"],
        ["Ativação Firebase Analytics",     "dpl_9qvSPZcLrRVG...",          "✅ READY"],
    ]))

    story.append(Paragraph("4.2  Comando de deploy:", s["subsecao"]))
    story.append(Paragraph("npx vercel --prod --yes", s["codigo"]))

    story.append(Paragraph("4.3  Build info:", s["subsecao"]))
    story.append(info_table([
        ["Build Tool",       "Vite 8.3.1"],
        ["Módulos",          "1.927 transformados"],
        ["Tempo de build",   "~1.2 segundos"],
        ["Servidor",         "Washington D.C., USA (iad1)"],
        ["CPU / RAM",        "2 cores / 8 GB"],
        ["Bundle JS",        "825 kB (251 kB gzip)"],
        ["Bundle CSS",       "15.3 kB (3.6 kB gzip)"],
        ["Cache",            "Restaurado do deploy anterior"],
    ]))

    # ════════════════════════════════════════════════════════════════════════
    # 5. ATUALIZAÇÃO DO GMAIL OAUTH2 REFRESH TOKEN
    # ════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("5. Atualização do Gmail OAuth2 — Refresh Token", s["secao"]))
    story.append(divider())
    story.append(Paragraph(
        "O sistema de envio de e-mails utiliza <b>Gmail OAuth2</b> para autenticação segura. "
        "O Refresh Token foi renovado e atualizado tanto no <b>.env.local</b> (desenvolvimento) "
        "quanto nas <b>variáveis de ambiente do Vercel</b> (produção).",
        s["corpo"]
    ))

    story.append(Paragraph("5.1  Procedimento de atualização:", s["subsecao"]))
    story.append(info_table([
        ["1. Remover token antigo",  "npx vercel env rm GMAIL_REFRESH_TOKEN production --yes"],
        ["2. Adicionar token novo",  'npx vercel env add GMAIL_REFRESH_TOKEN production --value "TOKEN" --yes'],
        ["3. Redeploy",              "npx vercel --prod --yes"],
        ["Tipo no Vercel",           "Secret (oculto no painel, não disponível em pulls)"],
    ], col_widths=[5*cm, 12*cm]))

    story.append(Paragraph("5.2  Variáveis de ambiente Gmail configuradas:", s["subsecao"]))
    story.append(info_table([
        ["GMAIL_USER",           "difernandeszrd@gmail.com"],
        ["GMAIL_CLIENT_ID",      "863804350283-llm2vovk9jm0a83e01lhqht3u2raln0k.apps.googleusercontent.com"],
        ["GMAIL_CLIENT_SECRET",  "GOCSPX-*** (oculto)"],
        ["GMAIL_REFRESH_TOKEN",  "Atualizado em 21/10/2026 — armazenado como Secret"],
        ["GMAIL_FROM_NAME",      "Semana Universitária Cajuruense"],
    ]))

    story.append(Paragraph("5.3  Fluxo de envio de e-mails:", s["subsecao"]))
    story.append(Paragraph(
        "O sistema tenta enviar o e-mail em 3 etapas em cascata (fallback):",
        s["corpo"]
    ))
    story.append(info_table([
        ["1ª tentativa", "Rota serverless /api/send-email (Gmail OAuth2 no backend via Nodemailer)"],
        ["2ª tentativa", "Gmail OAuth2 REST API diretamente no navegador (dev fallback)"],
        ["3ª tentativa", "Resend REST API (se VITE_RESEND_API_KEY estiver configurado)"],
        ["Falha total",  "Cadastro é salvo normalmente; e-mail não bloqueia inscrição"],
    ], col_widths=[4*cm, 13*cm]))

    # ════════════════════════════════════════════════════════════════════════
    # 6. ARQUITETURA DO BANCO DE DADOS
    # ════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("6. Arquitetura do Banco de Dados", s["secao"]))
    story.append(divider())
    story.append(Paragraph(
        "O projeto utiliza <b>Firebase Firestore</b> como banco principal, com fallback "
        "automático para <b>localStorage</b> em caso de timeout ou falha de conexão. "
        "O <b>Realtime Database</b> está configurado para uso futuro.",
        s["corpo"]
    ))
    story.append(info_table([
        ["Coleção inscricoes",  "Armazena todos os cadastros dos participantes"],
        ["Documento config/inscricoes", "Controla abertura/fechamento das inscrições"],
        ["Timeout Firestore",   "3.500 ms — após isso, usa localStorage"],
        ["Realtime Database",   "Configurado (databaseURL) — disponível para uso futuro"],
        ["Campos da inscrição", "cpf, nome, email, sexo, estado_civil, data_nascimento,\nendereco, bairro, cidade_estado, telefone, idade, chefe_de_equipe, created_at"],
    ]))

    # ════════════════════════════════════════════════════════════════════════
    # 7. RECOMENDAÇÕES DE HOSTING
    # ════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("7. Recomendações de Hosting", s["secao"]))
    story.append(divider())
    story.append(Paragraph(
        "Com base na arquitetura atual do projeto (React SPA + Serverless API), "
        "a recomendação é <b>manter o Vercel como plataforma de hosting</b>.",
        s["corpo"]
    ))

    story.append(Paragraph("7.1  Comparativo de plataformas:", s["subsecao"]))
    story.append(hosting_table([
        ["Recurso",                   "Firebase Hosting",          "Vercel (atual) ✅"],
        ["SPA estática",              "✅ Gratuito",               "✅ Gratuito"],
        ["Serverless API (/api/*)",   "❌ Requer Blaze (pago)",    "✅ Gratuito incluído"],
        ["CDN Global",                "✅ Sim",                    "✅ Sim"],
        ["Deploy via CLI",            "✅ Sim",                    "✅ Sim"],
        ["SSR (Next.js)",             "App Hosting (pago)",        "✅ Gratuito"],
        ["Variáveis de ambiente",     "✅ Sim",                    "✅ Sim"],
        ["Plano necessário",          "Blaze (pago para API)",     "Hobby (gratuito)"],
    ]))

    story.append(Paragraph("7.2  Motivo da recomendação — Vercel:", s["subsecao"]))
    story.append(Paragraph(
        "O projeto possui uma rota serverless (<b>/api/send-email</b>) que o Vercel gerencia "
        "nativamente sem custo adicional. Migrar para Firebase Hosting exigiria upgrade para "
        "o plano Blaze (pago) para manter a funcionalidade de envio de e-mails no servidor. "
        "A combinação <b>Vercel (hosting) + Firebase (banco/analytics)</b> é a arquitetura "
        "ideal e mais econômica para este projeto.",
        s["corpo"]
    ))

    story.append(Paragraph("7.3  Migração futura (se necessário):", s["subsecao"]))
    story.append(Paragraph(
        "Se futuramente o projeto migrar para Next.js com SSR, os passos para migrar para "
        "Firebase App Hosting são: (1) Conectar repositório GitHub ao Firebase App Hosting, "
        "(2) Configurar o build, (3) Atualizar configurações de DNS.",
        s["corpo"]
    ))

    # ════════════════════════════════════════════════════════════════════════
    # 8. ESTRUTURA DO PROJETO
    # ════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("8. Estrutura de Arquivos Relevantes", s["secao"]))
    story.append(divider())
    story.append(info_table([
        ["src/firebase.js",              "Config Firebase, Analytics, Realtime DB, helper logAnalyticsEvent"],
        ["src/services/firestore.js",    "CRUD de inscrições e config (Firestore + localStorage fallback)"],
        ["src/services/emailService.js", "Envio de e-mails (Gmail OAuth2 + Resend fallback)"],
        ["src/pages/InscricaoForm.jsx",  "Formulário principal + rastreamento de eventos Analytics"],
        ["api/send-email.js",            "Serverless function — processa envio de e-mail no backend"],
        ["vercel.json",                  "Config de rewrites: /api/* e SPA fallback"],
        [".env.local",                   "Credenciais locais (não enviado ao Git)"],
        ["server.js",                    "Servidor Express (uso local/Docker)"],
    ], col_widths=[5.5*cm, 11.5*cm]))

    # ════════════════════════════════════════════════════════════════════════
    # 9. CHECKLIST DE VERIFICAÇÃO
    # ════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("9. Checklist de Verificação do Sistema", s["secao"]))
    story.append(divider())
    story.append(status_table([
        ["Item",                              "Status",   "Observação"],
        ["Firebase Firestore conectado",      "✅ OK",    "Credenciais corretas"],
        ["Firebase Analytics ativado",        "✅ OK",    "measurementId configurado"],
        ["Realtime Database configurado",     "✅ OK",    "databaseURL adicionado"],
        ["Gmail OAuth2 Refresh Token",        "✅ OK",    "Atualizado em 21/10/2026"],
        ["Variáveis no Vercel",               "✅ OK",    "Secrets configurados"],
        ["Deploy em produção",                "✅ OK",    "3 deploys realizados"],
        ["Rastreamento de eventos",           "✅ OK",    "5 eventos implementados"],
        ["Fallback localStorage",             "✅ OK",    "Ativo para offline/timeout"],
        ["GMAIL_REFRESH_TOKEN no .env.local", "✅ OK",    "Sincronizado"],
    ]))

    # ════════════════════════════════════════════════════════════════════════
    # 10. PRÓXIMOS PASSOS RECOMENDADOS
    # ════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("10. Próximos Passos Recomendados", s["secao"]))
    story.append(divider())
    story.append(info_table([
        ["Code Splitting",        "Aplicar dynamic import() para reduzir o bundle JS (825 kB → idealmente <300 kB)"],
        ["Git + Auto Deploy",     "Conectar repositório Git ao Vercel para deploy automático a cada push"],
        ["Regras Firestore",      "Revisar e restringir regras de segurança do Firestore no Firebase Console"],
        ["Backup Firestore",      "Configurar exportação automática dos dados para Google Cloud Storage"],
        ["Monitorar Analytics",   "Aguardar 48h e acompanhar os eventos no Firebase Analytics Dashboard"],
        ["Renovar Token Gmail",   "O Refresh Token OAuth2 pode expirar — renovar quando emails falharem"],
    ], col_widths=[4.5*cm, 12.5*cm]))

    # ════════════════════════════════════════════════════════════════════════
    # RODAPÉ
    # ════════════════════════════════════════════════════════════════════════
    story.append(Spacer(1, 0.6*cm))
    story.append(divider())
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        f"Documentação gerada automaticamente em {datetime.now().strftime('%d/%m/%Y às %H:%M')}  •  "
        "Projeto: Sucform — Semana Universitária Cajuruense  •  "
        "Gerado por Antigravity AI (Google DeepMind)",
        s["rodape"]
    ))

    doc.build(story)
    print(f"\nPDF gerado com sucesso!\nCaminho: {OUTPUT_PATH}\n")


if __name__ == "__main__":
    build_pdf()
