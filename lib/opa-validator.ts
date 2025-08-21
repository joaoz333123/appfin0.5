/**
 * ===================================================================
 * VALIDADOR OPA FLEXÍVEL PARA APPFIN v0.5
 * ===================================================================
 *
 * Sistema de validação em camadas que permite onboarding fácil
 * mas ainda oferece feedback valioso para melhorar políticas.
 *
 * NÍVEIS DE CRITICIDADE:
 * 🔴 CRÍTICO (ERROR): Falhas que impedem funcionamento
 * 🟡 IMPORTANTE (WARNING): Problemas de configuração
 * 🔵 RECOMENDADO (SUGGESTION): Melhorias de boas práticas
 */

import { PoliticaJson } from './policy';

export interface FlexibleValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  validation_time_ms: number;
  maturity_level: 'inválida' | 'básica' | 'intermediária' | 'avançada';
  score: number; // 0-100
  recommendations: RecommendationItem[];
}

export interface RecommendationItem {
  type: 'error' | 'warning' | 'suggestion';
  message: string;
  field?: string;
  priority: 'high' | 'medium' | 'low';
  fix_hint?: string;
}

/**
 * Validação OPA flexível - permite políticas básicas mas oferece feedback
 */
export function validatePolicyFlexible(
  politicaJson: PoliticaJson
): FlexibleValidationResult {
  const _startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const recommendations: RecommendationItem[] = [];

  // =============================================================================
  // 🔴 VALIDAÇÕES CRÍTICAS (OBRIGATÓRIAS)
  // =============================================================================

  if (!validateStructureMinimal(politicaJson)) {
    const _error =
      "CRÍTICO: Política deve ter 'limites_por_valor' com pelo menos uma faixa";
    errors.push(error);
    recommendations.push({
      type: 'error',
      message: error,
      field: 'limites_por_valor',
      priority: 'high',
      fix_hint:
        'Adicione pelo menos uma faixa de valor com max_valor e aprovadores',
    });
  }

  if (!validateFaixasMinimal(politicaJson)) {
    const _error =
      "CRÍTICO: Todas as faixas devem ter 'max_valor' > 0 e pelo menos um aprovador";
    errors.push(error);
    recommendations.push({
      type: 'error',
      message: error,
      field: 'limites_por_valor.*',
      priority: 'high',
      fix_hint:
        'Verifique se todas as faixas têm max_valor positivo e array aprovadores não vazio',
    });
  }

  if (!validateAprovadoresCritical(politicaJson)) {
    const _error = 'CRÍTICO: Aprovadores devem ser strings não vazias';
    errors.push(error);
    recommendations.push({
      type: 'error',
      message: error,
      field: 'limites_por_valor.*.aprovadores',
      priority: 'high',
      fix_hint:
        'Aprovadores devem ser strings válidas como "gerente", "diretor", etc.',
    });
  }

  // =============================================================================
  // 🟡 VALIDAÇÕES IMPORTANTES (GERAM WARNINGS)
  // =============================================================================

  // Estrutura recomendada
  const missingStructure = checkMissingRecommendedStructure(politicaJson);
  if (missingStructure.length > 0) {
    const warning = `IMPORTANTE: Estrutura incompleta - faltam: ${missingStructure.join(', ')}`;
    warnings.push(warning);
    recommendations.push({
      type: 'warning',
      message: warning,
      priority: 'medium',
      fix_hint:
        'Adicione os campos para melhor controle e funcionalidade completa',
    });
  }

  // SLA nas faixas
  const faixasSemSLA = findFaixasSemSLA(politicaJson);
  if (faixasSemSLA.length > 0) {
    const warning = `IMPORTANTE: Faixas sem SLA: ${faixasSemSLA.join(', ')} - pode causar demoras`;
    warnings.push(warning);
    recommendations.push({
      type: 'warning',
      message: warning,
      field: 'limites_por_valor.*.sla_horas',
      priority: 'medium',
      fix_hint: 'Adicione sla_horas para cada faixa (recomendado: 4-48 horas)',
    });
  }

  // Anexos nas faixas
  const faixasSemAnexos = findFaixasSemAnexos(politicaJson);
  if (faixasSemAnexos.length > 0) {
    const warning = `IMPORTANTE: Faixas sem anexos obrigatórios: ${faixasSemAnexos.join(', ')}`;
    warnings.push(warning);
    recommendations.push({
      type: 'warning',
      message: warning,
      field: 'limites_por_valor.*.anexos_min',
      priority: 'medium',
      fix_hint: 'Defina documentos obrigatórios como ["descricao", "cotacao"]',
    });
  }

  // Aprovadores suspeitos
  const aprovadoresSuspeitos = findAprovadoresSuspeitos(politicaJson);
  if (aprovadoresSuspeitos.length > 0) {
    const warning = `IMPORTANTE: Aprovadores não padrão detectados: ${aprovadoresSuspeitos.join(', ')}`;
    warnings.push(warning);
    recommendations.push({
      type: 'warning',
      message: warning,
      field: 'limites_por_valor.*.aprovadores',
      priority: 'medium',
      fix_hint: 'Use aprovadores padrão: gerente, diretor, cfo, ceo',
    });
  }

  // Categorias extras incompletas
  const categoriasIncompletas = findCategoriasExtrasIncompletas(politicaJson);
  if (categoriasIncompletas.length > 0) {
    const warning = `IMPORTANTE: Categorias extra sem aprovadores adicionais: ${categoriasIncompletas.join(', ')}`;
    warnings.push(warning);
    recommendations.push({
      type: 'warning',
      message: warning,
      field: 'categorias.*.aprovadores_adicionais',
      priority: 'medium',
      fix_hint:
        'Adicione aprovadores_adicionais para categorias com extra=true',
    });
  }

  // Valores muito altos
  const faixasComValorAlto = findFaixasComValorAlto(politicaJson);
  faixasComValorAlto.forEach(({ faixa, valor }) => {
    const warning = `IMPORTANTE: Faixa '${faixa}' tem valor muito alto (${valor.toLocaleString()}) - revisar`;
    warnings.push(warning);
    recommendations.push({
      type: 'warning',
      message: warning,
      field: `limites_por_valor.${faixa}.max_valor`,
      priority: 'medium',
      fix_hint: 'Considere quebrar em faixas menores para melhor controle',
    });
  });

  // SLA muito longo
  const faixasComSLALongo = findFaixasComSLALongo(politicaJson);
  faixasComSLALongo.forEach(({ faixa, sla }) => {
    const warning = `IMPORTANTE: Faixa '${faixa}' tem SLA muito longo (${sla}h) - pode impactar agilidade`;
    warnings.push(warning);
    recommendations.push({
      type: 'warning',
      message: warning,
      field: `limites_por_valor.${faixa}.sla_horas`,
      priority: 'medium',
      fix_hint: 'Considere reduzir para no máximo 72 horas',
    });
  });

  // CAPEX sem extra
  if (checkCAPEXSemExtra(politicaJson)) {
    const warning =
      'IMPORTANTE: Categoria CAPEX deveria ter aprovação extra (extra=true)';
    warnings.push(warning);
    recommendations.push({
      type: 'warning',
      message: warning,
      field: 'categorias.CAPEX.extra',
      priority: 'medium',
      fix_hint: 'Configure extra=true para CAPEX',
    });
  }

  // =============================================================================
  // 🔵 SUGESTÕES (MELHORIAS RECOMENDADAS)
  // =============================================================================

  if (!politicaJson.anexos_min_por_faixa) {
    const suggestion =
      "RECOMENDADO: Adicione 'anexos_min_por_faixa' para documentos obrigatórios por valor";
    suggestions.push(suggestion);
    recommendations.push({
      type: 'suggestion',
      message: suggestion,
      field: 'anexos_min_por_faixa',
      priority: 'low',
      fix_hint: 'Mapeie cada faixa para documentos necessários',
    });
  }

  if (
    politicaJson.sla_horas_por_etapa &&
    !politicaJson.sla_horas_por_etapa.default
  ) {
    const suggestion =
      "RECOMENDADO: Defina SLA padrão em 'sla_horas_por_etapa.default'";
    suggestions.push(suggestion);
    recommendations.push({
      type: 'suggestion',
      message: suggestion,
      field: 'sla_horas_por_etapa.default',
      priority: 'low',
      fix_hint: 'Adicione fallback para casos não cobertos',
    });
  }

  if (!politicaJson.escalonamento) {
    const suggestion =
      "RECOMENDADO: Configure 'escalonamento' para aprovações em atraso";
    suggestions.push(suggestion);
    recommendations.push({
      type: 'suggestion',
      message: suggestion,
      field: 'escalonamento',
      priority: 'low',
      fix_hint: 'Defina para onde enviar aprovações atrasadas',
    });
  }

  if (Object.keys(politicaJson.limites_por_valor).length === 1) {
    const suggestion =
      'RECOMENDADO: Configure múltiplas faixas de valor (ex: até 1000, 1000-5000, etc.)';
    suggestions.push(suggestion);
    recommendations.push({
      type: 'suggestion',
      message: suggestion,
      field: 'limites_por_valor',
      priority: 'low',
      fix_hint: 'Crie gradação de controle baseada no valor',
    });
  }

  // Sugestões de categorias padrão
  if (politicaJson.categorias && !politicaJson.categorias.OPEX) {
    suggestions.push(
      "RECOMENDADO: Adicione categoria 'OPEX' para despesas operacionais"
    );
  }

  if (politicaJson.categorias && !politicaJson.categorias.CAPEX) {
    suggestions.push(
      "RECOMENDADO: Adicione categoria 'CAPEX' para investimentos"
    );
  }

  // Sugestões para faixas com poucos aprovadores
  Object.entries(politicaJson.limites_por_valor).forEach(([faixa, config]) => {
    if (config.aprovadores.length === 1 && config.max_valor > 10000) {
      const suggestion = `RECOMENDADO: Faixa '${faixa}' com valor alto deveria ter múltiplos aprovadores`;
      suggestions.push(suggestion);
      recommendations.push({
        type: 'suggestion',
        message: suggestion,
        field: `limites_por_valor.${faixa}.aprovadores`,
        priority: 'low',
        fix_hint: 'Adicione aprovação dupla para valores altos',
      });
    }
  });

  // =============================================================================
  // CÁLCULO DE SCORE E MATURIDADE
  // =============================================================================

  const isValid = errors.length === 0;
  const score = calculatePolicyScore(
    errors.length,
    warnings.length,
    suggestions.length
  );
  const maturityLevel = calculateMaturityLevel(isValid, warnings.length);

  const validationTime = Date.now() - startTime;

  return {
    valid: isValid,
    errors,
    warnings,
    suggestions,
    validation_time_ms: validationTime,
    maturity_level: maturityLevel,
    score,
    recommendations,
  };
}

// =============================================================================
// FUNÇÕES AUXILIARES DE VALIDAÇÃO
// =============================================================================

function validateStructureMinimal(politica: PoliticaJson): boolean {
  return !!(
    politica.limites_por_valor &&
    Object.keys(politica.limites_por_valor).length > 0
  );
}

function validateFaixasMinimal(politica: PoliticaJson): boolean {
  if (!politica.limites_por_valor) return false;

  return Object.values(politica.limites_por_valor).every(
    faixa =>
      faixa.max_valor > 0 && faixa.aprovadores && faixa.aprovadores.length > 0
  );
}

function validateAprovadoresCritical(politica: PoliticaJson): boolean {
  if (!politica.limites_por_valor) return false;

  return Object.values(politica.limites_por_valor).every(
    faixa =>
      faixa.aprovadores &&
      faixa.aprovadores.every(
        aprovador => typeof aprovador === 'string' && aprovador.length > 0
      )
  );
}

function checkMissingRecommendedStructure(politica: PoliticaJson): string[] {
  const missing: string[] = [];

  if (!politica.categorias) missing.push('categorias');
  if (!politica.sla_horas_por_etapa) missing.push('sla_horas_por_etapa');
  if (!politica.anexos_min_por_faixa) missing.push('anexos_min_por_faixa');
  if (!politica.escalonamento) missing.push('escalonamento');

  return missing;
}

function findFaixasSemSLA(politica: PoliticaJson): string[] {
  if (!politica.limites_por_valor) return [];

  return Object.entries(politica.limites_por_valor)
    .filter(([_, faixa]) => !faixa.sla_horas)
    .map(([faixa, _]) => faixa);
}

function findFaixasSemAnexos(politica: PoliticaJson): string[] {
  if (!politica.limites_por_valor) return [];

  return Object.entries(politica.limites_por_valor)
    .filter(([_, faixa]) => !faixa.anexos_min)
    .map(([faixa, _]) => faixa);
}

function findAprovadoresSuspeitos(politica: PoliticaJson): string[] {
  if (!politica.limites_por_valor) return [];

  const aprovadoresPadrao = [
    'gerente',
    'diretor',
    'cfo',
    'ceo',
    'manager',
    'director',
    'finance',
    'admin',
  ];
  const suspeitos: string[] = [];

  Object.values(politica.limites_por_valor).forEach(faixa => {
    faixa.aprovadores.forEach(aprovador => {
      if (
        !aprovadoresPadrao.includes(aprovador.toLowerCase()) &&
        !suspeitos.includes(aprovador)
      ) {
        suspeitos.push(aprovador);
      }
    });
  });

  return suspeitos;
}

function findCategoriasExtrasIncompletas(politica: PoliticaJson): string[] {
  if (!politica.categorias) return [];

  return Object.entries(politica.categorias)
    .filter(
      ([_, categoria]) =>
        categoria.extra === true && !categoria.aprovadores_adicionais
    )
    .map(([nome, _]) => nome);
}

function findFaixasComValorAlto(
  politica: PoliticaJson
): Array<{ faixa: string; valor: number }> {
  if (!politica.limites_por_valor) return [];

  return Object.entries(politica.limites_por_valor)
    .filter(([_, faixa]) => faixa.max_valor > 1000000)
    .map(([faixa, config]) => ({ faixa, valor: config.max_valor }));
}

function findFaixasComSLALongo(
  politica: PoliticaJson
): Array<{ faixa: string; sla: number }> {
  if (!politica.limites_por_valor) return [];

  return Object.entries(politica.limites_por_valor)
    .filter(([_, faixa]) => faixa.sla_horas && faixa.sla_horas > 72)
    .map(([faixa, config]) => ({ faixa, sla: config.sla_horas! }));
}

function checkCAPEXSemExtra(politica: PoliticaJson): boolean {
  return !!(
    politica.categorias?.CAPEX && politica.categorias.CAPEX.extra !== true
  );
}

// =============================================================================
// CÁLCULO DE SCORE E MATURIDADE
// =============================================================================

function calculatePolicyScore(
  errors: number,
  warnings: number,
  suggestions: number
): number {
  if (errors > 0) return 0; // Política inválida

  // Score base para política válida
  let score = 60;

  // Penalizar warnings (importantes)
  score -= warnings * 8;

  // Penalizar suggestions (menos críticas)
  score -= suggestions * 2;

  // Bônus por completude
  if (warnings === 0) score += 20;
  if (suggestions <= 3) score += 10;

  return Math.max(0, Math.min(100, score));
}

function calculateMaturityLevel(
  valid: boolean,
  warnings: number
): 'inválida' | 'básica' | 'intermediária' | 'avançada' {
  if (!valid) return 'inválida';
  if (warnings > 3) return 'básica';
  if (warnings > 0) return 'intermediária';
  return 'avançada';
}

/**
 * Modo compatibilidade - para integração gradual
 */
export function validatePolicyCompatible(politicaJson: PoliticaJson): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  validation_time_ms: number;
} {
  const result = validatePolicyFlexible(politicaJson);

  return {
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
    suggestions: result.suggestions,
    validation_time_ms: result.validation_time_ms,
  };
}

/**
 * Gerar relatório detalhado para debugging e auditoria
 */
export function generateValidationReport(politica: PoliticaJson): string {
  const result = validatePolicyFlexible(politica);

  let report = `
═══════════════════════════════════════════════════════════
📋 RELATÓRIO DE VALIDAÇÃO OPA - APPFIN v0.5
═══════════════════════════════════════════════════════════

✅ STATUS: ${result.valid ? 'VÁLIDA' : 'INVÁLIDA'}
📊 SCORE: ${result.score}/100
🏆 MATURIDADE: ${result.maturity_level.toUpperCase()}
⏱️ TEMPO: ${result.validation_time_ms}ms

`;

  if (result.errors.length > 0) {
    report += `🔴 ERROS CRÍTICOS (${result.errors.length}):\n`;
    result.errors.forEach((erro, i) => {
      report += `  ${i + 1}. ${erro}\n`;
    });
    report += '\n';
  }

  if (result.warnings.length > 0) {
    report += `🟡 WARNINGS IMPORTANTES (${result.warnings.length}):\n`;
    result.warnings.forEach((warning, i) => {
      report += `  ${i + 1}. ${warning}\n`;
    });
    report += '\n';
  }

  if (result.suggestions.length > 0) {
    report += `🔵 SUGESTÕES DE MELHORIA (${result.suggestions.length}):\n`;
    result.suggestions.forEach((suggestion, i) => {
      report += `  ${i + 1}. ${suggestion}\n`;
    });
    report += '\n';
  }

  report += `💡 RECOMENDAÇÕES PRIORITÁRIAS:\n`;
  const highPriorityRecs = result.recommendations.filter(
    r => r.priority === 'high'
  );
  if (highPriorityRecs.length === 0) {
    report += '  ✅ Nenhuma ação crítica necessária!\n\n';
  } else {
    highPriorityRecs.forEach((rec, i) => {
      report += `  ${i + 1}. ${rec.message}\n`;
      if (rec.fix_hint) {
        report += `     💡 Dica: ${rec.fix_hint}\n`;
      }
    });
    report += '\n';
  }

  report += `📈 PRÓXIMOS PASSOS:\n`;
  if (result.maturity_level === 'inválida') {
    report += '  1. Corrigir erros críticos para tornar política funcional\n';
    report += '  2. Adicionar estrutura mínima recomendada\n';
  } else if (result.maturity_level === 'básica') {
    report += '  1. Resolver warnings para melhorar robustez\n';
    report += '  2. Implementar sugestões gradualmente\n';
  } else if (result.maturity_level === 'intermediária') {
    report += '  1. Implementar sugestões restantes\n';
    report += '  2. Otimizar configurações avançadas\n';
  } else {
    report += '  ✅ Política excelente! Monitorar uso em produção.\n';
  }

  report += `
═══════════════════════════════════════════════════════════
🚀 Política flexível permite onboarding fácil mantendo qualidade!
═══════════════════════════════════════════════════════════
`;

  return report;
}
