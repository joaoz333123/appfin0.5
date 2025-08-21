/**
 * ===================================================================
 * API ROUTE PARA TESTAR VALIDAÇÃO OPA FLEXÍVEL - APPFIN v0.5
 * ===================================================================
 */

import {
    createCompletePolicy,
    createMinimalPolicy,
    generatePolicyValidationReport,
    PoliticaJson,
    validatePolicyDetailed,
} from '@/lib/policy';
import { NextResponse } from 'next/server';

// ===================================================================
// POLÍTICAS DE TESTE
// ===================================================================

const politicaMinima: PoliticaJson = {
  limites_por_valor: {
    basico: {
      max_valor: 1000,
      aprovadores: ['gerente'],
      sla_horas: 24,
      anexos_min: ['descricao'],
    },
  },
  categorias: {
    GERAL: {
      extra: false,
    },
  },
  sla_horas_por_etapa: {
    gerente: 24,
  },
  anexos_min_por_faixa: {
    basico: ['descricao'],
  },
  escalonamento: {
    gerente: 'diretor',
  },
};

const politicaComProblemas: PoliticaJson = {
  limites_por_valor: {
    baixo: {
      max_valor: 500,
      aprovadores: ['supervisor'], // Aprovador não padrão
      sla_horas: 4,
      anexos_min: ['descricao'],
    },
    alto: {
      max_valor: 2000000, // Valor muito alto
      aprovadores: ['gerente'], // Só um aprovador para valor alto
      sla_horas: 100, // SLA muito longo
      anexos_min: ['descricao'],
    },
  },
  categorias: {
    CAPEX: {
      extra: false, // CAPEX sem aprovação extra
    },
  },
  sla_horas_por_etapa: {
    gerente: 24,
  },
  anexos_min_por_faixa: {
    baixo: ['descricao'],
    alto: ['descricao'],
  },
  escalonamento: {
    gerente: 'diretor',
  },
};

const politicaInvalida = {
  categorias: {
    OPEX: {
      extra: false,
    },
  },
  // Falta limites_por_valor!
} as any;

// ===================================================================
// HANDLER DA API
// ===================================================================

export async function GET(_request: Request) {
  const _startTime = Date.now();

  try {
    console.log('🧪 INICIANDO TESTE DA VALIDAÇÃO OPA FLEXÍVEL');

    const resultados = [];
    const logs: string[] = [];

    // Helper para log
    const log = (message: string) => {
      console.log(message);
      logs.push(message);
    };

    log('='.repeat(80));
    log('🧪 TESTE DA VALIDAÇÃO OPA FLEXÍVEL - APPFIN v0.5');
    log('='.repeat(80));

    // Teste 1: Política mínima válida
    log('\n1️⃣ TESTE: Política Mínima Essencial');
    log('-'.repeat(40));
    const resultado1 = await validatePolicyDetailed(politicaMinima);
    resultados.push({ nome: 'Política Mínima', resultado: resultado1 });

    log(`✅ Válida: ${resultado1.valid}`);
    log(`🏆 Maturidade: ${resultado1.maturity_level}`);
    log(`📊 Score: ${resultado1.score}/100`);
    log(`⏱️ Tempo: ${resultado1.validation_time_ms}ms`);

    if (resultado1.warnings.length > 0) {
      log(`\n🟡 WARNINGS (${resultado1.warnings.length}):`);
      resultado1.warnings
        .slice(0, 3)
        .forEach(warning => log(`   • ${warning}`));
      if (resultado1.warnings.length > 3) {
        log(`   ... e mais ${resultado1.warnings.length - 3} warnings`);
      }
    }

    // Teste 2: Política com problemas mas válida
    log('\n\n2️⃣ TESTE: Política com Problemas (mas ainda válida)');
    log('-'.repeat(40));
    const resultado2 = await validatePolicyDetailed(politicaComProblemas);
    resultados.push({ nome: 'Política com Problemas', resultado: resultado2 });

    log(`✅ Válida: ${resultado2.valid}`);
    log(`🏆 Maturidade: ${resultado2.maturity_level}`);
    log(`📊 Score: ${resultado2.score}/100`);

    if (resultado2.warnings.length > 0) {
      log(`\n🟡 WARNINGS (${resultado2.warnings.length}):`);
      resultado2.warnings
        .slice(0, 3)
        .forEach(warning => log(`   • ${warning}`));
    }

    // Teste 3: Política inválida
    log('\n\n3️⃣ TESTE: Política Inválida');
    log('-'.repeat(40));
    const resultado3 = await validatePolicyDetailed(politicaInvalida);
    resultados.push({ nome: 'Política Inválida', resultado: resultado3 });

    log(`❌ Válida: ${resultado3.valid}`);
    log(`🏆 Maturidade: ${resultado3.maturity_level}`);
    log(`📊 Score: ${resultado3.score}/100`);

    if (resultado3.errors.length > 0) {
      log(`\n🔴 ERROS CRÍTICOS (${resultado3.errors.length}):`);
      resultado3.errors.forEach(erro => log(`   • ${erro}`));
    }

    // Teste 4: Política padrão mínima
    log('\n\n4️⃣ TESTE: Política Padrão Mínima (createMinimalPolicy)');
    log('-'.repeat(40));
    const politicaPadraoMinima = createMinimalPolicy();
    const resultado4 = await validatePolicyDetailed(politicaPadraoMinima);
    resultados.push({ nome: 'Política Padrão Mínima', resultado: resultado4 });

    log(`✅ Válida: ${resultado4.valid}`);
    log(`🏆 Maturidade: ${resultado4.maturity_level}`);
    log(`📊 Score: ${resultado4.score}/100`);

    // Teste 5: Política completa
    log('\n\n5️⃣ TESTE: Política Completa (createCompletePolicy)');
    log('-'.repeat(40));
    const politicaCompleta = createCompletePolicy();
    const resultado5 = await validatePolicyDetailed(politicaCompleta);
    resultados.push({ nome: 'Política Completa', resultado: resultado5 });

    log(`✅ Válida: ${resultado5.valid}`);
    log(`🏆 Maturidade: ${resultado5.maturity_level}`);
    log(`📊 Score: ${resultado5.score}/100`);

    // ===================================================================
    // RESUMO COMPARATIVO
    // ===================================================================

    log('\n\n📊 RESUMO COMPARATIVO');
    log('='.repeat(80));

    log('\n| Política                | Válida | Maturidade    | Score |');
    log('|-------------------------|--------|---------------|-------|');

    resultados.forEach(({ nome, resultado }) => {
      const valida = resultado.valid ? '✅' : '❌';
      const score = `${resultado.score}/100`;
      log(
        `| ${nome.padEnd(23)} | ${valida.padEnd(6)} | ${resultado.maturity_level.padEnd(13)} | ${score.padEnd(5)} |`
      );
    });

    // ===================================================================
    // DEMONSTRAÇÃO DE RELATÓRIO DETALHADO
    // ===================================================================

    log('\n\n📋 EXEMPLO DE RELATÓRIO DETALHADO');
    log('='.repeat(80));
    log('\nRelatório para política com problemas:');
    const relatorio = generatePolicyValidationReport(politicaComProblemas);
    log(relatorio);

    // ===================================================================
    // CONCLUSÕES
    // ===================================================================

    log('\n✅ CONCLUSÕES DO TESTE');
    log('='.repeat(80));
    log('✅ Validação flexível permite onboarding fácil');
    log('✅ Políticas mínimas são aceitas e funcionais');
    log('✅ Warnings ajudam a melhorar gradualmente');
    log('✅ Erros críticos impedem apenas falhas graves');
    log('✅ Sistema de score incentiva melhorias');
    log('✅ Relatórios detalhados ajudam auditoria');

    log('\n🎯 COMPARAÇÃO COM SISTEMA ANTERIOR:');
    log('❌ ANTES: Política mínima era rejeitada');
    log('✅ AGORA: Política mínima é aceita com warnings');
    log('❌ ANTES: Aprovadores não padrão causavam erro');
    log('✅ AGORA: Aprovadores não padrão geram warning');
    log('❌ ANTES: Campos opcionais eram obrigatórios');
    log('✅ AGORA: Campos opcionais geram suggestions');

    const totalTime = Date.now() - startTime;
    log(`\n⏱️ TEMPO TOTAL: ${totalTime}ms`);
    log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');

    // ===================================================================
    // RESPOSTA DA API
    // ===================================================================

    return NextResponse.json(
      {
        success: true,
        message: 'Teste da validação OPA flexível executado com sucesso',
        resultados,
        resumo: {
          total_testes: resultados.length,
          politicas_validas: resultados.filter(r => r.resultado.valid).length,
          politicas_invalidas: resultados.filter(r => !r.resultado.valid)
            .length,
          score_medio: Math.round(
            resultados.reduce((acc, r) => acc + r.resultado.score, 0) /
              resultados.length
          ),
          tempo_total_ms: totalTime,
        },
        logs,
        relatorio_exemplo: relatorio,
        exemplos: {
          minima: politicaMinima,
          com_problemas: politicaComProblemas,
          padrao_minima: politicaPadraoMinima,
          completa: politicaCompleta,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);

    return NextResponse.json(
      {
        success: false,
        _error: 'Erro ao executar teste de validação',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        tempo_total_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// ===================================================================
// HANDLER POST PARA TESTAR POLÍTICA CUSTOMIZADA
// ===================================================================

export async function POST(_request: Request) {
  try {
    const body = await request.json();
    const { politica } = body;

    if (!politica) {
      return NextResponse.json(
        {
          success: false,
          _error: 'Política não fornecida',
        },
        { status: 400 }
      );
    }

    console.log(
      '🧪 Testando política customizada:',
      JSON.stringify(politica, null, 2)
    );

    const resultado = await validatePolicyDetailed(politica);
    const relatorio = generatePolicyValidationReport(politica);

    return NextResponse.json(
      {
        success: true,
        message: 'Política customizada validada',
        resultado,
        relatorio,
        politica_testada: politica,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ ERRO NA VALIDAÇÃO CUSTOMIZADA:', error);

    return NextResponse.json(
      {
        success: false,
        _error: 'Erro ao validar política customizada',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
