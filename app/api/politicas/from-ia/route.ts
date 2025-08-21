import { EntrevistaPolitica, gerarPoliticaFromInterview } from '@/lib/ai';
import { validatePolicyWithOPA } from '@/lib/policy';
import { NextResponse } from 'next/server';
export async function POST(_request: Request) {
  try {
    const { entrevista } = await request.json();

    // Validar se entrevista foi fornecida
    if (!entrevista) {
      return NextResponse.json(
        {
          success: false,
          _error: 'Entrevista não fornecida',
          _data: null,
          validation: null,
        },
        { status: 400 }
      );
    }

    console.log('🤖 Gerando política com IA...');
    const _startTime = Date.now();

    // Gerar política com IA
    const resultadoIA = await gerarPoliticaFromInterview(
      entrevista as EntrevistaPolitica
    );

    console.log(`✅ Política gerada em ${Date.now() - startTime}ms`);
    console.log(`📋 Versão: ${resultadoIA.versao}`);
    console.log(`📝 Resumo: ${resultadoIA.resumo}`);

    // Validar política gerada
    console.log('🔍 Validando política gerada...');
    const validationResult = await validatePolicyWithOPA(resultadoIA.json);

    if (!validationResult.valid) {
      console.log('❌ Política inválida:', validationResult.errors);
      return NextResponse.json(
        {
          success: false,
          _error: 'Política gerada é inválida',
          _data: resultadoIA,
          validation: validationResult,
        },
        { status: 400 }
      );
    }

    console.log('✅ Política validada com sucesso');

    // Log de warnings se houver
    if (validationResult.warnings.length > 0) {
      console.log('⚠️ Warnings:', validationResult.warnings);
    }

    // Log de dúvidas e riscos identificados pela IA
    if (resultadoIA.duvidas.length > 0) {
      console.log('❓ Dúvidas:', resultadoIA.duvidas);
    }

    if (resultadoIA.riscos.length > 0) {
      console.log('⚠️ Riscos:', resultadoIA.riscos);
    }

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      _data: resultadoIA,
      validation: validationResult,
      performance: {
        geracao_ms: totalTime,
        validacao_ms: validationResult.validation_time_ms,
      },
    });
  } catch (error) {
    console.error('Erro na geração de política com IA:', error);

    return NextResponse.json(
      {
        success: false,
        _error: `Erro interno: ${error}`,
        _data: null,
        validation: null,
      },
      { status: 500 }
    );
  }
}

// GET para documentação da API
export async function GET() {
  return NextResponse.json({
    message: 'IA Assistente de Políticas',
    endpoint: 'POST /api/politicas/from-ia',
    description: 'Gera política de aprovação a partir de entrevista usando IA',
    body: {
      entrevista: {
        faixas_valor: 'string (ex: "até 1k, 1k-5k, 5k-25k, acima 25k")',
        aprovadores: 'string (ex: "gerente, diretor, CFO, CEO")',
        sla: 'string (ex: "4h, 8h, 24h, 48h")',
        documentos:
          'string (ex: "descrição, cotação, justificativa, proposta técnica")',
        capex: 'string (ex: "sim, exige CFO adicional")',
        escalonamento: 'string (ex: "gerente→diretor→CFO→CEO")',
        especiais: 'string (ex: "urgência, recorrência")',
        excecoes: 'string (ex: "categorias especiais")',
      },
    },
    response: {
      success: 'boolean',
      _data: {
        versao: 'string',
        resumo: 'string',
        json: 'PoliticaJson',
        duvidas: 'string[]',
        riscos: 'string[]',
        sugestoes: 'string[]',
        proximos_passos: 'string[]',
      },
      validation: 'ValidationResult',
      performance: {
        geracao_ms: 'number',
        validacao_ms: 'number',
      },
    },
    example: {
      entrevista: {
        faixas_valor: 'até 1k, 1k-5k, 5k-25k, acima 25k',
        aprovadores: 'gerente, diretor, CFO, CEO',
        sla: '4h, 8h, 24h, 48h',
        documentos: 'descrição, cotação, justificativa, proposta técnica',
        capex: 'sim, exige CFO adicional',
        escalonamento: 'gerente→diretor→CFO→CEO',
        especiais: 'urgência, recorrência',
        excecoes: 'categorias especiais',
      },
    },
  });
}
