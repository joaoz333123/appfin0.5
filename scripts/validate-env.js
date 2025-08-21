#!/usr/bin/env node

/**
 * =============================================================================
 * SCRIPT DE VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE - AppFin v0.5
 * =============================================================================
 *
 * Este script valida a configuração de ambiente e gera relatórios detalhados.
 *
 * Uso:
 *   npm run validate-env        # Relatório completo
 *   npm run check-env           # Resumo rápido
 *   node scripts/validate-env.js --help
 */

const fs = require('fs');
const path = require('path');

// Carregar dotenv se disponível
try {
  require('dotenv').config({ path: '.env.local' });
} catch (error) {
  console.warn(
    '⚠️  dotenv não encontrado. Continuando sem carregamento automático...'
  );
}

// Importar a lógica de validação (simulada para compatibilidade com CommonJS)
const ENV_VARIABLES = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'URL do projeto Supabase',
    required: true,
    sensitive: false,
    minLength: 20,
    pattern: /^https:\/\/[a-z0-9]+\.supabase\.co$/,
    helpUrl: 'https://supabase.com/docs/guides/getting-started',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Chave anônima do Supabase',
    required: true,
    sensitive: true,
    minLength: 100,
    pattern: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Chave de serviço do Supabase',
    required: true,
    sensitive: true,
    minLength: 100,
    pattern: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
  },
  {
    name: 'NEXTAUTH_URL',
    description: 'URL base da aplicação',
    required: true,
    sensitive: false,
    minLength: 10,
    pattern: /^https?:\/\/.+/,
  },
  {
    name: 'NEXTAUTH_SECRET',
    description: 'Secret para assinatura de tokens',
    required: true,
    sensitive: true,
    minLength: 32,
  },
  {
    name: 'GOOGLE_CLIENT_ID',
    description: 'ID do cliente Google OAuth',
    required: true,
    sensitive: false,
    minLength: 20,
    pattern: /^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/,
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    description: 'Secret do cliente Google OAuth',
    required: true,
    sensitive: true,
    minLength: 20,
    pattern: /^GOCSPX-[A-Za-z0-9_-]+$/,
  },
  {
    name: 'GEMINI_API_KEY',
    description: 'Chave da API Gemini',
    required: true,
    sensitive: true,
    minLength: 30,
    pattern: /^AIzaSy[A-Za-z0-9_-]+$/,
    helpUrl: 'https://makersuite.google.com/app/apikey',
  },
  {
    name: 'GEMINI_MODEL',
    description: 'Modelo do Gemini a ser usado',
    required: false,
    sensitive: false,
    minLength: 5,
  },
  {
    name: 'VERCEL_URL',
    description: 'URL do deploy no Vercel',
    required: false,
    sensitive: false,
    minLength: 10,
    pattern: /^https:\/\/.+\.vercel\.app$/,
  },
];

const PLACEHOLDER_VALUES = [
  'your-project-id.supabase.co',
  'your-supabase-anon-key',
  'your-supabase-service-role-key',
  'your-random-secret-32-characters-long',
  'your-google-client-id.apps.googleusercontent.com',
  'your-google-client-secret',
  'your-gemini-api-key',
  'your-vercel-url',
];

function validateEnvironment() {
  const errors = [];
  const warnings = [];
  const missingRequired = [];
  const placeholders = [];

  let configured = 0;
  let missing = 0;
  let hasPlaceholders = 0;

  ENV_VARIABLES.forEach(envVar => {
    const value = process.env[envVar.name];

    if (!value) {
      if (envVar.required) {
        errors.push(`❌ ${envVar.name}: variável obrigatória não definida`);
        missingRequired.push(envVar.name);
        missing++;
      } else {
        warnings.push(`⚠️  ${envVar.name}: variável opcional não definida`);
        missing++;
      }
      return;
    }

    const hasPlaceholder = PLACEHOLDER_VALUES.some(
      placeholder => value.includes(placeholder) || value === placeholder
    );

    if (hasPlaceholder) {
      if (envVar.required) {
        errors.push(`❌ ${envVar.name}: contém valor placeholder`);
      } else {
        warnings.push(`⚠️  ${envVar.name}: contém valor placeholder`);
      }
      placeholders.push(envVar.name);
      hasPlaceholders++;
      return;
    }

    if (envVar.minLength && value.length < envVar.minLength) {
      warnings.push(
        `⚠️  ${envVar.name}: valor muito curto (${value.length} < ${envVar.minLength} caracteres)`
      );
    }

    if (envVar.pattern && !envVar.pattern.test(value)) {
      warnings.push(`⚠️  ${envVar.name}: formato inválido`);
    }

    configured++;
  });

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    missingRequired,
    placeholders,
    summary: {
      total: ENV_VARIABLES.length,
      configured,
      missing,
      hasPlaceholders,
    },
  };
}

function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV !== 'production',
    hasEnvFile: fs.existsSync('.env.local'),
    timestamp: new Date().toISOString(),
  };
}

function generateValidationReport() {
  const validation = validateEnvironment();
  const envInfo = getEnvironmentInfo();

  let report = '\n';
  report +=
    '=============================================================================\n';
  report += '                    RELATÓRIO DE VALIDAÇÃO DE AMBIENTE\n';
  report +=
    '=============================================================================\n\n';

  report += `📊 RESUMO:\n`;
  report += `   • Ambiente: ${envInfo.nodeEnv}\n`;
  report += `   • Produção: ${envInfo.isProduction ? 'Sim' : 'Não'}\n`;
  report += `   • Arquivo .env.local: ${envInfo.hasEnvFile ? 'Encontrado' : 'Não encontrado'}\n`;
  report += `   • Data/Hora: ${envInfo.timestamp}\n\n`;

  report += `📈 ESTATÍSTICAS:\n`;
  report += `   • Total de variáveis: ${validation.summary.total}\n`;
  report += `   • Configuradas: ${validation.summary.configured}\n`;
  report += `   • Faltando: ${validation.summary.missing}\n`;
  report += `   • Com placeholders: ${validation.summary.hasPlaceholders}\n\n`;

  report += `🎯 STATUS GERAL: ${validation.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}\n\n`;

  if (validation.errors.length > 0) {
    report += `🚨 ERROS (${validation.errors.length}):\n`;
    validation.errors.forEach(error => {
      report += `   ${error}\n`;
    });
    report += '\n';
  }

  if (validation.warnings.length > 0) {
    report += `⚠️  AVISOS (${validation.warnings.length}):\n`;
    validation.warnings.forEach(warning => {
      report += `   ${warning}\n`;
    });
    report += '\n';
  }

  if (validation.placeholders.length > 0) {
    report += `🔧 PLACEHOLDERS ENCONTRADOS:\n`;
    validation.placeholders.forEach(varName => {
      const envVar = ENV_VARIABLES.find(v => v.name === varName);
      report += `   • ${varName}: ${envVar?.description || 'Sem descrição'}\n`;
      if (envVar?.helpUrl) {
        report += `     📚 Ajuda: ${envVar.helpUrl}\n`;
      }
    });
    report += '\n';
  }

  if (!validation.isValid) {
    report += `🔧 PRÓXIMOS PASSOS:\n`;
    report += `   1. Edite o arquivo .env.local\n`;
    report += `   2. Configure as variáveis listadas acima\n`;
    report += `   3. Consulte env.template para instruções\n`;
    report += `   4. Execute novamente: npm run validate-env\n\n`;
  }

  report +=
    '=============================================================================\n';

  return report;
}

function generateSummary() {
  const validation = validateEnvironment();
  const envInfo = getEnvironmentInfo();

  console.log(`\n🔍 VALIDAÇÃO DE AMBIENTE - AppFin v0.5`);
  console.log(`📊 Status: ${validation.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
  console.log(
    `📈 Configuradas: ${validation.summary.configured}/${validation.summary.total}`
  );

  if (validation.errors.length > 0) {
    console.log(`🚨 Erros: ${validation.errors.length}`);
  }

  if (validation.warnings.length > 0) {
    console.log(`⚠️  Avisos: ${validation.warnings.length}`);
  }

  if (!envInfo.hasEnvFile) {
    console.log(`❌ Arquivo .env.local não encontrado`);
  }

  console.log(`\n💡 Para relatório completo: npm run validate-env`);
  console.log(`🔧 Para configurar: npm run setup\n`);
}

function showHelp() {
  console.log(`
🔧 VALIDAÇÃO DE AMBIENTE - AppFin v0.5

COMANDOS DISPONÍVEIS:
  npm run validate-env    Relatório completo de validação
  npm run check-env       Resumo rápido do status
  npm run setup           Executar configuração inicial
  npm run help            Mostrar esta ajuda

OPÇÕES DO SCRIPT:
  --summary               Mostrar apenas resumo
  --help                  Mostrar esta ajuda
  --json                  Saída em formato JSON

EXEMPLOS:
  node scripts/validate-env.js
  node scripts/validate-env.js --summary
  node scripts/validate-env.js --json

ARQUIVOS IMPORTANTES:
  .env.local              Suas configurações (não commitado)
  env.template            Template com instruções
  env.example             Exemplo sanitizado

📚 Para mais informações, consulte o README.md
`);
}

// Processar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--help')) {
  showHelp();
  process.exit(0);
}

if (args.includes('--summary')) {
  generateSummary();
  process.exit(0);
}

if (args.includes('--json')) {
  const validation = validateEnvironment();
  const envInfo = getEnvironmentInfo();
  console.log(JSON.stringify({ validation, envInfo }, null, 2));
  process.exit(0);
}

// Executar validação padrão
console.log(generateValidationReport());

// Definir código de saída
const validation = validateEnvironment();
process.exit(validation.isValid ? 0 : 1);
