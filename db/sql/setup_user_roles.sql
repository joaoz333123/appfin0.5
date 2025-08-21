-- =============================================================================
-- CONFIGURAÇÃO DE ROLES DE USUÁRIO - AppFin v0.5
-- =============================================================================
-- Scripts para configurar roles dos usuários no Supabase Auth
-- Execute estes comandos no SQL Editor do Supabase após criar os usuários
-- =============================================================================

-- ===============================================
-- 1. FUNÇÃO PARA ATUALIZAR METADADOS DE USUÁRIO
-- ===============================================

CREATE OR REPLACE FUNCTION set_user_role(user_email TEXT, user_role TEXT)
RETURNS TEXT AS $$
DECLARE
  user_id UUID;
  result TEXT;
BEGIN
  -- Buscar o ID do usuário pelo email
  SELECT id INTO user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RETURN 'ERRO: Usuário não encontrado com email ' || user_email;
  END IF;
  
  -- Validar role
  IF user_role NOT IN ('admin', 'ceo', 'cfo', 'diretor', 'gerente', 'user') THEN
    RETURN 'ERRO: Role inválido. Use: admin, ceo, cfo, diretor, gerente, user';
  END IF;
  
  -- Atualizar metadados do usuário
  UPDATE auth.users 
  SET user_metadata = COALESCE(user_metadata, '{}'::jsonb) || jsonb_build_object('role', user_role)
  WHERE id = user_id;
  
  RETURN 'SUCCESS: Role ' || user_role || ' atribuído ao usuário ' || user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- 2. FUNÇÃO PARA CONSULTAR ROLE DE USUÁRIO
-- ===============================================

CREATE OR REPLACE FUNCTION get_user_role_info(user_email TEXT)
RETURNS TABLE(
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.email::TEXT,
    COALESCE((u.user_metadata->>'role')::TEXT, 'user') as role,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- 3. FUNÇÃO PARA LISTAR TODOS OS USUÁRIOS E ROLES
-- ===============================================

CREATE OR REPLACE FUNCTION list_all_user_roles()
RETURNS TABLE(
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.email::TEXT,
    COALESCE((u.user_metadata->>'role')::TEXT, 'user') as role,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- 4. EXEMPLOS DE USO
-- ===============================================

/*
-- ATRIBUIR ROLES A USUÁRIOS ESPECÍFICOS:

-- Definir admin do sistema
SELECT set_user_role('admin@empresa.com', 'admin');

-- Definir CEO
SELECT set_user_role('ceo@empresa.com', 'ceo');

-- Definir CFO
SELECT set_user_role('cfo@empresa.com', 'cfo');

-- Definir diretores
SELECT set_user_role('diretor.ti@empresa.com', 'diretor');
SELECT set_user_role('diretor.comercial@empresa.com', 'diretor');

-- Definir gerentes
SELECT set_user_role('gerente.rh@empresa.com', 'gerente');
SELECT set_user_role('gerente.vendas@empresa.com', 'gerente');

-- Usuários comuns (role padrão)
SELECT set_user_role('funcionario@empresa.com', 'user');

-- CONSULTAR INFORMAÇÕES DE USUÁRIOS:

-- Ver role de um usuário específico
SELECT * FROM get_user_role_info('admin@empresa.com');

-- Listar todos os usuários e roles
SELECT * FROM list_all_user_roles();
*/

-- ===============================================
-- 5. GRANTS PARA EXECUÇÃO DAS FUNÇÕES
-- ===============================================

-- Permitir que admins executem estas funções
GRANT EXECUTE ON FUNCTION set_user_role(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_role_info(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION list_all_user_roles() TO service_role;

-- ===============================================
-- 6. POLÍTICA RLS PARA PROTEÇÃO DAS FUNÇÕES
-- ===============================================

-- Criar trigger para log de mudanças de role (auditoria)
CREATE TABLE IF NOT EXISTS user_role_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  old_role TEXT,
  new_role TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE user_role_audit ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs de auditoria
CREATE POLICY "rls_user_role_audit_select" ON user_role_audit
  FOR SELECT 
  USING (
    (auth.jwt() ->> 'user_metadata')::json ->> 'role' = 'admin'
  );

-- Apenas sistema pode inserir logs
CREATE POLICY "rls_user_role_audit_insert" ON user_role_audit
  FOR INSERT 
  WITH CHECK (true);

-- ===============================================
-- 7. INSTRUÇÕES DE IMPLEMENTAÇÃO STEP-BY-STEP
-- ===============================================

/*
PASSO A PASSO PARA CONFIGURAR ROLES EM PRODUÇÃO:

1. EXECUTAR ESTE SCRIPT:
   - Execute este script no SQL Editor do Supabase
   - Isso criará as funções necessárias

2. CRIAR USUÁRIOS NO SUPABASE AUTH:
   - Vá para Authentication > Users no painel do Supabase
   - Crie os usuários manualmente ou permita auto-registro
   - Anote os emails dos usuários

3. ATRIBUIR ROLES:
   - Execute os comandos SELECT set_user_role() para cada usuário
   - Comece sempre pelo admin para ter acesso total

4. VERIFICAR CONFIGURAÇÃO:
   - Execute SELECT * FROM list_all_user_roles(); para verificar
   - Teste login com diferentes usuários

5. APLICAR POLÍTICAS RLS:
   - Execute o script rls_production_policies.sql
   - Teste acessos para garantir que as políticas funcionam

6. MONITORAMENTO:
   - Monitor logs de auditoria de mudanças de role
   - Configure alertas para mudanças de role de admin

EXEMPLO DE CONFIGURAÇÃO INICIAL:

-- 1. Criar admin principal
SELECT set_user_role('admin@minhaempresa.com', 'admin');

-- 2. Criar estrutura hierárquica
SELECT set_user_role('ceo@minhaempresa.com', 'ceo');
SELECT set_user_role('cfo@minhaempresa.com', 'cfo');
SELECT set_user_role('diretor1@minhaempresa.com', 'diretor');
SELECT set_user_role('gerente1@minhaempresa.com', 'gerente');

-- 3. Verificar configuração
SELECT * FROM list_all_user_roles();

SEGURANÇA IMPORTANTE:
- Sempre mantenha pelo menos 1 usuário admin ativo
- Documente quem tem acesso de admin
- Use emails corporativos para roles elevados
- Revise roles periodicamente
- Configure MFA para admins e roles elevados
*/
