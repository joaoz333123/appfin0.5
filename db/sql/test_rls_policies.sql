-- =============================================================================
-- TESTES DAS POLÍTICAS RLS - AppFin v0.5
-- =============================================================================
-- Scripts para testar se as políticas RLS estão funcionando corretamente
-- Execute estes testes após implementar as políticas de produção
-- =============================================================================

-- ===============================================
-- 1. SETUP DE DADOS DE TESTE
-- ===============================================

-- Inserir dados de teste (como admin)
-- OBS: Execute estes comandos logado como usuário admin

-- Limpar dados de teste anteriores
DELETE FROM aprovacoes WHERE pedido_id IN (
  SELECT id FROM pedidos WHERE titulo LIKE 'TESTE_%'
);
DELETE FROM pedidos WHERE titulo LIKE 'TESTE_%';

-- Inserir pedidos de teste
INSERT INTO pedidos (id, titulo, categoria, cc, valor, estado, solicitante_id, politica_versao) VALUES
  ('11111111-1111-1111-1111-111111111111', 'TESTE_Pedido_Usuario_A', 'OPEX', 'TI', 500.00, 'rascunho', 'userA@empresa.com', 'v1'),
  ('22222222-2222-2222-2222-222222222222', 'TESTE_Pedido_Usuario_B', 'CAPEX', 'ADM', 1500.00, 'em_aprovacao', 'userB@empresa.com', 'v1'),
  ('33333333-3333-3333-3333-333333333333', 'TESTE_Pedido_Gerente', 'OPEX', 'RH', 3000.00, 'aprovado', 'gerente@empresa.com', 'v1');

-- Inserir aprovações de teste
INSERT INTO aprovacoes (pedido_id, etapa_idx, papel_alvo, aprovador_id, decisao) VALUES
  ('22222222-2222-2222-2222-222222222222', 1, 'gerente', NULL, 'pendente'),
  ('33333333-3333-3333-3333-333333333333', 1, 'gerente', 'gerente@empresa.com', 'aprovado');

-- Inserir notificações de teste
INSERT INTO notificacoes (user_id, tipo, payload_json) VALUES
  ('userA@empresa.com', 'lembrete', '{"pedido_id": "11111111-1111-1111-1111-111111111111", "msg": "Anexar documentos"}'),
  ('userB@empresa.com', 'aprovacao', '{"pedido_id": "22222222-2222-2222-2222-222222222222", "msg": "Pedido em aprovação"}'),
  ('gerente@empresa.com', 'escala', '{"pedido_id": "22222222-2222-2222-2222-222222222222", "msg": "SLA expirando"}');

-- ===============================================
-- 2. FUNÇÃO PARA SIMULAR LOGIN DE USUÁRIO
-- ===============================================

CREATE OR REPLACE FUNCTION test_as_user(user_email TEXT, user_role TEXT DEFAULT 'user')
RETURNS TEXT AS $$
BEGIN
  -- Esta função simula o contexto de um usuário específico
  -- Em um teste real, você faria login com cada usuário
  RETURN 'Simulando contexto do usuário: ' || user_email || ' (role: ' || user_role || ')';
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 3. TESTES DE POLÍTICAS PARA TABELA PEDIDOS
-- ===============================================

-- TESTE 1: Usuário comum vê apenas próprios pedidos
/*
Para testar: faça login como userA@empresa.com e execute:
*/
SELECT 'TESTE 1: Pedidos visíveis para userA@empresa.com' as teste;
-- Resultado esperado: Apenas pedido '11111111-1111-1111-1111-111111111111'
-- SELECT * FROM pedidos;

-- TESTE 2: Gerente vê próprios pedidos + pedidos para aprovação
/*
Para testar: faça login como gerente@empresa.com e execute:
*/
SELECT 'TESTE 2: Pedidos visíveis para gerente@empresa.com' as teste;
-- Resultado esperado: Pedidos onde ele é solicitante + pedidos com aprovação pendente para gerente
-- SELECT * FROM pedidos;

-- TESTE 3: Admin vê todos os pedidos
/*
Para testar: faça login como admin@empresa.com e execute:
*/
SELECT 'TESTE 3: Pedidos visíveis para admin@empresa.com' as teste;
-- Resultado esperado: Todos os pedidos
-- SELECT * FROM pedidos;

-- ===============================================
-- 4. TESTES DE POLÍTICAS PARA TABELA APROVACOES
-- ===============================================

-- TESTE 4: Usuário vê aprovações dos próprios pedidos
/*
Para testar: faça login como userB@empresa.com e execute:
*/
SELECT 'TESTE 4: Aprovações visíveis para userB@empresa.com' as teste;
-- Resultado esperado: Aprovação do pedido '22222222-2222-2222-2222-222222222222'
-- SELECT * FROM aprovacoes;

-- TESTE 5: Gerente vê aprovações que pode processar
/*
Para testar: faça login como gerente@empresa.com e execute:
*/
SELECT 'TESTE 5: Aprovações visíveis para gerente@empresa.com' as teste;
-- Resultado esperado: Aprovações pendentes para papel 'gerente'
-- SELECT * FROM aprovacoes;

-- ===============================================
-- 5. TESTES DE POLÍTICAS PARA TABELA NOTIFICACOES
-- ===============================================

-- TESTE 6: Usuário vê apenas próprias notificações
/*
Para testar: faça login como userA@empresa.com e execute:
*/
SELECT 'TESTE 6: Notificações visíveis para userA@empresa.com' as teste;
-- Resultado esperado: Apenas notificação do userA
-- SELECT * FROM notificacoes;

-- ===============================================
-- 6. TESTES DE POLÍTICAS PARA TABELA POLITICAS
-- ===============================================

-- TESTE 7: Usuário comum pode ler políticas mas não criar
/*
Para testar: faça login como userA@empresa.com e execute:
*/
SELECT 'TESTE 7: Políticas para userA@empresa.com' as teste;
-- Deve funcionar: SELECT * FROM politicas;
-- Deve falhar: INSERT INTO politicas (versao, json, criado_por) VALUES ('test', '{}', 'userA@empresa.com');

-- TESTE 8: Admin pode criar políticas
/*
Para testar: faça login como admin@empresa.com e execute:
*/
SELECT 'TESTE 8: Criação de política por admin@empresa.com' as teste;
-- Deve funcionar: INSERT INTO politicas (versao, json, criado_por) VALUES ('test', '{}', 'admin');

-- ===============================================
-- 7. TESTES DE OPERAÇÕES DE UPDATE/DELETE
-- ===============================================

-- TESTE 9: Usuário pode editar próprio pedido em rascunho
/*
Para testar: faça login como userA@empresa.com e execute:
*/
SELECT 'TESTE 9: Update pedido próprio em rascunho' as teste;
-- Deve funcionar: UPDATE pedidos SET titulo = 'TESTE_Pedido_Usuario_A_Editado' WHERE id = '11111111-1111-1111-1111-111111111111';

-- TESTE 10: Usuário não pode editar pedido de outro
/*
Para testar: faça login como userA@empresa.com e execute:
*/
SELECT 'TESTE 10: Tentativa de update pedido de outro usuário' as teste;
-- Deve falhar: UPDATE pedidos SET titulo = 'HACK' WHERE id = '22222222-2222-2222-2222-222222222222';

-- TESTE 11: Gerente pode aprovar pedido
/*
Para testar: faça login como gerente@empresa.com e execute:
*/
SELECT 'TESTE 11: Aprovação de pedido por gerente' as teste;
-- Deve funcionar: UPDATE aprovacoes SET decisao = 'aprovado', aprovador_id = 'gerente@empresa.com' WHERE pedido_id = '22222222-2222-2222-2222-222222222222' AND papel_alvo = 'gerente';

-- ===============================================
-- 8. SCRIPT DE VERIFICAÇÃO AUTOMÁTICA
-- ===============================================

CREATE OR REPLACE FUNCTION verify_rls_policies()
RETURNS TABLE(
  teste TEXT,
  status TEXT,
  descricao TEXT
) AS $$
BEGIN
  -- Este é um exemplo de como estruturar testes automatizados
  -- Em produção, você implementaria testes mais robustos
  
  RETURN QUERY VALUES
    ('RLS Enabled', 'CHECK', 'Verificar se RLS está habilitado em todas as tabelas'),
    ('Policies Count', 'CHECK', 'Verificar se políticas foram criadas'),
    ('Function Access', 'CHECK', 'Verificar se funções auxiliares funcionam'),
    ('Admin Access', 'CHECK', 'Verificar acesso total para admin'),
    ('User Isolation', 'CHECK', 'Verificar isolamento entre usuários');
    
END;
$$ LANGUAGE plpgsql;

-- Executar verificação
SELECT * FROM verify_rls_policies();

-- ===============================================
-- 9. QUERIES DE MONITORAMENTO EM PRODUÇÃO
-- ===============================================

-- Verificar se RLS está ativo
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('pedidos', 'aprovacoes', 'politicas', 'notificacoes');

-- Listar todas as políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar funções criadas
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_role', 'is_admin', 'is_approver', 'can_approve_role');

-- ===============================================
-- 10. INSTRUÇÕES DE TESTE MANUAL
-- ===============================================

/*
PARA TESTAR MANUALMENTE AS POLÍTICAS RLS:

1. PREPARAR USUÁRIOS DE TESTE:
   - Crie usuários com diferentes roles usando set_user_role()
   - Exemplo: admin, gerente, userA, userB

2. EXECUTAR SETUP DE DADOS:
   - Execute as INSERTs da seção 1 como admin
   - Isso criará dados de teste

3. TESTAR CADA USUÁRIO:
   - Faça login com cada usuário no Supabase
   - Execute as queries de teste para cada role
   - Verifique se os resultados estão corretos

4. TESTAR OPERAÇÕES PROIBIDAS:
   - Tente operações que devem falhar
   - Verifique se as políticas estão bloqueando corretamente

5. VERIFICAR LOGS:
   - Monitor logs do Supabase para erros de RLS
   - Verifique performance das queries

CENÁRIOS CRÍTICOS PARA TESTAR:

✅ Usuário comum não vê pedidos de outros
✅ Usuário comum não pode aprovar pedidos
✅ Gerente vê pedidos para sua aprovação
✅ Gerente não pode aprovar pedidos fora de seu nível
✅ Admin tem acesso total
✅ Notificações são privadas por usuário
✅ Políticas são read-only para não-admins

TROUBLESHOOTING:

- Se usuário não consegue ver nenhum dado: Verificar se role está configurado
- Se usuário vê dados demais: Verificar se políticas estão ativas
- Se queries estão lentas: Verificar índices para RLS
- Se erros de permissão: Verificar GRANTs das funções
*/

-- Limpar dados de teste após verificação
-- DELETE FROM aprovacoes WHERE pedido_id IN (SELECT id FROM pedidos WHERE titulo LIKE 'TESTE_%');
-- DELETE FROM pedidos WHERE titulo LIKE 'TESTE_%';
-- DELETE FROM notificacoes WHERE payload_json::text LIKE '%TESTE_%';
