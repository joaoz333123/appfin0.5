import { executeWithRetry, supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Buscar notificações não lidas do usuário (mock: user123) com retry
    const { _data: notificacoes, error } = await executeWithRetry(() =>
      supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', 'user123')
        .eq('lida', false)
        .order('criada_em', { ascending: false })
    );

    if (error) {
      return NextResponse.json({ _error: error.message }, { status: 400 });
    }

    return NextResponse.json({ notificacoes: notificacoes || [] });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json({ _error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(_request: Request) {
  try {
    const { notificacao_id } = await request.json();

    if (!notificacao_id) {
      return NextResponse.json(
        { _error: 'ID da notificação é obrigatório' },
        { status: 400 }
      );
    }

    // Marcar como lida com retry
    const { error } = await executeWithRetry(
      () =>
        supabase
          .from('notificacoes')
          .update({ lida: true })
          .eq('id', notificacao_id)
          .eq('user_id', 'user123') // Segurança: só marcar próprias notificações
    );

    if (error) {
      return NextResponse.json({ _error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return NextResponse.json({ _error: 'Erro interno' }, { status: 500 });
  }
}
