-- =============================================================================
-- MIGRAÇÃO DE DESENVOLVIMENTO PARA PRODUÇÃO - AppFin v0.5
-- =============================================================================
-- Script para migrar políticas RLS de desenvolvimento para produção
-- Execute este script em ambiente de staging antes de produção
-- =============================================================================

-- ===============================================
-- 1. PRÉ-REQUISITOS E VALIDAÇÕES
-- ===============================================

-- Verificar se estamos no ambiente correto
DO $$
DECLARE
  env_check TEXT;
BEGIN
  -- Verificar se temos dados de produção (não deve ter pedidos de teste)
  SELECT COUNT(*) INTO env_check FROM pedidos WHERE titulo LIKE 'TESTE_%';
  
  IF env_check > 0 THEN
    RAISE NOTICE 'ATENÇÃO: Encontrados % pedidos de teste. Limpe antes de continuar.', env_check;
  END IF;
  
  -- Verificar se RLS está habilitado
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'pedidos' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS não está habilitado na tabela pedidos';
  END IF;
  
  RAISE NOTICE 'Pré-requisitos validados. Prosseguindo com migração...';
END $$;

-- ===============================================
-- 2. BACKUP DAS POLÍTICAS ATUAIS
-- ===============================================

-- Criar tabela para backup das políticas atuais
CREATE TABLE IF NOT EXISTS backup_policies_dev (
  id SERIAL PRIMARY KEY,
  backup_date TIMESTAMPTZ DEFAULT NOW(),
  schemaname TEXT,
  tablename TEXT,
  policyname TEXT,
  permissive TEXT,
  roles TEXT[],
  cmd TEXT,
  qual TEXT,
  with_check TEXT
);

-- Fazer backup das políticas existentes
INSERT INTO backup_policies_dev (schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive::TEXT,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public';

RAISE NOTICE 'Backup das políticas atuais salvo em backup_policies_dev';

-- ===============================================
-- 3. IDENTIFICAR USUÁRIOS EXISTENTES
-- ===============================================

-- Criar tabela temporária para mapear usuários para roles
CREATE TEMP TABLE user_role_mapping AS
SELECT 
  email,
  created_at,
  CASE 
    WHEN email ILIKE '%admin%' THEN 'admin'
    WHEN email ILIKE '%ceo%' THEN 'ceo'
    WHEN email ILIKE '%cfo%' THEN 'cfo'
    WHEN email ILIKE '%diretor%' THEN 'diretor'
    WHEN email ILIKE '%gerente%' THEN 'gerente'
    ELSE 'user'
  END as suggested_role
FROM auth.users
ORDER BY created_at;

-- Mostrar mapeamento sugerido
SELECT 
  'USUÁRIOS IDENTIFICADOS:' as info,
  NULL::TEXT as email,
  NULL::TEXT as suggested_role,
  NULL::TIMESTAMPTZ as created_at
UNION ALL
SELECT 
  ' - ' as info,
  email,
  suggested_role,
  created_at
FROM user_role_mapping
ORDER BY created_at;

-- ===============================================
-- 4. EXECUTAR MIGRAÇÃO DAS POLÍTICAS
-- ===============================================

-- Executar setup de roles (se ainda não foi executado)
\i setup_user_roles.sql

-- Executar políticas de produção
\i rls_production_policies.sql

-- ===============================================
-- 5. CONFIGURAR ROLES DOS USUÁRIOS EXISTENTES
-- ===============================================

-- Aplicar roles sugeridos automaticamente para casos óbvios
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT email, suggested_role 
    FROM user_role_mapping 
    WHERE suggested_role != 'user'
  LOOP
    PERFORM set_user_role(user_record.email, user_record.suggested_role);
    RAISE NOTICE 'Role % aplicado para %', user_record.suggested_role, user_record.email;
  END LOOP;
END $$;

-- Configurar usuários comuns
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT email 
    FROM user_role_mapping 
    WHERE suggested_role = 'user'
  LOOP
    PERFORM set_user_role(user_record.email, 'user');
    RAISE NOTICE 'Role user aplicado para %', user_record.email;
  END LOOP;
END $$;

-- ===============================================
-- 6. VALIDAÇÃO PÓS-MIGRAÇÃO
-- ===============================================

-- Verificar se todas as políticas foram criadas
SELECT 
  'POLÍTICAS CRIADAS:' as status,
  COUNT(*) as total
FROM pg_policies 
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'Por tabela:',
  NULL::BIGINT
UNION ALL
SELECT 
  '  ' || tablename,
  COUNT(*)
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Verificar se funções foram criadas
SELECT 
  'FUNÇÕES CRIADAS:' as status,
  routine_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_role', 'is_admin', 'is_approver', 'can_approve_role', 'set_user_role');

-- Verificar configuração de roles
SELECT 
  'ROLES CONFIGURADOS:' as status,
  role,
  COUNT(*) as usuarios
FROM (
  SELECT 
    COALESCE((user_metadata->>'role'), 'user') as role
  FROM auth.users
) roles_count
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'ceo' THEN 2
    WHEN 'cfo' THEN 3
    WHEN 'diretor' THEN 4
    WHEN 'gerente' THEN 5
    WHEN 'user' THEN 6
    ELSE 7
  END;

-- ===============================================
-- 7. TESTES BÁSICOS DE FUNCIONALIDADE
-- ===============================================

-- Testar funções básicas
SELECT 
  'TESTE DE FUNÇÕES:' as teste,
  NULL::TEXT as resultado
UNION ALL
SELECT 
  '  get_user_role()' as teste,
  CASE 
    WHEN get_user_role() IS NOT NULL THEN 'OK'
    ELSE 'ERRO'
  END as resultado
UNION ALL
SELECT 
  '  is_admin()' as teste,
  CASE 
    WHEN is_admin() IS NOT NULL THEN 'OK'
    ELSE 'ERRO'
  END as resultado
UNION ALL
SELECT 
  '  is_approver()' as teste,
  CASE 
    WHEN is_approver() IS NOT NULL THEN 'OK'
    ELSE 'ERRO'
  END as resultado;

-- Testar contagem de dados visíveis (deve funcionar para admin)
SELECT 
  'TESTE DE VISIBILIDADE:' as tabela,
  NULL::BIGINT as registros_visiveis
UNION ALL
SELECT 
  '  pedidos',
  COUNT(*)
FROM pedidos
UNION ALL
SELECT 
  '  aprovacoes',
  COUNT(*)
FROM aprovacoes
UNION ALL
SELECT 
  '  politicas',
  COUNT(*)
FROM politicas
UNION ALL
SELECT 
  '  notificacoes',
  COUNT(*)
FROM notificacoes;

-- ===============================================
-- 8. INSTRUÇÕES PARA FINALIZAÇÃO MANUAL
-- ===============================================

SELECT 'PRÓXIMOS PASSOS:' as instrucao
UNION ALL
SELECT '1. Revisar mapeamento de roles em user_role_mapping'
UNION ALL
SELECT '2. Ajustar roles manualmente se necessário com set_user_role()'
UNION ALL
SELECT '3. Executar testes completos com test_rls_policies.sql'
UNION ALL
SELECT '4. Testar login com diferentes usuários'
UNION ALL
SELECT '5. Monitorar logs por 24h após deploy'
UNION ALL
SELECT '6. Configurar alertas para erros de RLS'
UNION ALL
SELECT ''
UNION ALL
SELECT 'ROLLBACK EM EMERGÊNCIA:'
UNION ALL
SELECT '1. ALTER TABLE <tabela> DISABLE ROW LEVEL SECURITY;'
UNION ALL
SELECT '2. Restaurar políticas de backup_policies_dev'
UNION ALL
SELECT '3. Investigar e corrigir problema'
UNION ALL
SELECT '4. Reabilitar RLS após correção';

-- ===============================================
-- 9. SCRIPT DE VERIFICAÇÃO FINAL
-- ===============================================

CREATE OR REPLACE FUNCTION migration_health_check()
RETURNS TABLE(
  categoria TEXT,
  item TEXT,
  status TEXT,
  detalhes TEXT
) AS $$
BEGIN
  RETURN QUERY
  
  -- Verificar RLS ativo
  SELECT 
    'RLS Status'::TEXT,
    tablename,
    CASE WHEN rowsecurity THEN 'ATIVO' ELSE 'INATIVO' END,
    'Row Level Security'
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename IN ('pedidos', 'aprovacoes', 'politicas', 'notificacoes')
  
  UNION ALL
  
  -- Verificar políticas
  SELECT 
    'Políticas'::TEXT,
    tablename,
    COUNT(*)::TEXT,
    'Total de políticas'
  FROM pg_policies 
  WHERE schemaname = 'public'
  GROUP BY tablename
  
  UNION ALL
  
  -- Verificar funções
  SELECT 
    'Funções'::TEXT,
    routine_name,
    'DISPONÍVEL',
    routine_type
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_name LIKE '%user_role%'
  
  UNION ALL
  
  -- Verificar usuários sem role
  SELECT 
    'Usuários'::TEXT,
    'Sem role definido',
    COUNT(*)::TEXT,
    'Usuários que precisam de role'
  FROM auth.users 
  WHERE user_metadata->>'role' IS NULL
  
  ORDER BY categoria, item;
END;
$$ LANGUAGE plpgsql;

-- Executar verificação final
SELECT * FROM migration_health_check();

-- ===============================================
-- 10. LOG DA MIGRAÇÃO
-- ===============================================

-- Criar log da migração
INSERT INTO backup_policies_dev (schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check)
VALUES ('migration_log', 'migration_completed', NOW()::TEXT, 'SUCCESS', NULL, 'MIGRATION', 'Migração concluída', 'Políticas RLS de produção aplicadas');

RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA! Execute migration_health_check() para verificar status final.';
RAISE NOTICE 'Próximo passo: Executar testes com test_rls_policies.sql';
RAISE NOTICE 'Lembre-se de configurar monitoramento e alertas em produção.';

-- Limpar tabela temporária
DROP TABLE user_role_mapping;
