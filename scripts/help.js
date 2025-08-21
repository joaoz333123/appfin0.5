#!/usr/bin/env node

/**
 * =============================================================================
 * SCRIPT DE AJUDA - AppFin v0.5
 * =============================================================================
 *
 * Este script fornece ajuda e documentação para configuração do AppFin.
 */

console.log(`
🚀 APPFIN v0.5 - SISTEMA DE CONTROLE DE COMPRAS

=============================================================================
                           COMANDOS DISPONÍVEIS
=============================================================================

🔧 CONFIGURAÇÃO:
  npm run setup           Configuração inicial completa
  npm run validate-env    Validar variáveis de ambiente
  npm run check-env       Verificação rápida do ambiente

🏗️  DESENVOLVIMENTO:
  npm run dev             Iniciar servidor de desenvolvimento
  npm run build           Construir para produção  
  npm run start           Iniciar servidor de produção
  npm run lint            Verificar código com ESLint
  npm run typecheck       Verificar tipos TypeScript

📚 AJUDA:
  npm run help            Mostrar esta ajuda

=============================================================================
                        CONFIGURAÇÃO INICIAL RÁPIDA
=============================================================================

1️⃣  CONFIGURAR AMBIENTE:
   npm run setup

2️⃣  CONFIGURAR APIS (edite .env.local):
   • Supabase: https://supabase.com
   • Google OAuth: https://console.cloud.google.com
   • Gemini AI: https://makersuite.google.com/app/apikey

3️⃣  CONFIGURAR BANCO:
   • Execute db/sql/001_initial_schema.sql no Supabase
   • Configure bucket 'pc-anexos' no Storage

4️⃣  INICIAR APLICAÇÃO:
   npm run dev

=============================================================================
                           ESTRUTURA DO PROJETO
=============================================================================

📁 PRINCIPAIS DIRETÓRIOS:
  app/                    Páginas e API routes (Next.js 14)
  components/             Componentes React reutilizáveis
  lib/                    Bibliotecas e utilitários
  db/                     Scripts SQL e schemas
  hooks/                  Custom React hooks
  types/                  Definições TypeScript

📄 ARQUIVOS DE CONFIGURAÇÃO:
  .env.local              Suas variáveis de ambiente (não commitado)
  env.template            Template com instruções completas
  env.example             Exemplo sanitizado para referência
  setup.sh                Script de configuração automática

=============================================================================
                           RESOLUÇÃO DE PROBLEMAS
=============================================================================

🚨 PROBLEMAS COMUNS:

❌ Erro: "Supabase client not configured"
   → Execute: npm run validate-env
   → Configure SUPABASE_URL e SUPABASE_ANON_KEY

❌ Erro: "Google OAuth not working"
   → Verifique GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET
   → Configure URLs de redirecionamento no Google Console

❌ Erro: "Gemini API failed"  
   → Verifique GEMINI_API_KEY
   → Confirme que a API está habilitada

❌ Erro de build/compile
   → Execute: npm run typecheck
   → Execute: npm run lint
   → Verifique logs de erro detalhados

🔍 VERIFICAÇÃO DE STATUS:
  npm run check-env       Status rápido
  npm run validate-env    Relatório detalhado

=============================================================================
                              RECURSOS ÚTEIS
=============================================================================

📚 DOCUMENTAÇÃO:
  README.md               Documentação completa do projeto
  env.template            Instruções detalhadas de configuração
  
🌐 LINKS EXTERNOS:
  Supabase Docs:         https://supabase.com/docs
  Next.js Docs:          https://nextjs.org/docs
  NextAuth.js Docs:      https://next-auth.js.org
  Google Cloud Console:  https://console.cloud.google.com
  Gemini AI Studio:      https://makersuite.google.com

🆘 SUPORTE:
  GitHub Issues:         Reporte bugs e sugestões
  Email:                 suporte@appfin.com

=============================================================================

💡 DICA: Execute 'npm run setup' sempre que houver dúvidas sobre configuração!

🎯 OBJETIVO: Simplicar aprovações de compra com IA de forma segura e eficiente.

=============================================================================
`);
