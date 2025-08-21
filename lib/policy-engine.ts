import { Pedido, Aprovacao } from './supabase';
import { PoliticaJson } from './policy';

export interface Completa {
  id?: string;
  pedido_id: string;
  papel_alvo: string;
  ordem: number;
  status: 'pendente' | 'aprovado' | 'reprovado' | 'pulado';
  sla_horas: number;
  sla_vencimento: Date;
  comentario?: string;
  aprovado_em?: Date;
  aprovador_id?: string;
  justificativa: string;
}

export interface WorkflowResult {
  etapas: Completa[];
  proxima_etapa: string | null;
  todas_etapas_aprovadas: boolean;
  pedido_finalizado: boolean;
  estado_final: string;
}

export function gerarEtapasDeAprovacao(
  pedido: Pedido,
  politica: PoliticaJson
): Completa[] {
  const etapas: Completa[] = [];

  // Determinar faixa de valor
  const faixa = determinarFaixaValor(pedido.valor, politica.limites_por_valor);

  // Obter aprovadores base da faixa
  const aprovadoresBase = politica.limites_por_valor[faixa]?.aprovadores || [];

  // Verificar se é categoria especial (CAPEX, etc.)
  const categoriaInfo = politica.categorias[pedido.categoria];
  const aprovadoresAdicionais = categoriaInfo?.extra
    ? categoriaInfo.aprovadores_adicionais || []
    : [];

  // Combinar aprovadores (remover duplicatas)
  const todosAprovadores = Array.from(
    new Set([...aprovadoresBase, ...aprovadoresAdicionais])
  );

  // Criar etapas sequenciais
  todosAprovadores.forEach((papel, index) => {
    const slaBase = politica.limites_por_valor[faixa]?.sla_horas || 24;
    const slaExtra = categoriaInfo?.sla_extra || 0;
    const slaFinal = slaBase + slaExtra;

    const justificativa = gerarJustificativa(
      pedido,
      faixa,
      papel,
      categoriaInfo
    );
    const vencimento = new Date();
    vencimento.setHours(vencimento.getHours() + slaFinal);

    etapas.push({
      pedido_id: pedido.id,
      papel_alvo: papel,
      ordem: index + 1,
      status: 'pendente',
      sla_horas: slaFinal,
      sla_vencimento: vencimento,
      justificativa,
    });
  });

  return etapas;
}

export function aplicarPolitica(
  pedido: Pedido,
  politica: PoliticaJson
): WorkflowResult {
  const etapas = gerarEtapasDeAprovacao(pedido, politica);

  // Determinar estado inicial
  const estadoInicial = etapas.length > 0 ? 'em_aprovacao' : 'rascunho';
  const proximaEtapa = etapas.length > 0 ? etapas[0].papel_alvo : null;

  return {
    etapas,
    proxima_etapa: proximaEtapa,
    todas_etapas_aprovadas: false,
    pedido_finalizado: false,
    estado_final: estadoInicial,
  };
}

export function validarAprovador(
  etapa: Completa,
  aprovador_id: string,
  papel_aprovador: string
): boolean {
  // Verificar se o aprovador tem o papel correto
  if (etapa.papel_alvo !== papel_aprovador) {
    return false;
  }

  // Verificar se a etapa está pendente
  if (etapa.status !== 'pendente') {
    return false;
  }

  // Verificar se não expirou o SLA
  if (new Date() > etapa.sla_vencimento) {
    return false;
  }

  return true;
}

export function processarAprovacao(
  pedido: Pedido,
  aprovacoes: Aprovacao[],
  politica: PoliticaJson,
  aprovador_id: string,
  papel_aprovador: string,
  decisao: 'aprovado' | 'reprovado',
  comentario?: string
): WorkflowResult {
  const etapas = gerarEtapasDeAprovacao(pedido, politica);

  // Encontrar etapa atual
  const etapaAtual = etapas.find(
    etapa =>
      etapa.papel_alvo === papel_aprovador &&
      !aprovacoes.some(
        ap => ap.papel_alvo === etapa.papel_alvo && ap.decisao === 'aprovado'
      )
  );

  if (!etapaAtual) {
    throw new Error('Aprovador não autorizado para esta etapa');
  }

  // Validar aprovador
  if (!validarAprovador(etapaAtual, aprovador_id, papel_aprovador)) {
    throw new Error('Aprovador não pode aprovar esta etapa');
  }

  // Atualizar etapa
  etapaAtual.status = decisao;
  etapaAtual.comentario = comentario;
  etapaAtual.aprovador_id = aprovador_id;
  etapaAtual.aprovado_em = new Date();

  // Verificar se é reprovação
  if (decisao === 'reprovado') {
    return {
      etapas,
      proxima_etapa: null,
      todas_etapas_aprovadas: false,
      pedido_finalizado: true,
      estado_final: 'reprovado',
    };
  }

  // Verificar se todas as etapas foram aprovadas
  const aprovacoesAprovadas = [
    ...aprovacoes,
    {
      id: 'temp',
      pedido_id: pedido.id,
      papel_alvo: papel_aprovador,
      aprovador_id,
      decisao: 'aprovado',
      comentario,
      criado_em: new Date().toISOString(),
    },
  ].filter(ap => ap.decisao === 'aprovado');

  const todasEtapasAprovadas = etapas.every(etapa =>
    aprovacoesAprovadas.some(ap => ap.papel_alvo === etapa.papel_alvo)
  );

  // Determinar próxima etapa
  let proximaEtapa = null;
  if (!todasEtapasAprovadas) {
    const proximaEtapaObj = etapas.find(
      etapa =>
        !aprovacoesAprovadas.some(ap => ap.papel_alvo === etapa.papel_alvo)
    );
    proximaEtapa = proximaEtapaObj?.papel_alvo || null;
  }

  return {
    etapas,
    proxima_etapa: proximaEtapa,
    todas_etapas_aprovadas: todasEtapasAprovadas,
    pedido_finalizado: todasEtapasAprovadas,
    estado_final: todasEtapasAprovadas ? 'aprovado' : 'em_aprovacao',
  };
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

  justificativa += ` - Papel: ${papel}`;

  return justificativa;
}

export function calcularSLA(
  pedido: Pedido,
  aprovacoes: Aprovacao[],
  politica: PoliticaJson
): {
  atrasado: boolean;
  proximoVencimento: Date | null;
  atrasos: Array<{ papel: string; horasAtraso: number }>;
  tempoRestante: number | null;
} {
  const etapas = gerarEtapasDeAprovacao(pedido, politica);
  const agora = new Date();
  const atrasos: Array<{ papel: string; horasAtraso: number }> = [];
  let proximoVencimento: Date | null = null;
  let tempoRestante: number | null = null;

  for (const etapa of etapas) {
    const aprovacao = aprovacoes.find(a => a.papel_alvo === etapa.papel_alvo);

    if (aprovacao && aprovacao.decisao === 'pendente') {
      const criadoEm = new Date(aprovacao.criado_em);
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
        tempoRestante = Math.floor(
          (vencimento.getTime() - agora.getTime()) / (60 * 60 * 1000)
        );
      }
    }
  }

  return {
    atrasado: atrasos.length > 0,
    proximoVencimento,
    atrasos,
    tempoRestante,
  };
}
