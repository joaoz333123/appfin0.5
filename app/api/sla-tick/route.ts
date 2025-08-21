import { checkSLA } from '@/lib/policy';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(_request: Request) {
  return NextResponse.json({
    message: 'SLA Tick endpoint - use POST para executar verificações',
    status: 'ready',
  });
}

export async function POST(_request: Request) {
  try {
    // Buscar todas as aprovações pendentes
    const { _data: aprovacoes, _error: aprovacoesError } = await supabase
      .from('aprovacoes')
      .select(
        `
        *,
        pedidos (*)
      `
      )
      .eq('decisao', 'pendente');

    if (aprovacoesError) {
      return NextResponse.json(
        { _error: aprovacoesError.message },
        { status: 400 }
      );
    }

    const notificacoes = [];

    for (const aprovacao of aprovacoes || []) {
      const pedido = aprovacao.pedidos;

      // Buscar política ativa
      const { _data: politica } = await supabase
        .from('politicas')
        .select('json')
        .eq('versao', pedido.politica_versao)
        .single();

      if (politica) {
        const slaStatus = checkSLA(pedido, [aprovacao], politica.json);

        if (slaStatus.atrasado) {
          // Criar notificação de escalonamento
          for (const atraso of slaStatus.atrasos) {
            notificacoes.push({
              user_id: aprovacao.aprovador_id,
              tipo: 'escala',
              payload_json: {
                pedido_id: pedido.id,
                pedido_titulo: pedido.titulo,
                papel: atraso.papel,
                horas_atraso: atraso.horasAtraso,
                proximo_aprovador: politica.json.escalonamento[atraso.papel],
              },
              lida: false,
              criada_em: new Date().toISOString(),
            });
          }
        } else if (slaStatus.proximoVencimento) {
          const horasRestantes = Math.floor(
            (slaStatus.proximoVencimento.getTime() - new Date().getTime()) /
              (1000 * 60 * 60)
          );

          if (horasRestantes <= 2) {
            // Criar notificação de lembrete
            notificacoes.push({
              user_id: aprovacao.aprovador_id,
              tipo: 'lembrete',
              payload_json: {
                pedido_id: pedido.id,
                pedido_titulo: pedido.titulo,
                horas_restantes: horasRestantes,
              },
              lida: false,
              criada_em: new Date().toISOString(),
            });
          }
        }
      }
    }

    // Salvar notificações
    if (notificacoes.length > 0) {
      const { _error: notifError } = await supabase
        .from('notificacoes')
        .insert(notificacoes);

      if (notifError) {
        console.error('Erro ao salvar notificações:', notifError);
      }
    }

    return NextResponse.json({
      success: true,
      notificacoes_criadas: notificacoes.length,
    });
  } catch (error) {
    console.error('Erro no SLA tick:', error);
    return NextResponse.json({ _error: 'Erro interno' }, { status: 500 });
  }
}
