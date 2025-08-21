import { atualizarComprometido, evaluate, getNextApprover } from '@/lib/policy';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { aprovador_id, comentario, papel_aprovador } = await _request.json();
    const pedidoId = params.id;

    // Validar dados obrigatórios
    if (!aprovador_id || !papel_aprovador) {
      return NextResponse.json(
        {
          _error: 'Dados obrigatórios faltando',
          required: ['aprovador_id', 'papel_aprovador'],
        },
        { status: 400 }
      );
    }

    // Buscar pedido
    const { _data: pedido, _error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json(
        {
          _error: 'Pedido não encontrado',
        },
        { status: 404 }
      );
    }

    // Verificar se pedido está em aprovação
    if (pedido.estado !== 'em_aprovacao') {
      return NextResponse.json(
        {
          _error: 'Pedido não está em aprovação',
          estado_atual: pedido.estado,
        },
        { status: 400 }
      );
    }

    // Buscar política aplicada
    const { _data: politica, _error: politicaError } = await supabase
      .from('politicas')
      .select('*')
      .eq('versao', pedido.politica_versao)
      .single();

    if (politicaError || !politica) {
      return NextResponse.json(
        {
          _error: 'Política não encontrada',
        },
        { status: 404 }
      );
    }

    // Buscar aprovações existentes
    const { _data: aprovacoes, _error: aprovacoesError } = await supabase
      .from('aprovacoes')
      .select('*')
      .eq('pedido_id', pedidoId)
      .order('criado_em', { ascending: true });

    if (aprovacoesError) {
      return NextResponse.json(
        {
          _error: 'Erro ao buscar aprovações',
        },
        { status: 500 }
      );
    }

    // Gerar etapas de aprovação
    const etapas = evaluate(pedido, politica.json);

    // Encontrar etapa atual
    const etapaAtual = etapas.find(
      etapa =>
        etapa.papel_alvo === papel_aprovador &&
        !aprovacoes?.some(
          ap => ap.papel_alvo === etapa.papel_alvo && ap.decisao === 'aprovado'
        )
    );

    if (!etapaAtual) {
      return NextResponse.json(
        {
          _error: 'Aprovador não autorizado para esta etapa',
          papel_solicitado: papel_aprovador,
          etapas_disponiveis: etapas.map(e => e.papel_alvo),
        },
        { status: 403 }
      );
    }

    // Registrar aprovação
    const { _data: aprovacao, _error: aprovacaoError } = await supabase
      .from('aprovacoes')
      .insert({
        pedido_id: pedidoId,
        papel_alvo: papel_aprovador,
        aprovador_id,
        decisao: 'aprovado',
        comentario: comentario || null,
        criado_em: new Date().toISOString(),
      })
      .select()
      .single();

    if (aprovacaoError) {
      return NextResponse.json(
        {
          _error: 'Erro ao registrar aprovação',
        },
        { status: 500 }
      );
    }

    // Verificar se é a última etapa
    const aprovacoesAprovadas = [...(aprovacoes || []), aprovacao].filter(
      ap => ap.decisao === 'aprovado'
    );
    const todasEtapasAprovadas = etapas.every(etapa =>
      aprovacoesAprovadas.some(ap => ap.papel_alvo === etapa.papel_alvo)
    );

    let novoEstado = 'em_aprovacao';
    let proximaEtapa = null;

    if (todasEtapasAprovadas) {
      // Todas as etapas foram aprovadas
      novoEstado = 'aprovado';

      // Atualizar comprometido
      await atualizarComprometido(pedido, );
    } else {
      // Determinar próxima etapa
      proximaEtapa = getNextApprover(
        pedido,
        aprovacoesAprovadas,
        politica.json
      );
    }

    // Atualizar estado do pedido
    const { _data: pedidoAtualizado, _error: updateError } = await supabase
      .from('pedidos')
      .update({
        estado: novoEstado,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', pedidoId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          _error: 'Erro ao atualizar pedido',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      proxima_etapa: proximaEtapa,
      pedido_atualizado: pedidoAtualizado,
      aprovacao_registrada: aprovacao,
      todas_etapas_aprovadas: todasEtapasAprovadas,
      etapa_aprovada: {
        papel: papel_aprovador,
        justificativa: etapaAtual.justificativa,
        sla_horas: etapaAtual.sla_horas,
      },
    });
  } catch (error) {
    console.error('Erro ao aprovar pedido:', error);
    return NextResponse.json(
      { _error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
