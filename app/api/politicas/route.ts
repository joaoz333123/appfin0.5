import { validatePolicyWithOPA } from '@/lib/policy';
import { executeWithRetry, supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(_request: Request) {
  try {
    const { politica, versao } = await request.json();

    // Validação básica dos campos obrigatórios
    if (!politica || !versao) {
      return NextResponse.json(
        {
          _error: 'Campos obrigatórios: politica e versao são necessários',
        },
        { status: 400 }
      );
    }

    // Validar política antes de salvar
    console.log('🔍 Validando política antes de salvar...');
    const validationResult = await validatePolicyWithOPA(politica);

    if (!validationResult.valid) {
      console.log('❌ Política inválida:', validationResult.errors);
      return NextResponse.json(
        {
          _error: 'Política inválida',
          validation: validationResult,
        },
        { status: 400 }
      );
    }

    if (validationResult.warnings.length > 0) {
      console.log('⚠️ Política com warnings:', validationResult.warnings);
    }

    // Inserir no Supabase com estrutura correta e retry
    const { data, error } = await executeWithRetry(() =>
      supabase
        .from('politicas')
        .insert({
          json: politica, // Usar campo 'json' conforme schema
          versao: versao,
          criado_por: 'system', // Campo obrigatório
        })
        .select()
        .single()
    );

    if (error) {
      console.error('Erro Supabase:', error);
      return NextResponse.json(
        {
          _error: error.message,
          details: error,
        },
        { status: 400 }
      );
    }

    console.log('✅ Política salva com sucesso');
    return NextResponse.json({
      success: true,
      data,
      validation: validationResult,
    });
  } catch (error) {
    console.error('Erro ao criar política:', error);
    return NextResponse.json(
      {
        _error: 'Erro interno',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Tentar buscar do Supabase se configurado com retry
    try {
      const { data, error } = await executeWithRetry(() =>
        supabase
          .from('politicas')
          .select('*')
          .order('criado_em', { ascending: false })
      );

      if (!error && data) {
        return NextResponse.json({ data });
      }
    } catch (dbError) {
      console.log('Supabase não configurado, usando dados de exemplo');
    }

    // Dados de exemplo se não há conexão com banco
    const exampleData = [
      {
        id: '1',
        versao: 'v1.0',
        json: {
          limites_por_valor: {
            ate_1000: { max_valor: 1000, aprovadores: ['N1'], sla_horas: 24 },
            ate_5000: {
              max_valor: 5000,
              aprovadores: ['N1', 'N2'],
              sla_horas: 48,
            },
            ate_25000: {
              max_valor: 25000,
              aprovadores: ['N1', 'N2', 'CFO'],
              sla_horas: 72,
            },
          },
          categorias: {
            OPEX: { extra: false },
            CAPEX: { extra: true, aprovadores_adicionais: ['TI'] },
          },
        },
        criado_por: 'admin',
        criado_em: '2024-01-15T10:00:00Z',
      },
    ];

    return NextResponse.json({ _data: exampleData });
  } catch (error) {
    console.error('Erro ao buscar políticas:', error);
    return NextResponse.json({ _error: 'Erro interno' }, { status: 500 });
  }
}
