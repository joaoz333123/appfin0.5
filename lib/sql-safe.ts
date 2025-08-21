// Utilitário para validar e executar apenas SELECTs seguros
export function validateSelectOnly(sql: string): boolean {
  const normalized = sql.trim().toLowerCase();

  // Deve começar com SELECT
  if (!normalized.startsWith('select')) {
    return false;
  }

  // Proibir comandos perigosos
  const dangerousKeywords = [
    'insert',
    'update',
    'delete',
    'drop',
    'create',
    'alter',
    'truncate',
    'grant',
    'revoke',
    'execute',
    'declare',
    'begin',
    'commit',
    'rollback',
  ];

  for (const keyword of dangerousKeywords) {
    if (normalized.includes(keyword)) {
      return false;
    }
  }

  // Proibir múltiplas queries
  if (normalized.includes(';') && normalized.split(';').length > 2) {
    return false;
  }

  return true;
}

export function addLimitIfMissing(sql: string, limit: number = 1000): string {
  const normalized = sql.trim().toLowerCase();

  if (!normalized.includes('limit')) {
    return `${sql} LIMIT ${limit}`;
  }

  return sql;
}

export function sanitizeSql(sql: string): string {
  // Remove comentários
  let sanitized = sql.replace(/--.*$/gm, '');
  sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove espaços extras
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

export function extractTableNames(sql: string): string[] {
  const normalized = sql.toLowerCase();
  const tableMatches = normalized.match(/from\s+(\w+)|\s+(\w+)/g);

  if (!tableMatches) return [];

  return tableMatches
    .map(match => {
      const parts = match.split(/\s+/);
      return parts[parts.length - 1];
    })
    .filter(Boolean);
}

// Schema das tabelas permitidas
export const ALLOWED_TABLES = {
  politicas: ['id', 'versao', 'json', 'criado_por', 'criado_em'],
  pedidos: [
    'id',
    'titulo',
    'categoria',
    'cc',
    'projeto',
    'valor',
    'estado',
    'solicitante_id',
    'politica_versao',
    'criado_em',
  ],
  aprovacoes: [
    'id',
    'pedido_id',
    'etapa_idx',
    'papel_alvo',
    'aprovador_id',
    'decisao',
    'comentario',
    'em',
  ],
  orcamentos: ['id', 'mes', 'cc', 'categoria', 'orcado', 'comprometido'],
  anexos: ['id', 'pedido_id', 'tipo', 'mime', 'url', 'texto_extraido'],
  historico: [
    'id',
    'entidade',
    'entidade_id',
    'acao',
    'por',
    'em',
    'detalhes_json',
  ],
  dashboards: [
    'id',
    'nome',
    'owner_id',
    'sql',
    'spec_json',
    'narrativa',
    'criado_em',
  ],
  notificacoes: ['id', 'user_id', 'tipo', 'payload_json', 'lida', 'criada_em'],
};

export function validateTableAccess(sql: string): boolean {
  const tableNames = extractTableNames(sql);

  for (const tableName of tableNames) {
    if (!ALLOWED_TABLES[tableName as keyof typeof ALLOWED_TABLES]) {
      return false;
    }
  }

  return true;
}
