/**
 * =============================================================================
 * VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE - AppFin v0.5
 * =============================================================================
 *
 * Este módulo fornece funções para validar a configuração de ambiente
 * e garantir que todas as credenciais necessárias estejam presentes.
 */

// Configuração das variáveis obrigatórias
interface EnvVariable {
  name: string;
  description: string;
  required: boolean;
  sensitive: boolean;
  minLength?: number;
  pattern?: RegExp;
  helpUrl?: string;
}

const ENV_VARIABLES: EnvVariable[] = [
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

// Valores placeholder que não devem estar em produção
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

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  placeholders: string[];
  summary: {
    total: number;
    configured: number;
    missing: number;
    hasPlaceholders: number;
  };
}

export interface EnvironmentInfo {
  nodeEnv: string;
  isProduction: boolean;
  isDevelopment: boolean;
  hasEnvFile: boolean;
  timestamp: string;
}

/**
 * Valida todas as variáveis de ambiente necessárias
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];
  const placeholders: string[] = [];

  let configured = 0;
  let missing = 0;
  let hasPlaceholders = 0;

  // Verificar cada variável
  ENV_VARIABLES.forEach(envVar => {
    const value = process.env[envVar.name];

    // Verificar se está definida
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

    // Verificar se contém placeholder
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

    // Verificar comprimento mínimo
    if (envVar.minLength && value.length < envVar.minLength) {
      warnings.push(
        `⚠️  ${envVar.name}: valor muito curto (${value.length} < ${envVar.minLength} caracteres)`
      );
    }

    // Verificar padrão se especificado
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

/**
 * Obtém informações sobre o ambiente atual
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV !== 'production',
    hasEnvFile: typeof process.env.NEXT_PUBLIC_SUPABASE_URL !== 'undefined',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Gera relatório detalhado da validação
 */
export function generateValidationReport(): string {
  const validation = validateEnvironment();
  const envInfo = getEnvironmentInfo();

  let report = '\n';
  report +=
    '=============================================================================\n';
  report += '                    RELATÓRIO DE VALIDAÇÃO DE AMBIENTE\n';
  report +=
    '=============================================================================\n\n';

  // Informações do ambiente
  report += `📊 RESUMO:\n`;
  report += `   • Ambiente: ${envInfo.nodeEnv}\n`;
  report += `   • Produção: ${envInfo.isProduction ? 'Sim' : 'Não'}\n`;
  report += `   • Arquivo .env: ${envInfo.hasEnvFile ? 'Encontrado' : 'Não encontrado'}\n`;
  report += `   • Data/Hora: ${envInfo.timestamp}\n\n`;

  // Estatísticas
  report += `📈 ESTATÍSTICAS:\n`;
  report += `   • Total de variáveis: ${validation.summary.total}\n`;
  report += `   • Configuradas: ${validation.summary.configured}\n`;
  report += `   • Faltando: ${validation.summary.missing}\n`;
  report += `   • Com placeholders: ${validation.summary.hasPlaceholders}\n\n`;

  // Status geral
  report += `🎯 STATUS GERAL: ${validation.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}\n\n`;

  // Erros
  if (validation.errors.length > 0) {
    report += `🚨 ERROS (${validation.errors.length}):\n`;
    validation.errors.forEach(error => {
      report += `   ${error}\n`;
    });
    report += '\n';
  }

  // Avisos
  if (validation.warnings.length > 0) {
    report += `⚠️  AVISOS (${validation.warnings.length}):\n`;
    validation.warnings.forEach(warning => {
      report += `   ${warning}\n`;
    });
    report += '\n';
  }

  // Variáveis com placeholder
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

  // Instruções
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

/**
 * Função utilitária para validar ambiente em tempo de execução
 * Lança erro se a configuração estiver inválida
 */
export function ensureValidEnvironment(): void {
  const validation = validateEnvironment();

  if (!validation.isValid) {
    console.error(generateValidationReport());
    throw new Error(
      `Configuração de ambiente inválida. ${validation.errors.length} erro(s) encontrado(s).`
    );
  }
}

/**
 * Middleware para validação de ambiente em desenvolvimento
 */
export function validateEnvironmentMiddleware() {
  if (process.env.NODE_ENV === 'development') {
    const validation = validateEnvironment();

    if (validation.warnings.length > 0) {
      console.warn('⚠️  Avisos de configuração encontrados:');
      validation.warnings.forEach(warning => console.warn(`   ${warning}`));
      console.warn('');
    }

    if (!validation.isValid) {
      console.error('❌ Erro: Configuração de ambiente inválida');
      validation.errors.forEach(error => console.error(`   ${error}`));
      console.error('');
      console.error('💡 Execute: npm run validate-env para mais detalhes');
      console.error('');
    }
  }
}

// Função para obter informações específicas de uma variável
export function getVariableInfo(name: string): EnvVariable | undefined {
  return ENV_VARIABLES.find(v => v.name === name);
}

// Função para listar todas as variáveis necessárias
export function listRequiredVariables(): EnvVariable[] {
  return ENV_VARIABLES.filter(v => v.required);
}

// Função para listar variáveis opcionais
export function listOptionalVariables(): EnvVariable[] {
  return ENV_VARIABLES.filter(v => !v.required);
}
