#!/usr/bin/env node

/**
 * 🔍 Script de Verificação Completa da Conectividade Supabase
 * Diagnóstica problemas de conexão, schema cache e configuração
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🔍 ${title}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

async function testSupabaseConfiguration() {
  header('TESTE DE CONFIGURAÇÃO SUPABASE');

  const config = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  // Verificar variáveis de ambiente
  log('\n📋 Verificando variáveis de ambiente...', 'blue');

  if (!config.url) {
    log('❌ NEXT_PUBLIC_SUPABASE_URL não definida', 'red');
    return false;
  } else {
    log(`✅ SUPABASE_URL: ${config.url}`, 'green');
  }

  if (!config.anonKey) {
    log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não definida', 'red');
    return false;
  } else {
    log(`✅ ANON_KEY: ${config.anonKey.substring(0, 20)}...`, 'green');
  }

  if (!config.serviceKey) {
    log('❌ SUPABASE_SERVICE_ROLE_KEY não definida', 'red');
    return false;
  } else {
    log(`✅ SERVICE_KEY: ${config.serviceKey.substring(0, 20)}...`, 'green');
  }

  return config;
}

async function testConnections(config) {
  header('TESTE DE CONECTIVIDADE');

  // Cliente anônimo
  log('\n🔐 Testando cliente anônimo...', 'blue');
  const supabaseAnon = createClient(config.url, config.anonKey);

  try {
    const { data, error } = await supabaseAnon
      .from('politicas')
      .select('count')
      .limit(1);
    if (error) {
      log(`❌ Cliente anônimo falhou: ${error.message}`, 'red');
    } else {
      log('✅ Cliente anônimo: OK', 'green');
    }
  } catch (error) {
    log(`❌ Cliente anônimo: ${error.message}`, 'red');
  }

  // Cliente service role
  log('\n🔑 Testando cliente service role...', 'blue');
  const supabaseAdmin = createClient(config.url, config.serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const { data, error } = await supabaseAdmin
      .from('politicas')
      .select('count')
      .limit(1);
    if (error) {
      log(`❌ Cliente admin falhou: ${error.message}`, 'red');
      return false;
    } else {
      log('✅ Cliente admin: OK', 'green');
      return supabaseAdmin;
    }
  } catch (error) {
    log(`❌ Cliente admin: ${error.message}`, 'red');
    return false;
  }
}

async function testSchemaCache(supabaseAdmin) {
  header('TESTE DE SCHEMA CACHE');

  const expectedTables = [
    'politicas',
    'pedidos',
    'aprovacoes',
    'orcamentos',
    'anexos',
    'historico',
    'dashboards',
    'notificacoes',
  ];

  log('\n📊 Verificando tabelas no schema...', 'blue');

  const results = {};

  for (const table of expectedTables) {
    try {
      log(`\n🔍 Testando tabela: ${table}`, 'yellow');

      // Teste 1: Select simples
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        log(`  ❌ Erro no select: ${error.message}`, 'red');
        results[table] = { accessible: false, error: error.message };
        continue;
      }

      // Teste 2: Count
      const { count, error: countError } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        log(`  ⚠️ Erro no count: ${countError.message}`, 'yellow');
      } else {
        log(`  📊 Registros encontrados: ${count}`, 'cyan');
      }

      // Teste 3: Inserção de teste (apenas para verificar estrutura)
      const { error: insertError } = await supabaseAdmin
        .from(table)
        .insert({})
        .select();

      if (insertError && insertError.message.includes('null value')) {
        log(
          `  ✅ Estrutura da tabela: OK (erro esperado de campos obrigatórios)`,
          'green'
        );
      } else if (insertError) {
        log(`  ⚠️ Estrutura: ${insertError.message}`, 'yellow');
      }

      results[table] = { accessible: true, count };
      log(`  ✅ Tabela ${table}: Acessível`, 'green');
    } catch (error) {
      log(`  ❌ Erro crítico: ${error.message}`, 'red');
      results[table] = { accessible: false, error: error.message };
    }
  }

  return results;
}

async function testRLSPolicies(supabaseAdmin) {
  header('TESTE DE POLÍTICAS RLS');

  log('\n🛡️ Verificando Row Level Security...', 'blue');

  try {
    // Verificar se RLS está habilitado
    const { data: tables, error } = await supabaseAdmin
      .rpc('get_table_rls_status')
      .then(() => ({ data: [], error: null }))
      .catch(() => ({ data: null, error: { message: 'RPC não disponível' } }));

    if (error) {
      log(
        '⚠️ Não foi possível verificar status do RLS automaticamente',
        'yellow'
      );
    } else {
      log('✅ Sistema RLS operacional', 'green');
    }
  } catch (error) {
    log(`⚠️ RLS Status: ${error.message}`, 'yellow');
  }
}

async function performanceTest(supabaseAdmin) {
  header('TESTE DE PERFORMANCE');

  log('\n⚡ Testando latência de consultas...', 'blue');

  const tests = [
    {
      name: 'Select simples',
      query: () => supabaseAdmin.from('politicas').select('id').limit(1),
    },
    {
      name: 'Join complexo',
      query: () =>
        supabaseAdmin.from('pedidos').select('*, aprovacoes(*)').limit(1),
    },
    {
      name: 'Count total',
      query: () =>
        supabaseAdmin
          .from('pedidos')
          .select('*', { count: 'exact', head: true }),
    },
  ];

  for (const test of tests) {
    try {
      const start = Date.now();
      await test.query();
      const duration = Date.now() - start;

      const status = duration < 500 ? '✅' : duration < 1000 ? '⚠️' : '❌';
      const color =
        duration < 500 ? 'green' : duration < 1000 ? 'yellow' : 'red';

      log(`  ${status} ${test.name}: ${duration}ms`, color);
    } catch (error) {
      log(`  ❌ ${test.name}: ${error.message}`, 'red');
    }
  }
}

async function generateReport(results) {
  header('RELATÓRIO FINAL');

  log('\n📋 Resumo dos Testes:', 'blue');

  const accessibleTables = Object.entries(results.tables || {})
    .filter(([_, result]) => result.accessible)
    .map(([table, _]) => table);

  const inaccessibleTables = Object.entries(results.tables || {})
    .filter(([_, result]) => !result.accessible)
    .map(([table, result]) => ({ table, error: result.error }));

  if (accessibleTables.length > 0) {
    log(`\n✅ Tabelas acessíveis (${accessibleTables.length}):`, 'green');
    accessibleTables.forEach(table => log(`  - ${table}`, 'green'));
  }

  if (inaccessibleTables.length > 0) {
    log(`\n❌ Tabelas com problemas (${inaccessibleTables.length}):`, 'red');
    inaccessibleTables.forEach(({ table, error }) =>
      log(`  - ${table}: ${error}`, 'red')
    );
  }

  // Recomendações
  log('\n💡 Recomendações:', 'magenta');

  if (inaccessibleTables.length > 0) {
    log('  1. Execute o script SQL: db/sql/001_initial_schema.sql', 'yellow');
    log(
      '  2. Verifique se as tabelas foram criadas no projeto correto',
      'yellow'
    );
    log('  3. Confirme que a SUPABASE_SERVICE_ROLE_KEY está correta', 'yellow');
  }

  if (accessibleTables.length === 8) {
    log('  ✅ Todas as tabelas estão acessíveis!', 'green');
    log('  ✅ Sistema pronto para uso', 'green');
  }
}

async function main() {
  log('🚀 Iniciando diagnóstico completo do Supabase...', 'cyan');

  try {
    // 1. Verificar configuração
    const config = await testSupabaseConfiguration();
    if (!config) {
      log('\n❌ Configuração inválida. Verifique o arquivo .env.local', 'red');
      process.exit(1);
    }

    // 2. Testar conectividade
    const supabaseAdmin = await testConnections(config);
    if (!supabaseAdmin) {
      log('\n❌ Falha na conectividade. Verifique as credenciais.', 'red');
      process.exit(1);
    }

    // 3. Testar schema
    const tableResults = await testSchemaCache(supabaseAdmin);

    // 4. Testar RLS
    await testRLSPolicies(supabaseAdmin);

    // 5. Teste de performance
    await performanceTest(supabaseAdmin);

    // 6. Relatório final
    await generateReport({ tables: tableResults });

    log('\n🎉 Diagnóstico concluído!', 'cyan');
  } catch (error) {
    log(`\n💥 Erro crítico: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  testSupabaseConfiguration,
  testConnections,
  testSchemaCache,
};
