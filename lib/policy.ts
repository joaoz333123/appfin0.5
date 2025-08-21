import {
    generateValidationReport,
    validatePolicyCompatible,
    validatePolicyFlexible,
} from './opa-validator';
import { Aprovacao, Pedido } from './supabase';

export interface PoliticaJson {
  limites_por_valor: {
    [faixa: string]: {
      max_valor: number;
      aprovadores: string[];
      sla_horas: number;
      anexos_min: string[];
    };
  };
  categorias: {
    [categoria: string]: {
      extra: boolean;
      aprovadores_adicionais?: string[];
      sla_extra?: number;
    };
  };
  sla_horas_por_etapa: {
    [papel: string]: number;
  };
  anexos_min_por_faixa: {
    [faixa: string]: string[];
  };
  escalonamento: {
    [papel: string]: string;
  };
}

export interface EtapaAprovacao {
  papel_alvo: string;
  sla_horas: number;
  justificativa: string;
  ordem: number;
}

export function evaluate(
  pedido: Pedido,
  politicaJson: PoliticaJson
): EtapaAprovacao[] {
  const etapas: EtapaAprovacao[] = [];

  // Determinar faixa de valor
  const faixa = determinarFaixaValor(
    pedido.valor,
    politicaJson.limites_por_valor
  );

  // Obter aprovadores base da faixa
  const aprovadoresBase =
    politicaJson.limites_por_valor[faixa]?.aprovadores || [];

  // Verificar se é categoria especial (CAPEX, etc.)
  const categoriaInfo = politicaJson.categorias[pedido.categoria];
  const aprovadoresAdicionais = categoriaInfo?.extra
    ? categoriaInfo.aprovadores_adicionais || []
    : [];

  // Combinar aprovadores
  const todosAprovadores = Array.from(
    new Set([...aprovadoresBase, ...aprovadoresAdicionais])
  );

  // Criar etapas
  todosAprovadores.forEach((papel, index) => {
    const slaBase = politicaJson.limites_por_valor[faixa]?.sla_horas || 24;
    const slaExtra = categoriaInfo?.sla_extra || 0;
    const slaFinal = slaBase + slaExtra;

    const justificativa = gerarJustificativa(
      pedido,
      faixa,
      papel,
      categoriaInfo
    );

    etapas.push({
      papel_alvo: papel,
      sla_horas: slaFinal,
      justificativa,
      ordem: index,
    });
  });

  return etapas;
}

function determinarFaixaValor(valor: number, limites: any): string {
  const faixas = Object.keys(limites).sort((a, b) => {
    const valorA = parseFloat(a.replace(/[^\d]/g, ''));
    const valorB = parseFloat(b.replace(/[^\d]/g, ''));
    return valorA - valorB;
  });

  for (const faixa of faixas) {
    const maxValor = limites[faixa].max_valor;
    if (valor <= maxValor) {
      return faixa;
    }
  }

  return faixas[faixas.length - 1] || 'acima_limite';
}

function gerarJustificativa(
  pedido: Pedido,
  faixa: string,
  papel: string,
  categoriaInfo: any
): string {
  let justificativa = `Aprovação necessária para pedido de ${pedido.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;

  if (faixa !== 'padrao') {
    justificativa += ` (faixa: ${faixa})`;
  }

  if (categoriaInfo?.extra) {
    justificativa += ` - Categoria ${pedido.categoria} requer aprovação adicional`;
  }

  return justificativa;
}

export function getNextApprover(
  pedido: Pedido,
  aprovacoes: Aprovacao[],
  politicaJson: PoliticaJson
): string | null {
  const etapas = evaluate(pedido, politicaJson);

  // Encontrar primeira etapa pendente
  for (const etapa of etapas) {
    const aprovacao = aprovacoes.find(a => a.papel_alvo === etapa.papel_alvo);
    if (!aprovacao || aprovacao.decisao === 'pendente') {
      return etapa.papel_alvo;
    }
  }

  return null;
}

export function checkSLA(
  pedido: Pedido,
  aprovacoes: Aprovacao[],
  politicaJson: PoliticaJson
): {
  atrasado: boolean;
  proximoVencimento: Date | null;
  atrasos: Array<{ papel: string; horasAtraso: number }>;
} {
  const etapas = evaluate(pedido, politicaJson);
  const agora = new Date();
  const atrasos: Array<{ papel: string; horasAtraso: number }> = [];
  let proximoVencimento: Date | null = null;

  for (const etapa of etapas) {
    const aprovacao = aprovacoes.find(a => a.papel_alvo === etapa.papel_alvo);

    if (aprovacao && aprovacao.decisao === 'pendente') {
      const criadoEm = new Date(aprovacao.em || aprovacao.criado_em);
      const vencimento = new Date(
        criadoEm.getTime() + etapa.sla_horas * 60 * 60 * 1000
      );

      if (agora > vencimento) {
        const horasAtraso = Math.floor(
          (agora.getTime() - vencimento.getTime()) / (60 * 60 * 1000)
        );
        atrasos.push({ papel: etapa.papel_alvo, horasAtraso });
      } else if (!proximoVencimento || vencimento < proximoVencimento) {
        proximoVencimento = vencimento;
      }
    }
  }

  return {
    atrasado: atrasos.length > 0,
    proximoVencimento,
    atrasos,
  };
}

export async function atualizarComprometido(
  pedido: Pedido,
  supabase: any
): Promise<boolean> {
  try {
    // Determinar mês do pedido
    const mes = new Date(pedido.criado_em).toISOString().slice(0, 7); // YYYY-MM

    // Buscar orçamento existente
    const { _data: orcamento, _error: buscaError } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('mes', mes)
      .eq('cc', pedido.cc)
      .eq('categoria', pedido.categoria)
      .single();

    if (buscaError && buscaError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Erro ao buscar orçamento:', buscaError);
      return false;
    }

    if (orcamento) {
      // Atualizar orçamento existente
      const { _error: updateError } = await supabase
        .from('orcamentos')
        .update({
          comprometido: orcamento.comprometido + pedido.valor,
        })
        .eq('id', orcamento.id);

      if (updateError) {
        console.error('Erro ao atualizar comprometido:', updateError);
        return false;
      }
    } else {
      // Criar novo orçamento
      const { _error: insertError } = await supabase
        .from('orcamentos')
        .insert({
          mes,
          cc: pedido.cc,
          categoria: pedido.categoria,
          orcado: 0,
          comprometido: pedido.valor,
        });

      if (insertError) {
        console.error('Erro ao criar orçamento:', insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar comprometido:', error);
    return false;
  }
}

export async function verificarDuplicatas(
  pedido: Partial<Pedido>,
  supabase: any
): Promise<{
  duplicatas: Pedido[];
  similaridade: number;
}> {
  try {
    // Buscar pedidos similares dos últimos 30 dias
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    const { _data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('cc', pedido.cc)
      .gte('criado_em', trintaDiasAtras.toISOString())
      .neq('estado', 'reprovado');

    if (error || !pedidos) {
      return { duplicatas: [], similaridade: 0 };
    }

    const duplicatas: Pedido[] = [];

    for (const pedidoExistente of pedidos) {
      // Verificar similaridade do título (simples)
      const similaridadeTitulo = calcularSimilaridadeTexto(
        pedido.titulo?.toLowerCase() || '',
        pedidoExistente.titulo.toLowerCase()
      );

      // Verificar similaridade do valor (±10%)
      const valorExistente = pedidoExistente.valor;
      const valorNovo = pedido.valor || 0;
      const similaridadeValor =
        Math.abs(valorExistente - valorNovo) / valorExistente <= 0.1;

      // Se título similar (>80%) e valor similar (±10%), é duplicata
      if (similaridadeTitulo > 0.8 && similaridadeValor) {
        duplicatas.push(pedidoExistente);
      }
    }

    return {
      duplicatas,
      similaridade: duplicatas.length > 0 ? 0.9 : 0,
    };
  } catch (error) {
    console.error('Erro ao verificar duplicatas:', error);
    return { duplicatas: [], similaridade: 0 };
  }
}

function calcularSimilaridadeTexto(texto1: string, texto2: string): number {
  // Implementação simples de similaridade
  const palavras1 = texto1.split(/\s+/).filter(p => p.length > 2);
  const palavras2 = texto2.split(/\s+/).filter(p => p.length > 2);

  if (palavras1.length === 0 || palavras2.length === 0) return 0;

  const palavrasComuns = palavras1.filter(p1 =>
    palavras2.some(p2 => p2.includes(p1) || p1.includes(p2))
  );

  return palavrasComuns.length / Math.max(palavras1.length, palavras2.length);
}

// ===== VALIDAÇÃO OPA =====

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  validation_time_ms: number;
}

// Cache para o módulo OPA WASM
const opaModule: any = null;
let opaInitialized = false;

// Função para inicializar OPA WASM
async function initializeOPA(): Promise<boolean> {
  if (opaInitialized) return true;

  try {
    // Em produção, carregaria o arquivo .wasm compilado
    // Por enquanto, usamos validação TypeScript como fallback
    console.log('OPA WASM não disponível, usando validação TypeScript');
    opaInitialized = true;
    return true;
  } catch (error) {
    console.error('Erro ao inicializar OPA:', error);
    return false;
  }
}

// Validação TypeScript flexível como fallback
function validatePolicyTypeScript(
  politicaJson: PoliticaJson
): ValidationResult {
  const _startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // =============================================================================
  // 🔴 VALIDAÇÕES CRÍTICAS - Apenas o mínimo necessário para funcionamento
  // =============================================================================

  // 1. Estrutura mínima obrigatória
  if (!politicaJson.limites_por_valor) {
    errors.push('CRÍTICO: Política deve ter limites_por_valor');
  } else if (Object.keys(politicaJson.limites_por_valor).length === 0) {
    errors.push('CRÍTICO: Deve ter pelo menos uma faixa de valor');
  }

  // 2. Validação mínima de faixas
  if (politicaJson.limites_por_valor) {
    for (const [faixaNome, faixa] of Object.entries(
      politicaJson.limites_por_valor
    )) {
      if (!faixa.max_valor || faixa.max_valor <= 0) {
        errors.push(`CRÍTICO: Faixa ${faixaNome} deve ter max_valor > 0`);
      }
      if (!faixa.aprovadores || faixa.aprovadores.length === 0) {
        errors.push(
          `CRÍTICO: Faixa ${faixaNome} deve ter pelo menos um aprovador`
        );
      }

      // Validação básica de aprovadores (devem ser strings)
      if (faixa.aprovadores) {
        for (const aprovador of faixa.aprovadores) {
          if (typeof aprovador !== 'string' || aprovador.length === 0) {
            errors.push(
              `CRÍTICO: Aprovador inválido em ${faixaNome}: deve ser string não vazia`
            );
          }
        }
      }
    }
  }

  // =============================================================================
  // 🟡 VALIDAÇÕES IMPORTANTES - Geram warnings, não impedem funcionamento
  // =============================================================================

  // Estrutura recomendada
  const estruturaFaltante: string[] = [];
  if (!politicaJson.categorias) estruturaFaltante.push('categorias');
  if (!politicaJson.sla_horas_por_etapa)
    estruturaFaltante.push('sla_horas_por_etapa');
  if (!politicaJson.anexos_min_por_faixa)
    estruturaFaltante.push('anexos_min_por_faixa');
  if (!politicaJson.escalonamento) estruturaFaltante.push('escalonamento');

  if (estruturaFaltante.length > 0) {
    warnings.push(
      `IMPORTANTE: Estrutura incompleta - faltam: ${estruturaFaltante.join(', ')}`
    );
  }

  // Validação detalhada de faixas (warnings)
  if (politicaJson.limites_por_valor) {
    for (const [faixaNome, faixa] of Object.entries(
      politicaJson.limites_por_valor
    )) {
      // SLA ausente
      if (!faixa.sla_horas) {
        warnings.push(
          `IMPORTANTE: Faixa ${faixaNome} sem SLA - pode causar demoras`
        );
      } else if (faixa.sla_horas <= 0) {
        warnings.push(`IMPORTANTE: Faixa ${faixaNome} tem SLA inválido`);
      } else if (faixa.sla_horas > 72) {
        warnings.push(
          `IMPORTANTE: Faixa ${faixaNome} tem SLA muito longo (${faixa.sla_horas}h)`
        );
      }

      // Anexos ausentes
      if (!faixa.anexos_min) {
        warnings.push(`IMPORTANTE: Faixa ${faixaNome} sem anexos obrigatórios`);
      }

      // Valores muito altos
      if (faixa.max_valor > 1000000) {
        warnings.push(
          `IMPORTANTE: Faixa ${faixaNome} com valor muito alto (${faixa.max_valor.toLocaleString()})`
        );
      }

      // Aprovadores não padrão (warning, não erro)
      if (faixa.aprovadores) {
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
        for (const aprovador of faixa.aprovadores) {
          if (!aprovadoresPadrao.includes(aprovador.toLowerCase())) {
            warnings.push(
              `IMPORTANTE: Aprovador não padrão '${aprovador}' em ${faixaNome}`
            );
          }
        }
      }

      // Faixa de valor alto com poucos aprovadores
      if (faixa.aprovadores.length === 1 && faixa.max_valor > 10000) {
        warnings.push(
          `IMPORTANTE: Faixa ${faixaNome} com valor alto deveria ter múltiplos aprovadores`
        );
      }
    }
  }

  // Validação de categorias especiais (warnings)
  if (politicaJson.categorias) {
    for (const [categoriaNome, categoria] of Object.entries(
      politicaJson.categorias
    )) {
      if (categoria.extra === true) {
        if (
          !categoria.aprovadores_adicionais ||
          categoria.aprovadores_adicionais.length === 0
        ) {
          warnings.push(
            `IMPORTANTE: Categoria ${categoriaNome} com extra=true sem aprovadores_adicionais`
          );
        }
      }

      // CAPEX especial
      if (categoriaNome === 'CAPEX' && categoria.extra !== true) {
        warnings.push(
          'IMPORTANTE: Categoria CAPEX deveria ter aprovação extra (extra=true)'
        );
      }
    }
  }

  // Validação de SLA por etapa (warnings)
  if (politicaJson.sla_horas_por_etapa) {
    for (const [papel, sla] of Object.entries(
      politicaJson.sla_horas_por_etapa
    )) {
      if (!sla || sla <= 0) {
        warnings.push(`IMPORTANTE: SLA inválido para ${papel}`);
      }
    }
  }

  // Validação de escalonamento (warnings)
  if (politicaJson.escalonamento) {
    const destinosValidos = ['diretor', 'cfo', 'ceo', 'director', 'finance'];
    for (const [papel, destino] of Object.entries(politicaJson.escalonamento)) {
      if (!destinosValidos.includes(destino.toLowerCase())) {
        warnings.push(
          `IMPORTANTE: Escalonamento ${papel} → ${destino} pode ser inválido`
        );
      }
    }
  }

  // =============================================================================
  // 🔵 SUGESTÕES - Melhorias recomendadas
  // =============================================================================

  if (!politicaJson.anexos_min_por_faixa) {
    suggestions.push(
      'RECOMENDADO: Adicione anexos_min_por_faixa para documentos obrigatórios por valor'
    );
  }

  if (
    politicaJson.sla_horas_por_etapa &&
    !politicaJson.sla_horas_por_etapa.default
  ) {
    suggestions.push(
      'RECOMENDADO: Defina SLA padrão em sla_horas_por_etapa.default'
    );
  }

  if (!politicaJson.escalonamento) {
    suggestions.push(
      'RECOMENDADO: Configure escalonamento para aprovações em atraso'
    );
  }

  if (Object.keys(politicaJson.limites_por_valor).length === 1) {
    suggestions.push(
      'RECOMENDADO: Configure múltiplas faixas de valor para melhor controle'
    );
  }

  if (politicaJson.categorias && !politicaJson.categorias.OPEX) {
    suggestions.push(
      'RECOMENDADO: Adicione categoria OPEX para despesas operacionais'
    );
  }

  if (politicaJson.categorias && !politicaJson.categorias.CAPEX) {
    suggestions.push(
      'RECOMENDADO: Adicione categoria CAPEX para investimentos'
    );
  }

  const validationTime = Date.now() - startTime;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    validation_time_ms: validationTime,
  };
}

// Função principal de validação OPA (agora flexível)
export async function validatePolicyWithOPA(
  politicaJson: PoliticaJson
): Promise<ValidationResult> {
  const _startTime = Date.now();

  try {
    // Tentar inicializar OPA
    const opaAvailable = await initializeOPA();

    if (opaAvailable && opaModule) {
      // Usar OPA WASM se disponível
      // TODO: Implementar quando OPA WASM estiver configurado
      console.log('OPA WASM disponível, mas não implementado ainda');
    }

    // Usar validação flexível TypeScript como método principal
    const result = validatePolicyCompatible(politicaJson);

    // Adicionar informação sobre método usado
    if (!opaModule) {
      result.suggestions.push(
        'Usando validação flexível TypeScript (OPA WASM não disponível)'
      );
    }

    return result;
  } catch (error) {
    console.error('Erro na validação OPA:', error);

    // Fallback para validação básica
    const fallbackResult = validatePolicyTypeScript(politicaJson);

    return {
      ...fallbackResult,
      errors: [`Erro na validação: ${error}`, ...fallbackResult.errors],
      suggestions: [
        'Usando validação de emergência',
        ...fallbackResult.suggestions,
      ],
    };
  }
}

// Função para validar política com modo strict
export async function validatePolicyStrict(
  politicaJson: PoliticaJson
): Promise<ValidationResult> {
  const result = await validatePolicyWithOPA(politicaJson);

  // Em modo strict, warnings viram errors
  if (result.warnings.length > 0) {
    result.errors.push(...result.warnings);
    result.warnings = [];
    result.valid = result.errors.length === 0;
  }

  return result;
}

// ===== NOVAS FUNÇÕES FLEXÍVEIS =====

/**
 * Validação flexível com informações detalhadas de maturidade
 */
export async function validatePolicyDetailed(politicaJson: PoliticaJson) {
  return validatePolicyFlexible(politicaJson);
}

/**
 * Gerar relatório de validação para auditoria
 */
export function generatePolicyValidationReport(
  politicaJson: PoliticaJson
): string {
  return generateValidationReport(politicaJson);
}

/**
 * Validação rápida para APIs - apenas valid/invalid
 */
export async function validatePolicyQuick(
  politicaJson: PoliticaJson
): Promise<boolean> {
  const result = await validatePolicyWithOPA(politicaJson);
  return result.valid;
}

/**
 * Política mínima de exemplo para onboarding
 */
export function createMinimalPolicy(): PoliticaJson {
  return {
    limites_por_valor: {
      basico: {
        max_valor: 1000,
        aprovadores: ['gerente'],
        sla_horas: 24,
        anexos_min: ['descricao'],
      },
    },
    categorias: {
      GERAL: {
        extra: false,
      },
    },
    sla_horas_por_etapa: {
      gerente: 24,
    },
    anexos_min_por_faixa: {
      basico: ['descricao'],
    },
    escalonamento: {
      gerente: 'diretor',
    },
  };
}

/**
 * Política completa de exemplo para referência
 */
export function createCompletePolicy(): PoliticaJson {
  return {
    limites_por_valor: {
      ate_1000: {
        max_valor: 1000,
        aprovadores: ['gerente'],
        sla_horas: 4,
        anexos_min: ['descricao'],
      },
      '1000_5000': {
        max_valor: 5000,
        aprovadores: ['gerente', 'diretor'],
        sla_horas: 8,
        anexos_min: ['descricao', 'cotacao'],
      },
      '5000_25000': {
        max_valor: 25000,
        aprovadores: ['diretor', 'cfo'],
        sla_horas: 24,
        anexos_min: ['descricao', 'cotacao', 'justificativa'],
      },
      acima_25000: {
        max_valor: 999999,
        aprovadores: ['cfo', 'ceo'],
        sla_horas: 48,
        anexos_min: [
          'descricao',
          'cotacao',
          'justificativa',
          'proposta_tecnica',
        ],
      },
    },
    categorias: {
      OPEX: {
        extra: false,
      },
      CAPEX: {
        extra: true,
        aprovadores_adicionais: ['cfo'],
        sla_extra: 24,
      },
    },
    sla_horas_por_etapa: {
      gerente: 4,
      diretor: 8,
      cfo: 24,
      ceo: 48,
      default: 24,
    },
    anexos_min_por_faixa: {
      ate_1000: ['descricao'],
      '1000_5000': ['descricao', 'cotacao'],
      '5000_25000': ['descricao', 'cotacao', 'justificativa'],
      acima_25000: [
        'descricao',
        'cotacao',
        'justificativa',
        'proposta_tecnica',
      ],
    },
    escalonamento: {
      gerente: 'diretor',
      diretor: 'cfo',
      cfo: 'ceo',
    },
  };
}
