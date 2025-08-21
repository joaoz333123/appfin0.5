/**
 * ===================================================================
 * SCRIPT DE TESTE DA VALIDAÇÃO OPA FLEXÍVEL - APPFIN v0.5
 * ===================================================================
 */

import {
  validatePolicyDetailed,
  generatePolicyValidationReport,
  createMinimalPolicy,
  createCompletePolicy,
  PoliticaJson,
} from '../lib/policy';

// ===================================================================
// POLÍTICAS DE TESTE
// ===================================================================

// Política super mínima - só o essencial
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

// Política com problemas - mas ainda válida
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

// Política inválida - falta o essencial
const politicaInvalida = {
  categorias: {
    OPEX: {
      extra: false,
    },
  },
  // Falta limites_por_valor!
} as any;

// ===================================================================
// FUNÇÃO PRINCIPAL DE TESTE
// ===================================================================

export async function testarValidacaoFlexivel() {
  console.log('🧪 TESTANDO VALIDAÇÃO OPA FLEXÍVEL\n');
  console.log('='.repeat(80));

  const resultados = [];

  // Teste 1: Política mínima válida
  console.log('\n1️⃣ TESTE: Política Mínima Essencial');
  console.log('-'.repeat(40));
  const resultado1 = await validatePolicyDetailed(politicaMinima);
  resultados.push({ nome: 'Política Mínima', resultado: resultado1 });

  console.log(`✅ Válida: ${resultado1.valid}`);
  console.log(`🏆 Maturidade: ${resultado1.maturity_level}`);
  console.log(`📊 Score: ${resultado1.score}/100`);
  console.log(`⏱️ Tempo: ${resultado1.validation_time_ms}ms`);

  if (resultado1.warnings.length > 0) {
    console.log(`\n🟡 WARNINGS (${resultado1.warnings.length}):`);
    resultado1.warnings
      .slice(0, 3)
      .forEach(warning => console.log(`   • ${warning}`));
    if (resultado1.warnings.length > 3) {
      console.log(`   ... e mais ${resultado1.warnings.length - 3} warnings`);
    }
  }

  // Teste 2: Política com problemas mas válida
  console.log('\n\n2️⃣ TESTE: Política com Problemas (mas ainda válida)');
  console.log('-'.repeat(40));
  const resultado2 = await validatePolicyDetailed(politicaComProblemas);
  resultados.push({ nome: 'Política com Problemas', resultado: resultado2 });

  console.log(`✅ Válida: ${resultado2.valid}`);
  console.log(`🏆 Maturidade: ${resultado2.maturity_level}`);
  console.log(`📊 Score: ${resultado2.score}/100`);

  if (resultado2.warnings.length > 0) {
    console.log(`\n🟡 WARNINGS (${resultado2.warnings.length}):`);
    resultado2.warnings
      .slice(0, 3)
      .forEach(warning => console.log(`   • ${warning}`));
  }

  // Teste 3: Política inválida
  console.log('\n\n3️⃣ TESTE: Política Inválida');
  console.log('-'.repeat(40));
  const resultado3 = await validatePolicyDetailed(politicaInvalida);
  resultados.push({ nome: 'Política Inválida', resultado: resultado3 });

  console.log(`❌ Válida: ${resultado3.valid}`);
  console.log(`🏆 Maturidade: ${resultado3.maturity_level}`);
  console.log(`📊 Score: ${resultado3.score}/100`);

  if (resultado3.errors.length > 0) {
    console.log(`\n🔴 ERROS CRÍTICOS (${resultado3.errors.length}):`);
    resultado3.errors.forEach(erro => console.log(`   • ${erro}`));
  }

  // Teste 4: Política padrão mínima
  console.log('\n\n4️⃣ TESTE: Política Padrão Mínima (createMinimalPolicy)');
  console.log('-'.repeat(40));
  const politicaPadraoMinima = createMinimalPolicy();
  const resultado4 = await validatePolicyDetailed(politicaPadraoMinima);
  resultados.push({ nome: 'Política Padrão Mínima', resultado: resultado4 });

  console.log(`✅ Válida: ${resultado4.valid}`);
  console.log(`🏆 Maturidade: ${resultado4.maturity_level}`);
  console.log(`📊 Score: ${resultado4.score}/100`);

  // Teste 5: Política completa
  console.log('\n\n5️⃣ TESTE: Política Completa (createCompletePolicy)');
  console.log('-'.repeat(40));
  const politicaCompleta = createCompletePolicy();
  const resultado5 = await validatePolicyDetailed(politicaCompleta);
  resultados.push({ nome: 'Política Completa', resultado: resultado5 });

  console.log(`✅ Válida: ${resultado5.valid}`);
  console.log(`🏆 Maturidade: ${resultado5.maturity_level}`);
  console.log(`📊 Score: ${resultado5.score}/100`);

  // ===================================================================
  // RESUMO COMPARATIVO
  // ===================================================================

  console.log('\n\n📊 RESUMO COMPARATIVO');
  console.log('='.repeat(80));

  console.log('\n| Política                | Válida | Maturidade    | Score |');
  console.log('|-------------------------|--------|---------------|-------|');

  resultados.forEach(({ nome, resultado }) => {
    const valida = resultado.valid ? '✅' : '❌';
    const score = `${resultado.score}/100`;
    console.log(
      `| ${nome.padEnd(23)} | ${valida.padEnd(6)} | ${resultado.maturity_level.padEnd(13)} | ${score.padEnd(5)} |`
    );
  });

  // ===================================================================
  // DEMONSTRAÇÃO DE RELATÓRIO DETALHADO
  // ===================================================================

  console.log('\n\n📋 EXEMPLO DE RELATÓRIO DETALHADO');
  console.log('='.repeat(80));
  console.log('\nRelatório para política com problemas:');
  console.log(generatePolicyValidationReport(politicaComProblemas));

  // ===================================================================
  // CONCLUSÕES
  // ===================================================================

  console.log('\n✅ CONCLUSÕES DO TESTE');
  console.log('='.repeat(80));
  console.log('✅ Validação flexível permite onboarding fácil');
  console.log('✅ Políticas mínimas são aceitas e funcionais');
  console.log('✅ Warnings ajudam a melhorar gradualmente');
  console.log('✅ Erros críticos impedem apenas falhas graves');
  console.log('✅ Sistema de score incentiva melhorias');
  console.log('✅ Relatórios detalhados ajudam auditoria');

  console.log('\n🎯 COMPARAÇÃO COM SISTEMA ANTERIOR:');
  console.log('❌ ANTES: Política mínima era rejeitada');
  console.log('✅ AGORA: Política mínima é aceita com warnings');
  console.log('❌ ANTES: Aprovadores não padrão causavam erro');
  console.log('✅ AGORA: Aprovadores não padrão geram warning');
  console.log('❌ ANTES: Campos opcionais eram obrigatórios');
  console.log('✅ AGORA: Campos opcionais geram suggestions');

  return resultados;
}

// ===================================================================
// EXEMPLOS DE POLÍTICAS PARA DIFERENTES CENÁRIOS
// ===================================================================

export function exemplosPoliticas() {
  console.log('\n\n📚 EXEMPLOS DE POLÍTICAS PARA DIFERENTES CENÁRIOS');
  console.log('='.repeat(80));

  // Exemplo 1: Startup pequena
  console.log('\n1️⃣ STARTUP PEQUENA - Política mínima para começar');
  const startupPolicy: Partial<PoliticaJson> = {
    limites_por_valor: {
      basico: {
        max_valor: 5000,
        aprovadores: ['founder'],
        sla_horas: 24,
        anexos_min: ['descricao'],
      },
    },
  };
  console.log(JSON.stringify(startupPolicy, null, 2));

  // Exemplo 2: Empresa média
  console.log('\n2️⃣ EMPRESA MÉDIA - Controle básico com SLA');
  const empresaMediaPolicy: Partial<PoliticaJson> = {
    limites_por_valor: {
      baixo: {
        max_valor: 1000,
        aprovadores: ['gerente'],
        sla_horas: 4,
        anexos_min: ['descricao'],
      },
      medio: {
        max_valor: 10000,
        aprovadores: ['diretor'],
        sla_horas: 24,
        anexos_min: ['descricao', 'cotacao'],
      },
    },
  };
  console.log(JSON.stringify(empresaMediaPolicy, null, 2));

  return {
    startup: startupPolicy,
    empresaMedia: empresaMediaPolicy,
    completa: createCompletePolicy(),
  };
}

// ===================================================================
// EXPORT PARA USO EM OUTROS MÓDULOS
// ===================================================================

export { politicaMinima, politicaComProblemas, politicaInvalida };
