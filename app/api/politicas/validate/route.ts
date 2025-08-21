import {
    PoliticaJson,
    validatePolicyStrict,
    validatePolicyWithOPA,
} from '@/lib/policy';
import { NextResponse } from 'next/server';

export async function POST(_request: Request) {
  try {
    const { politica, strict = false } = await request.json();

    // Validar se política foi fornecida
    if (!politica) {
      return NextResponse.json(
        {
          valid: false,
          errors: ['Política não fornecida'],
          warnings: [],
          suggestions: [],
          validation_time_ms: 0,
        },
        { status: 400 }
      );
    }

    // Validar estrutura básica do JSON
    if (typeof politica !== 'object' || politica === null) {
      return NextResponse.json(
        {
          valid: false,
          errors: ['Política deve ser um objeto JSON válido'],
          warnings: [],
          suggestions: [],
          validation_time_ms: 0,
        },
        { status: 400 }
      );
    }

    // Executar validação
    const _startTime = Date.now();
    const result = strict
      ? await validatePolicyStrict(politica as PoliticaJson)
      : await validatePolicyWithOPA(politica as PoliticaJson);

    const totalTime = Date.now() - startTime;

    // Adicionar tempo total da requisição
    result.validation_time_ms = totalTime;

    // Log da validação
    console.log(
      `Validação de política: ${result.valid ? '✅ VÁLIDA' : '❌ INVÁLIDA'} em ${totalTime}ms`
    );
    if (result.errors.length > 0) {
      console.log('Erros:', result.errors);
    }
    if (result.warnings.length > 0) {
      console.log('Warnings:', result.warnings);
    }

    // Retornar resultado
    const status = result.valid ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error('Erro na validação de política:', error);

    return NextResponse.json(
      {
        valid: false,
        errors: [`Erro interno na validação: ${error}`],
        warnings: [],
        suggestions: ['Verifique se a política está no formato correto'],
        validation_time_ms: 0,
      },
      { status: 500 }
    );
  }
}

// GET para documentação da API
export async function GET() {
  return NextResponse.json({
    message: 'API de Validação de Políticas',
    endpoint: 'POST /api/politicas/validate',
    body: {
      politica: 'PoliticaJson',
      strict: 'boolean (opcional, padrão: false)',
    },
    response: {
      valid: 'boolean',
      errors: 'string[]',
      warnings: 'string[]',
      suggestions: 'string[]',
      validation_time_ms: 'number',
    },
    example: {
      politica: {
        limites_por_valor: {
          ate_1000: {
            max_valor: 1000,
            aprovadores: ['gerente'],
            sla_horas: 4,
            anexos_min: ['descricao'],
          },
        },
        categorias: {
          CAPEX: {
            extra: true,
            aprovadores_adicionais: ['cfo'],
          },
        },
        sla_horas_por_etapa: {
          gerente: 4,
          diretor: 8,
          cfo: 24,
        },
        anexos_min_por_faixa: {
          ate_1000: ['descricao'],
        },
        escalonamento: {
          gerente: 'diretor',
          diretor: 'cfo',
        },
      },
      strict: false,
    },
  });
}
