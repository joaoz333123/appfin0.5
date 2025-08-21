-- Schema inicial do AppFin
-- Criado em: 2024-01-15

-- Habilitar RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Tabela de políticas
CREATE TABLE IF NOT EXISTS politicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    versao TEXT NOT NULL,
    json JSONB NOT NULL,
    criado_por TEXT NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    cc TEXT NOT NULL,
    projeto TEXT,
    valor NUMERIC(15,2) NOT NULL,
    estado TEXT NOT NULL DEFAULT 'rascunho' CHECK (estado IN ('rascunho', 'em_aprovacao', 'aprovado', 'reprovado', 'comprometido')),
    solicitante_id TEXT NOT NULL,
    politica_versao TEXT NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de aprovações
CREATE TABLE IF NOT EXISTS aprovacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    etapa_idx INTEGER,
    papel_alvo TEXT NOT NULL,
    aprovador_id TEXT,
    decisao TEXT NOT NULL DEFAULT 'pendente' CHECK (decisao IN ('pendente', 'aprovado', 'reprovado', 'ajuste_solicitado')),
    comentario TEXT,
    em TIMESTAMPTZ DEFAULT NOW(),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mes DATE NOT NULL,
    cc TEXT NOT NULL,
    categoria TEXT NOT NULL,
    orcado NUMERIC(15,2) NOT NULL DEFAULT 0,
    comprometido NUMERIC(15,2) NOT NULL DEFAULT 0
);

-- Tabela de anexos
CREATE TABLE IF NOT EXISTS anexos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    mime TEXT NOT NULL,
    url TEXT NOT NULL,
    texto_extraido TEXT
);

-- Tabela de histórico
CREATE TABLE IF NOT EXISTS historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidade TEXT NOT NULL,
    entidade_id UUID NOT NULL,
    acao TEXT NOT NULL,
    por TEXT NOT NULL,
    em TIMESTAMPTZ DEFAULT NOW(),
    detalhes_json JSONB
);

-- Tabela de dashboards
CREATE TABLE IF NOT EXISTS dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    sql TEXT NOT NULL,
    spec_json JSONB,
    narrativa TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('lembrete', 'escala', 'aprovacao', 'reprovacao')),
    payload_json JSONB NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    criada_em TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_solicitante ON pedidos(solicitante_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_criado_em ON pedidos(criado_em);
CREATE INDEX IF NOT EXISTS idx_aprovacoes_pedido ON aprovacoes(pedido_id);
CREATE INDEX IF NOT EXISTS idx_aprovacoes_decisao ON aprovacoes(decisao);
CREATE INDEX IF NOT EXISTS idx_anexos_pedido ON anexos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_historico_entidade ON historico(entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_user ON notificacoes(user_id, lida);

-- Habilitar RLS em todas as tabelas
ALTER TABLE politicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprovacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (para desenvolvimento)
-- TODO: Implementar políticas mais específicas baseadas em roles

-- Políticas para politicas
CREATE POLICY "Políticas são visíveis para todos" ON politicas
    FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem criar políticas" ON politicas
    FOR INSERT WITH CHECK (criado_por = 'admin');

-- Políticas para pedidos
CREATE POLICY "Pedidos são visíveis para todos" ON pedidos
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem criar seus próprios pedidos" ON pedidos
    FOR INSERT WITH CHECK (solicitante_id = current_user);

-- Políticas para aprovacoes
CREATE POLICY "Aprovações são visíveis para todos" ON aprovacoes
    FOR SELECT USING (true);

CREATE POLICY "Aprovadores podem atualizar suas aprovações" ON aprovacoes
    FOR UPDATE USING (aprovador_id = current_user);

-- Políticas para orcamentos
CREATE POLICY "Orçamentos são visíveis para todos" ON orcamentos
    FOR SELECT USING (true);

-- Políticas para anexos
CREATE POLICY "Anexos são visíveis para todos" ON anexos
    FOR SELECT USING (true);

-- Políticas para historico
CREATE POLICY "Histórico é visível para todos" ON historico
    FOR SELECT USING (true);

-- Políticas para dashboards
CREATE POLICY "Dashboards são visíveis para todos" ON dashboards
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem criar seus próprios dashboards" ON dashboards
    FOR INSERT WITH CHECK (owner_id = current_user);

-- Políticas para notificacoes
CREATE POLICY "Usuários veem apenas suas notificações" ON notificacoes
    FOR SELECT USING (user_id = current_user);

CREATE POLICY "Usuários podem marcar suas notificações como lidas" ON notificacoes
    FOR UPDATE USING (user_id = current_user);

-- Dados de seed
INSERT INTO politicas (versao, json, criado_por) VALUES (
    'v1',
    '{
        "limites_por_valor": {
            "ate_1000": {
                "max_valor": 1000,
                "aprovadores": ["gerente"],
                "sla_horas": 4,
                "anexos_min": ["descricao"]
            },
            "1000_5000": {
                "max_valor": 5000,
                "aprovadores": ["gerente", "diretor"],
                "sla_horas": 8,
                "anexos_min": ["descricao", "cotacao"]
            },
            "5000_25000": {
                "max_valor": 25000,
                "aprovadores": ["diretor", "cfo"],
                "sla_horas": 24,
                "anexos_min": ["descricao", "cotacao", "justificativa"]
            },
            "acima_25000": {
                "max_valor": 999999,
                "aprovadores": ["cfo", "ceo"],
                "sla_horas": 48,
                "anexos_min": ["descricao", "cotacao", "justificativa", "proposta_tecnica"]
            }
        },
        "categorias": {
            "CAPEX": {
                "extra": true,
                "aprovadores_adicionais": ["cfo"],
                "sla_extra": 24
            }
        },
        "sla_horas_por_etapa": {
            "gerente": 4,
            "diretor": 8,
            "cfo": 24,
            "ceo": 48
        },
        "anexos_min_por_faixa": {
            "ate_1000": ["descricao"],
            "1000_5000": ["descricao", "cotacao"],
            "5000_25000": ["descricao", "cotacao", "justificativa"],
            "acima_25000": ["descricao", "cotacao", "justificativa", "proposta_tecnica"]
        },
        "escalonamento": {
            "gerente": "diretor",
            "diretor": "cfo",
            "cfo": "ceo"
        }
    }',
    'admin'
);

-- Orçamentos de exemplo
INSERT INTO orcamentos (mes, cc, categoria, orcado, comprometido) VALUES
    ('2024-01-01', 'ADM', 'OPEX', 50000, 12500),
    ('2024-01-01', 'TI', 'CAPEX', 200000, 45000),
    ('2024-01-01', 'MARKETING', 'OPEX', 30000, 15000),
    ('2024-02-01', 'ADM', 'OPEX', 50000, 8900),
    ('2024-02-01', 'TI', 'CAPEX', 200000, 32000),
    ('2024-02-01', 'MARKETING', 'OPEX', 30000, 12000);
