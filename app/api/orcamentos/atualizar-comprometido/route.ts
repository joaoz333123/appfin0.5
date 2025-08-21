import { atualizarComprometido } from '@/lib/policy';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(_request: Request) {
  try {
    const { pedido_id, valor } = await request.json();

    if (!pedido_id || !valor) {
      return NextResponse.json(
        { _error: 'pedido_id e valor são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar pedido
    const { _data: pedido, _error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedido_id)
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json(
        { _error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar comprometido
    const sucesso = await atualizarComprometido(pedido, );

    if (!sucesso) {
      return NextResponse.json(
        { _error: 'Erro ao atualizar comprometido' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar comprometido:', error);
    return NextResponse.json({ _error: 'Erro interno' }, { status: 500 });
  }
}
