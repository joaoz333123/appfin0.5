import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { aprovador_id, motivo, sugestoes, papel_aprovador } =
      await _request.json();
    const pedidoId = params.id;

    // Validar dados obrigatórios
    if (!aprovador_id || !motivo || !papel_aprovador) {
      return NextResponse.json(
        {
          _error: 'Dados obrigatórios faltando',
          required: ['aprovador_id', 'motivo', 'papel_aprovador'],
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

    // Registrar reprovação
    const { _data: reprovacao, _error: reprovacaoError } = await supabase
      .from('aprovacoes')
      .insert({
        pedido_id: pedidoId,
        papel_alvo: papel_aprovador,
        aprovador_id,
        decisao: 'reprovado',
        comentario: motivo,
        sugestoes: sugestoes || null,
        criado_em: new Date().toISOString(),
      })
      .select()
      .single();

    if (reprovacaoError) {
      return NextResponse.json(
        {
          _error: 'Erro ao registrar reprovação',
        },
        { status: 500 }
      );
    }

    // Atualizar estado do pedido para reprovado
    const { _data: pedidoAtualizado, _error: updateError } = await supabase
      .from('pedidos')
      .update({
        estado: 'reprovado',
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

    // Criar notificação para o solicitante
    const { _error: notificacaoError } = await supabase
      .from('notificacoes')
      .insert({
        user_id: pedido.solicitante_id,
        tipo: 'pedido_reprovado',
        titulo: 'Pedido Reprovado',
        mensagem: `Seu pedido "${pedido.titulo}" foi reprovado por ${papel_aprovador}. Motivo: ${motivo}`,
        payload_json: {
          pedido_id: pedidoId,
          reprovador: papel_aprovador,
          motivo,
          sugestoes,
        },
        lida: false,
        criada_em: new Date().toISOString(),
      });

    if (notificacaoError) {
      console.error('Erro ao criar notificação:', notificacaoError);
      // Não falhar se a notificação não puder ser criada
    }

    return NextResponse.json({
      success: true,
      pedido_atualizado: pedidoAtualizado,
      reprovacao_registrada: reprovacao,
      notificacao_criada: !notificacaoError,
      detalhes: {
        pedido: pedido.titulo,
        valor: pedido.valor,
        reprovador: papel_aprovador,
        motivo,
        sugestoes: sugestoes || 'Nenhuma sugestão fornecida',
      },
    });
  } catch (error) {
    console.error('Erro ao reprovar pedido:', error);
    return NextResponse.json(
      { _error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
