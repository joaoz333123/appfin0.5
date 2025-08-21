import { verificarDuplicatas } from '@/lib/policy';
import { NextResponse } from 'next/server';

export async function POST(_request: Request) {
  try {
    const { titulo, categoria, valor, solicitante_id, cc } =
      await request.json();

    // Validar dados obrigatórios
    if (!titulo || !categoria || !valor || !solicitante_id || !cc) {
      return NextResponse.json(
        {
          _error: 'Dados obrigatórios faltando',
          required: ['titulo', 'categoria', 'valor', 'solicitante_id', 'cc'],
        },
        { status: 400 }
      );
    }

    // Criar objeto pedido parcial para verificação
    const pedidoParcial = {
      titulo,
      categoria,
      valor: parseFloat(valor),
      solicitante_id,
      cc,
    };

    // Verificar duplicatas
    const { duplicatas, similaridade } = await verificarDuplicatas(
      pedidoParcial,

    );

    // Formatar resposta
    const duplicatasFormatadas = duplicatas.map(pedido => ({
      id: pedido.id,
      titulo: pedido.titulo,
      valor: pedido.valor,
      categoria: pedido.categoria,
      cc: pedido.cc,
      estado: pedido.estado,
      criado_em: pedido.criado_em,
      similaridade: 0.9, // Similaridade alta para duplicatas detectadas
    }));

    return NextResponse.json({
      duplicatas: duplicatasFormatadas,
      tem_duplicatas: duplicatas.length > 0,
      total_duplicatas: duplicatas.length,
      similaridade_geral: similaridade,
      pedido_verificado: {
        titulo,
        categoria,
        valor: parseFloat(valor),
        cc,
      },
    });
  } catch (error) {
    console.error('Erro ao verificar duplicatas:', error);
    return NextResponse.json(
      { _error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
