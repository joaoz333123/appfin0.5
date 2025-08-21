// Sistema de segurança para prevenir execução de código malicioso

export interface SecurityCheck {
  isSafe: boolean;
  warnings: string[];
  blockedContent: string[];
}

export const DANGEROUS_KEYWORDS = [
  // Comandos de sistema
  'exec',
  'eval',
  'Function',
  'setTimeout',
  'setInterval',
  'process.env',
  'process.exit',
  'process.kill',

  // Operações de arquivo
  'fs.write',
  'fs.read',
  'fs.unlink',
  'fs.mkdir',
  'fs.rmdir',
  'fs.rename',
  'fs.copy',
  'fs.chmod',
  'fs.chown',

  // Operações de rede
  'fetch',
  'axios',
  'curl',
  'http.get',
  'https.get',
  'net.connect',
  'tls.connect',

  // Operações de banco de dados
  'sql',
  'query',
  'execute',
  'transaction',

  // Operações de sistema
  'child_process',
  'spawn',
  'exec',
  'execSync',
  'require',
  'import',
  'module.exports',

  // Palavras-chave perigosas
  'executar',
  'compilar',
  'modificar',
  'alterar',
  'código',
  'terminal',
  'comando',
  'instalar',
  'atualizar',
  'remover',
  'variável de ambiente',
  'configuração',
  'servidor',
  'banco de dados',
  'conectar',
  'rede',
];

export const DANGEROUS_PATTERNS = [
  /eval\s*\(/i,
  /Function\s*\(/i,
  /setTimeout\s*\(/i,
  /setInterval\s*\(/i,
  /process\.env/i,
  /fs\./i,
  /child_process/i,
  /require\s*\(/i,
  /import\s+/i,
  /module\.exports/i,
];

export function checkContentSecurity(content: string): SecurityCheck {
  const warnings: string[] = [];
  const blockedContent: string[] = [];
  let isSafe = true;

  // Verificar palavras-chave perigosas
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (content.toLowerCase().includes(keyword.toLowerCase())) {
      warnings.push(`Palavra-chave perigosa detectada: ${keyword}`);
      blockedContent.push(keyword);
      isSafe = false;
    }
  }

  // Verificar padrões perigosos
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
      const match = content.match(pattern);
      if (match) {
        warnings.push(`Padrão perigoso detectado: ${match[0]}`);
        blockedContent.push(match[0]);
        isSafe = false;
      }
    }
  }

  // Verificar tentativas de execução de código
  const executionPatterns = [
    /executar.*código/i,
    /compilar.*código/i,
    /modificar.*arquivo/i,
    /alterar.*sistema/i,
    /instalar.*software/i,
    /atualizar.*sistema/i,
  ];

  for (const pattern of executionPatterns) {
    if (pattern.test(content)) {
      warnings.push('Tentativa de execução de código detectada');
      isSafe = false;
    }
  }

  return {
    isSafe,
    warnings,
    blockedContent,
  };
}

export function sanitizeContent(content: string): string {
  const securityCheck = checkContentSecurity(content);

  if (!securityCheck.isSafe) {
    return (
      content +
      '\n\n⚠️ ATENÇÃO DE SEGURANÇA:\n' +
      'Esta resposta contém conteúdo que pode ser perigoso.\n' +
      'NÃO execute código sem revisão manual.\n' +
      'Conteúdo bloqueado: ' +
      securityCheck.blockedContent.join(', ')
    );
  }

  return content;
}

export function logSecurityViolation(content: string, source: string) {
  console.warn('🚨 VIOLAÇÃO DE SEGURANÇA DETECTADA:');
  console.warn('Fonte:', source);
  console.warn('Conteúdo:', content.substring(0, 200) + '...');
  console.warn('Timestamp:', new Date().toISOString());
}
