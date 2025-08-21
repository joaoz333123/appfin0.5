// Testes para validação de políticas
import {
    PoliticaJson,
    validatePolicyStrict,
    validatePolicyWithOPA,
} from './policy';

// Política válida de exemplo
const politicaValida: PoliticaJson = {
  limites_por_valor: {
    ate_1000: {
      max_valor: 1000,
      aprovadores: ['gerente'],
      sla_horas: 4,
      anexos_min: ['descricao'],
    },
    '1000_5000': {
      max_valor: 5000,
      aprovadores: ['gerente', 'diretor'],
      sla_horas: 8,
      anexos_min: ['descricao', 'cotacao'],
    },
    '5000_25000': {
      max_valor: 25000,
      aprovadores: ['diretor', 'cfo'],
      sla_horas: 24,
      anexos_min: ['descricao', 'cotacao', 'justificativa'],
    },
    acima_25000: {
      max_valor: 999999,
      aprovadores: ['cfo', 'ceo'],
      sla_horas: 48,
      anexos_min: ['descricao', 'cotacao', 'justificativa', 'proposta_tecnica'],
    },
  },
  categorias: {
    OPEX: {
      extra: false,
    },
    CAPEX: {
      extra: true,
      aprovadores_adicionais: ['cfo'],
    },
  },
  sla_horas_por_etapa: {
    gerente: 4,
    diretor: 8,
    cfo: 24,
    ceo: 48,
  },
  anexos_min_por_faixa: {
    ate_1000: ['descricao'],
    '1000_5000': ['descricao', 'cotacao'],
    '5000_25000': ['descricao', 'cotacao', 'justificativa'],
    acima_25000: ['descricao', 'cotacao', 'justificativa', 'proposta_tecnica'],
  },
  escalonamento: {
    gerente: 'diretor',
    diretor: 'cfo',
    cfo: 'ceo',
  },
};

// Política inválida - sem aprovadores
const politicaInvalida: PoliticaJson = {
  limites_por_valor: {
    ate_1000: {
      max_valor: 1000,
      aprovadores: [], // ❌ Array vazio
      sla_horas: 4,
      anexos_min: ['descricao'],
    },
  },
  categorias: {
    OPEX: {
      extra: false,
    },
  },
  sla_horas_por_etapa: {
    gerente: 4,
  },
  anexos_min_por_faixa: {
    ate_1000: ['descricao'],
  },
  escalonamento: {
    gerente: 'diretor',
  },
};

// Política com warnings
const politicaComWarnings: PoliticaJson = {
  limites_por_valor: {
    ate_1000000: {
      max_valor: 2000000, // ❌ Valor muito alto
      aprovadores: ['gerente'],
      sla_horas: 100, // ❌ SLA muito longo
      anexos_min: ['descricao'],
    },
  },
  categorias: {
    CAPEX: {
      extra: false, // ❌ CAPEX sem aprovadores_adicionais
    },
  },
  sla_horas_por_etapa: {
    gerente: 4,
  },
  anexos_min_por_faixa: {
    ate_1000000: ['descricao'],
  },
  escalonamento: {
    gerente: 'diretor',
  },
};

// Função de teste
async function testarValidacao() {
  console.log('🧪 TESTANDO VALIDAÇÃO DE POLÍTICAS\n');

  // Teste 1: Política válida
  console.log('1️⃣ Testando política válida...');
  const resultado1 = await validatePolicyWithOPA(politicaValida);
  console.log(`✅ Válida: ${resultado1.valid}`);
  console.log(`⏱️ Tempo: ${resultado1.validation_time_ms}ms`);
  if (resultado1.errors.length > 0) {
    console.log(`❌ Erros: ${resultado1.errors.join(', ')}`);
  }
  if (resultado1.warnings.length > 0) {
    console.log(`⚠️ Warnings: ${resultado1.warnings.join(', ')}`);
  }
  console.log('');

  // Teste 2: Política inválida
  console.log('2️⃣ Testando política inválida...');
  const resultado2 = await validatePolicyWithOPA(politicaInvalida);
  console.log(`✅ Válida: ${resultado2.valid}`);
  console.log(`⏱️ Tempo: ${resultado2.validation_time_ms}ms`);
  if (resultado2.errors.length > 0) {
    console.log(`❌ Erros: ${resultado2.errors.join(', ')}`);
  }
  console.log('');

  // Teste 3: Política com warnings
  console.log('3️⃣ Testando política com warnings...');
  const resultado3 = await validatePolicyWithOPA(politicaComWarnings);
  console.log(`✅ Válida: ${resultado3.valid}`);
  console.log(`⏱️ Tempo: ${resultado3.validation_time_ms}ms`);
  if (resultado3.warnings.length > 0) {
    console.log(`⚠️ Warnings: ${resultado3.warnings.join(', ')}`);
  }
  console.log('');

  // Teste 4: Modo strict
  console.log('4️⃣ Testando modo strict...');
  const resultado4 = await validatePolicyStrict(politicaComWarnings);
  console.log(`✅ Válida: ${resultado4.valid}`);
  console.log(`⏱️ Tempo: ${resultado4.validation_time_ms}ms`);
  if (resultado4.errors.length > 0) {
    console.log(`❌ Erros: ${resultado4.errors.join(', ')}`);
  }
  console.log('');

  // Resumo
  console.log('📊 RESUMO DOS TESTES:');
  console.log(`✅ Política válida: ${resultado1.valid ? 'PASSOU' : 'FALHOU'}`);
  console.log(
    `❌ Política inválida: ${!resultado2.valid ? 'PASSOU' : 'FALHOU'}`
  );
  console.log(
    `⚠️ Política com warnings: ${resultado3.valid ? 'PASSOU' : 'FALHOU'}`
  );
  console.log(`🔒 Modo strict: ${!resultado4.valid ? 'PASSOU' : 'FALHOU'}`);
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  testarValidacao().catch(console.error);
}

export {
    politicaComWarnings, politicaInvalida, politicaValida, testarValidacao
};

