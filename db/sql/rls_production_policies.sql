-- =============================================================================
-- POLÍTICAS RLS PARA PRODUÇÃO - AppFin v0.5
-- =============================================================================
-- Este script substitui as políticas permissivas por políticas seguras para produção
--
-- SISTEMA DE ROLES:
-- - admin: Acesso total ao sistema
-- - ceo, cfo, diretor, gerente: Roles de aprovação hierárquicos
-- - usuários comuns: Apenas próprios pedidos/notificações
--
-- NOTA IMPORTANTE: 
-- - Este script assume que os usuários terão metadados de role no Supabase Auth
-- - Para implementar, configure um campo 'role' nos metadados do usuário
-- =============================================================================

-- ===============================================
-- 1. REMOVER POLÍTICAS EXISTENTES (DESENVOLVIMENTO)
-- ===============================================

-- Remover políticas da tabela politicas
DROP POLICY IF EXISTS "Políticas são visíveis para todos" ON politicas;
DROP POLICY IF EXISTS "Apenas admins podem criar políticas" ON politicas;

-- Remover políticas da tabela pedidos  
DROP POLICY IF EXISTS "Pedidos são visíveis para todos" ON pedidos;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios pedidos" ON pedidos;

-- Remover políticas da tabela aprovacoes
DROP POLICY IF EXISTS "Aprovações são visíveis para todos" ON aprovacoes;
DROP POLICY IF EXISTS "Aprovadores podem atualizar suas aprovações" ON aprovacoes;

-- Remover políticas da tabela notificacoes
DROP POLICY IF EXISTS "Usuários veem apenas suas notificações" ON notificacoes;
DROP POLICY IF EXISTS "Usuários podem marcar suas notificações como lidas" ON notificacoes;

-- ===============================================
-- 2. FUNÇÕES AUXILIARES PARA CONTROLE DE ACESSO
-- ===============================================

-- Função para obter o role do usuário atual
CREATE OR REPLACE FUNCTION get_user_role() 
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() ->> 'user_metadata')::json ->> 'role',
    'user'  -- role padrão para usuários sem role definido
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário é aprovador (qualquer nível)
CREATE OR REPLACE FUNCTION is_approver() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() IN ('gerente', 'diretor', 'cfo', 'ceo', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário pode aprovar determinado papel
CREATE OR REPLACE FUNCTION can_approve_role(target_role TEXT) 
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT := get_user_role();
BEGIN
  -- Admin pode aprovar tudo
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar hierarquia de aprovação
  CASE target_role
    WHEN 'gerente' THEN
      RETURN user_role IN ('gerente', 'diretor', 'cfo', 'ceo');
    WHEN 'diretor' THEN
      RETURN user_role IN ('diretor', 'cfo', 'ceo');
    WHEN 'cfo' THEN
      RETURN user_role IN ('cfo', 'ceo');
    WHEN 'ceo' THEN
      RETURN user_role = 'ceo';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- 3. POLÍTICAS RLS PARA TABELA POLITICAS
-- ===============================================

-- SELECT: Todos podem ler políticas
CREATE POLICY "rls_politicas_select" ON politicas
  FOR SELECT 
  USING (true);

-- INSERT: Apenas admin pode criar políticas
CREATE POLICY "rls_politicas_insert" ON politicas
  FOR INSERT 
  WITH CHECK (is_admin());

-- UPDATE: Apenas admin pode atualizar políticas
CREATE POLICY "rls_politicas_update" ON politicas
  FOR UPDATE 
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE: Apenas admin pode deletar políticas
CREATE POLICY "rls_politicas_delete" ON politicas
  FOR DELETE 
  USING (is_admin());

-- ===============================================
-- 4. POLÍTICAS RLS PARA TABELA PEDIDOS
-- ===============================================

-- SELECT: Próprios pedidos + pedidos para aprovação + admin
CREATE POLICY "rls_pedidos_select" ON pedidos
  FOR SELECT 
  USING (
    is_admin() OR
    solicitante_id = auth.email() OR
    (
      is_approver() AND 
      id IN (
        SELECT pedido_id 
        FROM aprovacoes 
        WHERE can_approve_role(papel_alvo) 
        AND decisao = 'pendente'
      )
    )
  );

-- INSERT: Apenas próprios pedidos
CREATE POLICY "rls_pedidos_insert" ON pedidos
  FOR INSERT 
  WITH CHECK (
    is_admin() OR 
    solicitante_id = auth.email()
  );

-- UPDATE: Solicitante (apenas rascunho) + aprovadores (mudança de estado) + admin
CREATE POLICY "rls_pedidos_update" ON pedidos
  FOR UPDATE 
  USING (
    is_admin() OR
    (
      solicitante_id = auth.email() AND 
      estado = 'rascunho'
    ) OR
    (
      is_approver() AND 
      id IN (
        SELECT pedido_id 
        FROM aprovacoes 
        WHERE can_approve_role(papel_alvo) 
        AND decisao = 'pendente'
      )
    )
  )
  WITH CHECK (
    is_admin() OR
    (
      solicitante_id = auth.email() AND 
      estado = 'rascunho'
    ) OR
    (
      is_approver() AND 
      id IN (
        SELECT pedido_id 
        FROM aprovacoes 
        WHERE can_approve_role(papel_alvo) 
        AND decisao = 'pendente'
      )
    )
  );

-- DELETE: Apenas solicitante (rascunho) + admin
CREATE POLICY "rls_pedidos_delete" ON pedidos
  FOR DELETE 
  USING (
    is_admin() OR
    (
      solicitante_id = auth.email() AND 
      estado = 'rascunho'
    )
  );

-- ===============================================
-- 5. POLÍTICAS RLS PARA TABELA APROVACOES
-- ===============================================

-- SELECT: Aprovações relacionadas aos próprios pedidos/aprovações + admin
CREATE POLICY "rls_aprovacoes_select" ON aprovacoes
  FOR SELECT 
  USING (
    is_admin() OR
    pedido_id IN (
      SELECT id 
      FROM pedidos 
      WHERE solicitante_id = auth.email()
    ) OR
    (
      can_approve_role(papel_alvo) AND
      aprovador_id = auth.email()
    ) OR
    (
      can_approve_role(papel_alvo) AND
      aprovador_id IS NULL AND
      decisao = 'pendente'
    )
  );

-- INSERT: Sistema/admin cria aprovações automaticamente
CREATE POLICY "rls_aprovacoes_insert" ON aprovacoes
  FOR INSERT 
  WITH CHECK (is_admin());

-- UPDATE: Apenas o aprovador designado + admin
CREATE POLICY "rls_aprovacoes_update" ON aprovacoes
  FOR UPDATE 
  USING (
    is_admin() OR
    (
      can_approve_role(papel_alvo) AND
      (
        aprovador_id = auth.email() OR
        (aprovador_id IS NULL AND decisao = 'pendente')
      )
    )
  )
  WITH CHECK (
    is_admin() OR
    (
      can_approve_role(papel_alvo) AND
      (
        aprovador_id = auth.email() OR
        (aprovador_id IS NULL AND decisao = 'pendente')
      )
    )
  );

-- DELETE: Apenas admin
CREATE POLICY "rls_aprovacoes_delete" ON aprovacoes
  FOR DELETE 
  USING (is_admin());

-- ===============================================
-- 6. POLÍTICAS RLS PARA TABELA NOTIFICACOES
-- ===============================================

-- SELECT: Apenas próprias notificações + admin
CREATE POLICY "rls_notificacoes_select" ON notificacoes
  FOR SELECT 
  USING (
    is_admin() OR
    user_id = auth.email()
  );

-- INSERT: Sistema/admin cria notificações
CREATE POLICY "rls_notificacoes_insert" ON notificacoes
  FOR INSERT 
  WITH CHECK (is_admin());

-- UPDATE: Apenas próprias notificações (marcar como lida) + admin
CREATE POLICY "rls_notificacoes_update" ON notificacoes
  FOR UPDATE 
  USING (
    is_admin() OR
    user_id = auth.email()
  )
  WITH CHECK (
    is_admin() OR
    (
      user_id = auth.email() AND
      -- Permitir apenas atualizar o campo 'lida'
      OLD.user_id = NEW.user_id AND
      OLD.tipo = NEW.tipo AND
      OLD.payload_json = NEW.payload_json AND
      OLD.criada_em = NEW.criada_em
    )
  );

-- DELETE: Apenas admin
CREATE POLICY "rls_notificacoes_delete" ON notificacoes
  FOR DELETE 
  USING (is_admin());

-- ===============================================
-- 7. POLÍTICAS RLS PARA OUTRAS TABELAS RELACIONADAS
-- ===============================================

-- ANEXOS: Seguem a mesma lógica dos pedidos
CREATE POLICY "rls_anexos_select" ON anexos
  FOR SELECT 
  USING (
    is_admin() OR
    pedido_id IN (
      SELECT id 
      FROM pedidos 
      WHERE solicitante_id = auth.email()
    ) OR
    (
      is_approver() AND 
      pedido_id IN (
        SELECT pedido_id 
        FROM aprovacoes 
        WHERE can_approve_role(papel_alvo) 
        AND decisao = 'pendente'
      )
    )
  );

CREATE POLICY "rls_anexos_insert" ON anexos
  FOR INSERT 
  WITH CHECK (
    is_admin() OR
    pedido_id IN (
      SELECT id 
      FROM pedidos 
      WHERE solicitante_id = auth.email()
      AND estado = 'rascunho'
    )
  );

CREATE POLICY "rls_anexos_delete" ON anexos
  FOR DELETE 
  USING (
    is_admin() OR
    pedido_id IN (
      SELECT id 
      FROM pedidos 
      WHERE solicitante_id = auth.email()
      AND estado = 'rascunho'
    )
  );

-- HISTÓRICO: Apenas leitura para próprios pedidos + admin
CREATE POLICY "rls_historico_select" ON historico
  FOR SELECT 
  USING (
    is_admin() OR
    (
      entidade = 'pedido' AND
      entidade_id::UUID IN (
        SELECT id 
        FROM pedidos 
        WHERE solicitante_id = auth.email()
      )
    ) OR
    (
      is_approver() AND
      entidade = 'pedido' AND
      entidade_id::UUID IN (
        SELECT pedido_id 
        FROM aprovacoes 
        WHERE can_approve_role(papel_alvo)
      )
    )
  );

CREATE POLICY "rls_historico_insert" ON historico
  FOR INSERT 
  WITH CHECK (is_admin());

-- ORCAMENTOS: Leitura para aprovadores + admin
CREATE POLICY "rls_orcamentos_select" ON orcamentos
  FOR SELECT 
  USING (
    is_admin() OR
    is_approver()
  );

CREATE POLICY "rls_orcamentos_insert" ON orcamentos
  FOR INSERT 
  WITH CHECK (is_admin());

CREATE POLICY "rls_orcamentos_update" ON orcamentos
  FOR UPDATE 
  USING (is_admin())
  WITH CHECK (is_admin());

-- DASHBOARDS: Próprios dashboards + admin
CREATE POLICY "rls_dashboards_select" ON dashboards
  FOR SELECT 
  USING (
    is_admin() OR
    owner_id = auth.email()
  );

CREATE POLICY "rls_dashboards_insert" ON dashboards
  FOR INSERT 
  WITH CHECK (
    is_admin() OR
    owner_id = auth.email()
  );

CREATE POLICY "rls_dashboards_update" ON dashboards
  FOR UPDATE 
  USING (
    is_admin() OR
    owner_id = auth.email()
  )
  WITH CHECK (
    is_admin() OR
    owner_id = auth.email()
  );

CREATE POLICY "rls_dashboards_delete" ON dashboards
  FOR DELETE 
  USING (
    is_admin() OR
    owner_id = auth.email()
  );

-- ===============================================
-- 8. ÍNDICES ADICIONAIS PARA PERFORMANCE DAS POLÍTICAS RLS
-- ===============================================

-- Índices para otimizar as consultas das políticas RLS
CREATE INDEX IF NOT EXISTS idx_pedidos_solicitante_estado ON pedidos(solicitante_id, estado);
CREATE INDEX IF NOT EXISTS idx_aprovacoes_papel_decisao ON aprovacoes(papel_alvo, decisao);
CREATE INDEX IF NOT EXISTS idx_aprovacoes_aprovador_decisao ON aprovacoes(aprovador_id, decisao);
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_lida ON notificacoes(user_id, lida);
CREATE INDEX IF NOT EXISTS idx_anexos_pedido_id ON anexos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_historico_entidade_id ON historico(entidade, entidade_id);

-- ===============================================
-- 9. GRANTS E PERMISSÕES
-- ===============================================

-- Garantir que as funções podem ser executadas por usuários autenticados
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_approver() TO authenticated;
GRANT EXECUTE ON FUNCTION can_approve_role(TEXT) TO authenticated;

-- ===============================================
-- 10. COMENTÁRIOS E DOCUMENTAÇÃO
-- ===============================================

COMMENT ON FUNCTION get_user_role() IS 'Retorna o role do usuário atual baseado nos metadados JWT';
COMMENT ON FUNCTION is_admin() IS 'Verifica se o usuário atual é admin';
COMMENT ON FUNCTION is_approver() IS 'Verifica se o usuário atual pode aprovar pedidos';
COMMENT ON FUNCTION can_approve_role(TEXT) IS 'Verifica se o usuário atual pode aprovar um papel específico';

-- ===============================================
-- INSTRUÇÕES DE IMPLEMENTAÇÃO
-- ===============================================

/*
PARA IMPLEMENTAR ESTAS POLÍTICAS EM PRODUÇÃO:

1. CONFIGURAR ROLES DOS USUÁRIOS:
   - No Supabase Auth, configure o campo 'role' nos metadados do usuário
   - Exemplo: { "role": "gerente" }

2. EXECUTAR ESTE SCRIPT:
   - Execute este script no SQL Editor do Supabase
   - Teste com usuários de diferentes roles

3. VERIFICAR FUNCIONALIDADE:
   - Teste login com usuários de diferentes roles
   - Verifique se podem ver apenas dados permitidos
   - Teste operações de CREATE, UPDATE, DELETE

4. MONITORAMENTO:
   - Configure logs para monitorar tentativas de acesso negado
   - Monitore performance das consultas com RLS

SEGURANÇA ADICIONAL:
- Configure rate limiting no nível da aplicação
- Implemente auditoria de todas as operações sensíveis
- Use HTTPS always e configure CORS adequadamente
- Considere IP whitelisting para admins
*/
