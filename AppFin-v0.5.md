C:\AppFin-v0.5




 **AppFin ideal** — com a **IA como estrela** (via API) — focado em PMEs que hoje aprovam via WhatsApp/e-mail e querem disciplina, visibilidade e regras executáveis sem depender de ERP.

# Princípios inegociáveis 

* **IA = motor de política**, não só “chat”: ela **projeta, simula e escreve** as regras que o sistema executa.
* **Policy-as-code + trilha imutável**: toda regra tem **versão, autoria, motivo** e é **auditável**.
* **Sem cativeiro**: **export 1-clique** (dados + anexos + histórico + políticas) em formatos abertos.
* **LGPD by design**: mínimos dados, criptografia ponta a ponta, opt-out de treino, explicabilidade da IA.
* **Mobile-first para aprovação**: aprovar **em 2 toques** com contexto suficiente.

# Como o AppFin ideal funciona (passo a passo — vida real)

1. **Onboarding guiado pela IA (30–60 min)**

   * A IA entrevista o dono: estrutura (centros de custo, categorias), limites por valor, quem aprova o quê, SLAs (24/48/72h), anexos obrigatórios por faixa, exceções (urgência, CAPEX, recorrentes).
   * Resultado: **Política Versão 1** gerada em **linguagem declarativa (policy-as-code)**, pronta para execução.

2. **Simulação antes de ligar pra valer**

   * A IA cria **10 cenários** típicos (ex.: >R\$50k/CAPEX/sem 2 cotações) e mostra por onde cada pedido passa, **por quê**, e quem aprovaria.
   * Dono ajusta; nasce a **Versão 2**. Sem simulação **não** dá pra ativar.

3. **Operação diária**

   * **Solicitante** abre um **Pedido de Compra (PC)** com descrição, cotação/anexos, centro de custo.
   * A **IA do formulário** valida: pede anexos faltantes, sugere categoria, detecta duplicidade e preço “fora da curva”.
   * O **motor de workflow** executa a política: etapas por valor/categoria/projeto, **SLA por etapa**, **escalonamento** e **delegação** (férias/ausência).
   * **Aprovadores** recebem **inbox** (web/mobile), veem **contexto mínimo** (histórico, cotações, saldo do orçamento, PCs similares) e aprovam/reprovam com comentário obrigatório quando reprovar.
   * **Trilha imutável** salva quem/quando/onde/comentário/IP/versão da política vigente.

4. **Fechamento e aprendizado**

   * O PC aprovado gera **comprometido** no orçamento. (Sem ERP, o “realizado” pode ser manual via upload de comprovante/NF-e PDF/XML opcional).
   * A IA roda **insights semanais**: estouro previsto por centro de custo, aprovadores gargalo, categorias com mais retrabalho, fornecedores com preços atípicos.
   * Qualquer mudança de regra passa por **proposta → simulação → publicação (Versão 3, 4, …)**.

# A IA como estrela (o pacote completo)

* **Arquiteta de Políticas**: transforma respostas do dono em **regras executáveis** (limites, exceções, anexos obrigatórios, quem substitui quem, feriados, horários).
* **Simulador de aprovação**: “se eu ligar essa regra, o que muda?” Mostra **fluxo projetado** e **impacto** (SLA, carga por aprovador).
* **Detecção de anomalias**: PCs duplicados, split de compras para burlar alçada, fornecedor com subida de preço fora do histórico, itens incoerentes com categoria.
* **Previsão e “what-if”**: risco de **estouro do orçamento** por centro/projeto, efeito de reduzir limite de gerente de R\$10k→R\$7k.
* **Explicabilidade**: cada alerta/decisão traz **“por que cheguei aqui”** (regras, dados usados, confiabilidade).
* **RAG privado**: a IA responde perguntas **usando sua própria política e histórico**, não “internet aleatória”.
* **Governança da IA**: sem treino nos dados do cliente por padrão; máscara de PII; logs de prompts/respostas versionados.

# UX que faz aprovações andarem (sem drama)

* **Inbox de aprovações** com **tempo restante do SLA**, prioridade e “aprovar/reprovar” rápido.
* **Resumo inteligente**: a IA gera **1 parágrafo** com “o que importa” (valor, variação vs. cotação anterior, anexos, política aplicada).
* **Comentários com @menções** e **checklist automático** (ex.: “faltam 2 cotações para >R\$10k”).
* **Modo offline leve** para aprovar (mobile PWA) e **upload tardio** de anexos.
* **Acessibilidade e nítidez**: sem frescura visual; foco em legibilidade e poucos cliques.

# Dados e estrutura (alto nível, sem complicar)

* **Entidades**: Empresa, Usuário, Papel, **Política** (versões), Regra, Projeto, Centro de Custo, Categoria, **Orçamento** (itens), **Pedido de Compra**, Etapa de Aprovação, Ação de Aprovação, Fornecedor, Anexo, Tabela de Câmbio.
* **Estados do PC**: rascunho → em aprovação → escalado → aprovado → cancelado/reprovado → comprometido → (opcional) liquidado manual.
* **Imutabilidade**: histórico de versões de política e de PCs com **hash** e carimbo de tempo.

# Métricas e dashboards que importam (sem BI mirabolante)

* **Operacional**: tempo médio por etapa, **% SLA cumprido**, retrabalho por motivo, fila por aprovador, aging por categoria.
* **Financeiro (comprometido)**: orçamento vs. comprometido por centro/projeto/mês; **previsão de estouro**; top fornecedores por gasto e variação de preço.
* **Qualidade**: % de PCs com anexo faltante, fraude provável (split), divergência de categoria.
* **Saúde do processo**: adoção por time, gargalos recorrentes, “quem segura a fila”.

# Segurança, LGPD e confiabilidade (desde o dia 0)

* **SSO**: Google pronto; OIDC/Microsoft como próximo passo; **MFA** para faixas altas.
* **RBAC** por papel e projeto; **field-level** para esconder valores sensíveis se preciso.
* **Criptografia** in-transit e at-rest; **backups testados**; **RPO ≤ 24h, RTO ≤ 4h** (claros).
* **DPA/Política**: localização dos dados, retenção, direito de exclusão, trilha de acesso.
* **Status page** simples + logs de auditoria exportáveis.

# Integrações (sem depender delas para funcionar)

* **Entrada**: CSV/Sheets para fornecedores, centros de custo, orçamentos; e-mail forward para anexos.
* **Saída**: **Webhooks + API REST** para levar PCs aprovados ao ERP/contabilidade **quando existir**.
* **Mensageria**: e-mail/WhatsApp/Telegram para notificações (com opt-in e trilha).
* **NF-e opcional**: leitura básica de XML só para validar valor/fornecedor (quando cliente quiser).

# Portabilidade e “sem cativeiro”

* **Export 1-clique**: JSON/CSV + pasta de anexos + PDF do histórico e **todas as versões de política**.
* **Modo somente-leitura** para encerramento de contrato (o cliente não perde o passado).

# Limites assumidos (clareza ajuda a vender)

* **Não é contabilidade nem banco**: o foco é **comprometido** e **governança de compras**.
* **Realizado** é opcional/manual enquanto não houver ERP.
* **Preços de mercado**: a IA **contextualiza** e mostra **fonte** quando citar “mercado”; sem fonte, não vira alerta crítico.



**********************************************************************************************************************
						# Stack #
**********************************************************************************************************************

1. **Front-end (web + mobile PWA)**

* **Next.js (App Router) + TypeScript**
* **TanStack Query** (data fetching/cache), **Zustand** (estado local)
* **Tailwind + shadcn/ui** (produtividade), **react-hook-form + zod** (forms com validação forte)
* **Auth.js (NextAuth)** com **Google** já, pronto para **OIDC/SAML** depois
* PWA com push (notificações de aprovação e SLA)

2. **Backend (API + motor de regras + jobs)**

* **NestJS (Fastify) + TypeScript** (módulos limpos, DI, testes fáceis)
* **tRPC** opcional para tipagem end-to-end (se preferir REST puro, tudo bem)
* **pg-boss** (fila e **jobs temporizados** em Postgres) para **SLA, escalonamento e lembretes** sem precisar de Redis
* **OpenTelemetry** (traços/metrics), **Sentry** (erros), **pino** (logs)

3. **Banco e storage**

* **PostgreSQL (Supabase)**

  * **RLS** (multi-tenant sério)
  * **pgvector** (RAG privado para políticas, histórico e anexos)
  * **pgaudit** (auditoria) e **timescaledb** (métricas de processo)
* **Supabase Storage** (anexos), com antivírus (ClamAV) em worker

4. **IA (via API, desacoplada)**

* **Orquestrador leve próprio** (nada de framework pesado):

  * providers plugáveis (OpenAI/Claude/Gemini), **JSON schema / tool calling** para **gerar política executável**
  * **RAG** em cima do próprio Postgres/pgvector (sem inventar data lake)
  * **Camada de explicabilidade**: toda resposta vem com “por que” + referências (documentos/linhas)
* **Conteúdo de mercado**: sempre com **fonte e score de confiança**; sem fonte → só “insight”, nunca bloqueio

5. **Motor de política (coração do produto)**

* **OPA (Open Policy Agent, Rego)** **embutido** (via WASM) para decisões de aprovação; dá **explicações** e versionamento
* DSL “amigável” (JSON) **gerada pela IA** → **compilada para Rego**
* **Simulador**: roda os cenários no OPA e retorna o caminho do fluxo + justificativas

6. **Workflow**

* **State machine** persistida em Postgres (tabela de transições imutável + hash encadeado para “tamper-evidence”)
* **pg-boss** agenda **timeouts** de cada etapa (SLA) e executa **escalonamentos** e **delegações**
* **Webhooks** de saída (ERP/contabilidade quando existir)

7. **Segurança/LGPD**

* **RBAC** (papel/projeto/centro de custo) + MFA para valores altos
* Criptografia in-transit/at-rest, **DPA** e política de retenção
* **Export 1-clique** (JSON/CSV + anexos + políticas/versionamento)

8. **Infra/Deploy (barata e previsível)**

* **Vercel** (front)
* **Fly.io** ou **Railway** (backend NestJS)
* **Supabase** (Postgres/Storage/Auth opcional)
* **Cloudflare** (DNS/WAF/Cache), **GitHub Actions** (CI/CD)

---
**********************************************************************************************************************
						# Ordem de implementação (passo a passo, sem desviar do objetivo) #
**********************************************************************************************************************

1. **Esqueleto tipado**: Next.js + NestJS + Supabase (conexão, migrações com **Drizzle ORM**).
2. **Autenticação Google** no Auth.js e **multi-tenant** com RLS (empresa\_id em tudo).
3. **Modelos base**: Empresa, Usuário, Papel, **Política (versões)**, Projeto, Centro de Custo, Categoria, **Orçamento**, **Pedido de Compra**, **Transição de Workflow**, **Anexo**.
4. **Motor de política v1**:

   * IA gera **JSON de política** → compilação para **Rego** → avaliação pelo OPA (WASM).
   * **Simulador**: 10 cenários padrão retornando caminho + motivo.
5. **Workflow com SLA**: state machine + **pg-boss** (delayed jobs) para prazos, escalonamento e delegação.
6. **Inbox de aprovações (PWA)**: aprovar/reprovar com **resumo inteligente** (IA) + checklist de anexos obrigatórios.
7. **RAG privado** (pgvector): buscas por políticas, PCs similares e fornecedores; **explicabilidade** sempre junto.
8. **Dash operacional**: tempo por etapa, % SLA, aging, desvios por centro de custo (materialized views).
9. **Auditoria forte**: trilha imutável (hash por transição), **pgaudit**, export 1-clique.
10. **Notificações**: e-mail + (opcional) WhatsApp/Telegram com opt-in e link direto para aprovar.

---


---

				# Resumo #

				* **Front**: Next.js/TS, Tailwind/shadcn, TanStack, PWA.
				* **Back**: NestJS/TS, OPA (Rego) como motor de política, pg-boss para SLA, OpenTelemetry/Sentry.
				* **Dados**: Postgres/Supabase com RLS, pgvector, pgaudit, timescaledb.
				* **IA**: providers plugáveis via API, JSON/tool-calling, RAG privado, explicabilidade obrigatória.
				* **Infra**: Vercel + Fly/Railway + Supabase + Cloudflare, CI/CD GitHub Actions.

		

**********************************************************************************************************************
**********************************************************************************************************************
**********************************************************************************************************************

		**conduzir a construção do AppFin** sem sair do escopo.


			Substitua os campos `<<ASSIM>>` antes de enviar.

---
	Substitua os campos `<<ASSIM>>` antes de enviar.
# PROMPT 0 — GUARDRAILS GERAIS (COLE NO INÍCIO DE TODA SESSÃO)

**Objetivo**: Fixar limites, stack e forma de trabalhar para todas as próximas etapas.
**Instruções (cole como está, ajustando variáveis onde aplicável):**

> Você é um(a) Tech Lead sênior especializado(a) em **TypeScript**. Nosso produto é o **AppFin**: plataforma web para **governança de compras** (aprovações com trilha de auditoria, política executável e simulador). **Fora do escopo**: contabilidade, banco, ERP, NF-e obrigatória, pagamentos.
> **Stack obrigatória**: Front **Next.js (App Router)** + TS + Tailwind + shadcn + TanStack Query + react-hook-form/zod (PWA); Back **NestJS (Fastify)** + TS; DB **PostgreSQL (Supabase)** com **RLS**, **pgvector**, **pg-boss**; **OPA (Rego via WASM)** como motor de política; observabilidade **OpenTelemetry** e erros **Sentry**; deploy **Vercel** (front), **Fly.io/Railway** (back), **Supabase** (DB/Storage), **Cloudflare** (DNS/WAF).
> **IA via API** (providers plugáveis). A IA **gera política executável**, **simula cenários** e **explica decisões**; **RAG privado** no Postgres/pgvector.
> **Princípios**: “policy-as-code”, versionamento, simulador antes de ativar, trilha imutável (hash encadeado), export 1-clique. **LGPD by design**; sem treinar modelo nos dados do cliente por padrão.
> **Tomada de decisão**: sempre listar **artefatos**, **passo a passo**, **riscos** e **rollback**.
> **Se eu pedir algo fora do escopo/stack, recuse e ofereça alternativa dentro do escopo.**

---

# PROMPT 1 — ESQUELETO DO PROJETO (MONO OU BI-REPO)

**Objetivo**: Subir esqueleto tipado e padronizado.
**Insumos**: `<<NOME_ORG_GITHUB>>`, `<<NOME_REPO_FRONT>>`, `<<NOME_REPO_BACK>>`, `<<PKG_MANAGER:npm|pnpm|yarn>>`
**Instruções do prompt**:

> Crie o plano de bootstrap do projeto com:
>
> 1. Estrutura de pastas (front Next.js, back NestJS).
> 2. Linters/formatters (ESLint, Prettier), tsconfig compartilhado, commitlint + husky.
> 3. Pipeline CI/CD (GitHub Actions) com: lint, typecheck, build, testes, preview deploy.
> 4. Templates de **.env.example** (front/back) listando chaves mínimas.
> 5. Tutorial de bootstrap local (comandos **exatos**).
>    Entregue: lista de arquivos gerados, scripts `package.json`, e check-list de verificação pós-clone.
>    Critérios de aceite: `npm run typecheck` e `npm run build` passam; CI verde.

**Teste rápido**: clonar, instalar, rodar typecheck/build nos dois apps.
**Fora do escopo**: qualquer modelo de dados de domínio (virá no Prompt 3).

---

# PROMPT 2 — AUTENTICAÇÃO GOOGLE + MULTI-TENANT COM RLS

**Objetivo**: Login Google no front; tenants isolados por **RLS** no Supabase.
**Insumos**: `<<GOOGLE_OAUTH_CLIENT_ID>>`, `<<GOOGLE_OAUTH_SECRET>>`
**Instruções**:

> Implemente Auth.js (NextAuth) com Google no front, sessão no server, e **tenant awareness** (todas as chamadas incluem `empresa_id`).
> No Postgres (Supabase), crie tabela `empresas`, `usuarios`, e políticas **RLS** para isolar dados por `empresa_id`.
> Entregue: migrações SQL/Drizzle, endpoints de sessão, hook `useCurrentTenant()`, middleware que injeta `empresa_id`.
> Critérios de aceite: usuário só enxerga dados da própria empresa; RLS testado com 2 empresas fictícias.

**Teste rápido**: criar 2 contas em 2 empresas, confirmar isolamento.
**Fora do escopo**: SAML/Microsoft (posterior).

---

# PROMPT 3 — MODELO DE DADOS BASE

**Objetivo**: Entidades mínimas para operar aprovações.
**Instruções**:

> Defina e gere migrações para: **Empresa, Usuário, Papel, Política (versões), Regra, Projeto, CentroDeCusto, Categoria, Orçamento, PedidoDeCompra, EtapaDeAprovação, AçãoDeAprovação, Fornecedor, Anexo**.
> Inclua chaves, índices e relacionamentos; campos de auditoria (created\_at, created\_by, policy\_version aplicada).
> Entregue: diagrama lógico e migrações.
> Critérios: migrações rodam limpas; RLS cobrindo todas as tabelas multi-tenant.

**Teste rápido**: seed mínimo + consultas de sanidade.
**Fora do escopo**: “realizado” contábil.

---

# PROMPT 4 — DSL DE POLÍTICA + OPA (REGO VIA WASM)

**Objetivo**: **IA gera** JSON de política; **OPA** avalia decisões.
**Instruções**:

> Proponha um **esquema JSON** de política (limites por valor, por categoria, por centro de custo, quem aprova, SLA por etapa, anexos obrigatórios, delegação/feriados, exceções).
> Crie **transpilação** JSON→Rego e embede o OPA WASM no backend Nest.
> Entregue: contrato JSON (com exemplos), função `evaluatePolicy(pedido, politica)` que retorna **rota de aprovação** + **explicação** (quais regras dispararam).
> Critérios: dado um pedido de teste, a saída descreve **cada etapa** com o **porquê**.

**Teste rápido**: 3 políticas de exemplo → 5 pedidos cada → rotas e justificativas.
**Fora do escopo**: UI final (vem depois).

---

# PROMPT 5 — ASSISTENTE DE POLÍTICAS (IA)

**Objetivo**: IA entrevista dono e **gera** política + **changelog**.
**Instruções**:

> Crie fluxo de “entrevista” (perguntas) e **prompts/tool-calls** para gerar o JSON de política.
> Exigir: **versão**, **resumo de decisões**, **motivos**, **riscos** e **pontos ambíguos** a confirmar.
> Entregue: prompts prontos (system/user), funções de validação do JSON (zod), e rotina de **versionamento**.
> Critérios: política gerada é **válida** no schema e passa no avaliador OPA.

**Teste rápido**: rodar entrevista com respostas mock e gerar Versão 1 válida.
**Fora do escopo**: busca na web.

---

# PROMPT 6 — SIMULADOR DE APROVAÇÃO

**Objetivo**: rodar **N cenários** e visualizar caminho/impacto.
**Instruções**:

> Dado uma política, gere 10–12 **cenários sintéticos** e calcule: etapas, aprovadores, SLAs, pontos de bloqueio.
> Entregue: endpoint `/simulate`, payload, e resumo legível (“este pedido para em CFO por >R\$50k CAPEX”).
> Critérios: alteração na política altera resultados previsivelmente.

**Teste rápido**: trocar um limite e ver mudança nas rotas.
**Fora do escopo**: UI bonita (vem no Prompt 8).

---

# PROMPT 7 — WORKFLOW COM SLA/ESCALONAMENTO/DELEGAÇÃO

**Objetivo**: state machine + **pg-boss** para prazos e escalas.
**Instruções**:

> Modele estados do Pedido: **rascunho → em\_aprovação → escalado → aprovado → reprovado → comprometido**.
> Registre **transições imutáveis** (hash encadeado).
> Use **pg-boss** para agendar `deadline` de cada etapa; ao expirar, **escale** para o próximo aprovador.
> Entregue: tabela de transições, workers pg-boss, endpoints de ação (aprovar/reprovar/comentar).
> Critérios: simular atraso e ver escalonamento automático.

**Teste rápido**: reduzir SLA para 10s e observar escalonamento.
**Fora do escopo**: integrações.

---

# PROMPT 8 — INBOX DE APROVAÇÕES (PWA)

**Objetivo**: aprovar/reprovar em 2 toques com contexto.
**Instruções**:

> Crie tela **Inbox** com filtros (minhas pendentes, por SLA, por valor).
> Card traz: resumo IA (1 parágrafo), valor, centro de custo, saldo do orçamento, anexos, “por que está comigo”, tempo restante.
> Ações: **Aprovar**, **Reprovar (comentário obrigatório)**, **Solicitar ajustes**.
> Entregue: componentes React, hooks TanStack, formulários RHF/Zod.
> Critérios: fluxo completo sem recarregar, acessível (teclado/aria).

**Teste rápido**: aprovar 3 pedidos, reprovar 1 com motivo, pedir ajuste em 1.
**Fora do escopo**: charts/dash.

---

# PROMPT 9 — RAG PRIVADO (pgvector)

**Objetivo**: busca de **políticas, pedidos e fornecedores** semelhantes.
**Instruções**:

> Indexar: versões de política, pedidos (metadados), fornecedores; criar função de embedding e **citations** (IDs/linhas).
> A IA sempre **explica** com base em itens encontrados; sem fonte → marcar como insight fraco.
> Entregue: schema de embeddings, endpoints de busca, middleware de “explicabilidade”.
> Critérios: pergunta “por que este pedido exige CFO?” retorna a regra exata.

**Teste rápido**: consulta por política e verificar citações.
**Fora do escopo**: web crawling.

---

# PROMPT 10 — DASHBOARD OPERACIONAL

**Objetivo**: métricas **que movem a fila**.
**Instruções**:

> Gere **views/materialized views** para: tempo médio por etapa, **% SLA**, aging, retrabalho por motivo, desvios por centro de custo.
> UI simples com filtros por período e centro de custo.
> Entregue: queries otimizadas, endpoints, componentes de UI.
> Critérios: recalcula em <1s em dataset de teste.

**Teste rápido**: simular 200 pedidos e ver painéis.
**Fora do escopo**: BI financeiro avançado.

---

# PROMPT 11 — AUDITORIA + EXPORT 1-CLIQUE

**Objetivo**: portabilidade e compliance.
**Instruções**:

> Implementar:
>
> 1. **Log imutável** de ações (hash corrente).
> 2. Export **ZIP** contendo CSV/JSON de entidades, PDFs gerados dos históricos e **todas as versões de política**.
> 3. Endpoint de auditoria por período/usuário.
>    Critérios: export reimportável; hash valida cadeia.

**Teste rápido**: exportar e validar hashes.
**Fora do escopo**: assinatura digital ICP-Brasil.

---

# PROMPT 12 — NOTIFICAÇÕES

**Objetivo**: lembrança e ação rápida.
**Instruções**:

> E-mail (obrigatório) + opcional WhatsApp/Telegram (opt-in).
> Conteúdo inclui link direto para aprovar; notifique **antes do SLA estourar** e no **escalonamento**.
> Critérios: clicar e cair na etapa correta; logs de entrega.

**Teste rápido**: simular prazos e ver sequência de notificações.
**Fora do escopo**: envio em massa de marketing.

---

# PROMPT 13 — SEGURANÇA & LGPD BÁSICO

**Objetivo**: mínimo viável de confiança.
**Instruções**:

> Documente e implemente: RLS, RBAC por papel/projeto, MFA para valores altos, criptografia TLS e at-rest, política de retenção e direito de exclusão, **opt-out de treino de IA**, DPA rascunho.
> Critérios: checklist preenchido; rotas de exclusão auditadas.

**Teste rápido**: usuário sem permissão tentando ver outro projeto.
**Fora do escopo**: certificações (SOC/ISO).

---

# PROMPT 14 — TELEMETRIA E ERROS

**Objetivo**: ver o que quebra e por quê.
**Instruções**:

> Habilite **OpenTelemetry** (traços principais: login, criação de pedido, avaliação de política, transição, export) e **Sentry** no front/back.
> Painel mínimo com taxas de erro e latência.
> Critérios: cada ação-chave gera traço consultável; erros chegam ao Sentry com contexto.

**Teste rápido**: forçar um erro e ver no Sentry.
**Fora do escopo**: APM pago complexo.

---

# PROMPT 15 — DEPLOY & PILOTO

**Objetivo**: colocar no ar com isolamento e rollback.
**Instruções**:

> Scripts de deploy: **Vercel** (front), **Fly/Railway** (back), **Supabase** (DB/Storage).
> Ambiente `staging` e `prod`, variáveis separadas, **migrations automáticas** com gate.
> Checklist de **rollback** e **seed** mínimo para demo.
> Critérios: URL pública, login Google, criar pedido, simular, aprovar, exportar.

**Teste rápido**: demo end-to-end guiada.
**Fora do escopo**: multi-região.

---

## COMO USAR

1. Cole o **PROMPT 0** no começo.
2. Siga na ordem **1 → 15**. Não pule.
3. Em cada etapa, **preencha os insumos** e exija os **entregáveis e critérios de aceite**.
4. Se a IA tentar sair do escopo/stack, **lembre o PROMPT 0**.

Se quiser, adapto qualquer um dos prompts para o seu contexto exato (nomes de empresa, limites de aprovação, etc.).


**********************************************************************************************************************
						TEMPLATES
						
**********************************************************************************************************************

No ZIP tem estes templates:

papeis.csv – define poderes e limites.

centros_custo.csv, projetos.csv – estrutura base.

categorias.csv – CAPEX/OPEX, anexos e nº de cotações.

usuarios.csv – e-mails Google, papéis, alçadas, delegações, férias, MFA.

fornecedores.csv – CNPJ, contato, bloqueio.

orcamentos.csv – orçado mensal por projeto/CC/categoria.

notificacoes.csv – lembretes e escalonamentos.

feriados.csv – feriados para cálculo de SLA.

nomenclatura.json – prefixos, formato de datas e timezone.

politica.json – skeleton de política v1 (faixas de valor, anexos, exceções, delegações, SLA, escalonamento).

pedidos_exemplo.csv – 3 PCs prontos pra rodar no simulador.

README.md – ordem sugerida de preenchimento e observações.
**********************************************************************************************************************
						**imagens de todas as telas**
**********************************************************************************************************************

						como referência. Abaixo vai um **prompt mestre** (para colar em mim ou em outra IA com geração de imagem) + **prompts por tela**. Siga em **passo a passo**.

							---

							# PASSO 1 — PROMPT-MESTRE (configura direção de arte e consistência)

							```
							Você é um(a) designer de produto sênior. Gere MOCKUPS REALISTAS (não código) do AppFin — plataforma web/PWA para governança de compras (aprovações com regras executáveis, simulador e auditoria).

							Regras fixas (aplicar em TODAS as imagens):
							- Estilo: enterprise clean, sem 3D/perspectiva, visão FRONTAL plana, alta legibilidade.
							- UI kit: Tailwind/shadcn-like (cards, tables, badges, dropdowns, toasts).
							- Paleta: base neutra (cinzas), acento azul #2563EB; feedback: verde #16A34A, amarelo #F59E0B, vermelho #DC2626.
							- Tipografia: Inter/Roboto (parecido), tamanhos hierárquicos; ícones minimalistas.
							- Idioma dos textos: PT-BR (Brasil). Moeda: R$ (BRL). Datas no formato dd/mm/aaaa.
							- Dados plausíveis (nada de lorem ipsum), nomes fictícios e valores realistas.
							- Layout: grid de 12 colunas, espaçamento generoso, contraste AA mínimo.
							- Elementos recorrentes: topo com seletor de empresa “ACME Indústria” (tenant), busca global, avatar do usuário, breadcrumb na área de conteúdo.
							- A IA SEMPRE mostra “por que” nas decisões (explicabilidade) quando aparecer.
							- NÃO usar marcas de terceiros, NÃO inventar integrações.
							- Exportar cada tela em 1920x1080 (desktop). Depois faremos variações mobile 390x844.

							Quando eu disser “GERAR LOTE DESKTOP”, você renderiza todas as telas solicitadas nesta sessão, numeradas e com nomes.
							Depois, quando eu disser “GERAR LOTE MOBILE”, você re-renderiza as mesmas telas na proporção 390x844, adaptando para mobile/PWA, mantendo consistência visual.
							```

							---

							# PASSO 2 — PROMPTS POR TELA (DESKTOP)

							Cole um por vez (ou todos juntos, se a IA aceitar lotes). Cada item vira **UMA imagem**.

							1. **Login (SSO Google)**

							```
							Tela: Login SSO Google
							Conteúdo: card central com logo neutro “AppFin”, botão “Continuar com Google”, aviso LGPD breve, link para política de privacidade, rodapé com versão do app.
							Objetivo visual: simplicidade e confiança.
							```

							2. **Onboarding — Entrevista da IA (criar política v1)**

							```
							Tela: Onboarding assistido por IA
							Layout: esquerda = chat da IA entrevistando; direita = resumo vivo da Política v1 (limites por valor, categorias, centros de custo, SLAs, anexos obrigatórios).
							Mostrar: checklist de passos (Estrutura → Limites → Exceções → Revisão).
							```

							3. **Simulador — Cenários de aprovação**

							```
							Tela: Simulador de aprovação
							Conteúdo: tabela com 10 pedidos sintéticos; ao clicar em um, à direita aparece o fluxograma linear (etapas) + painel “Por que” (regras disparadas) + SLA previsto.
							Mostrar: mudança de cor por risco de atraso.
							```

							4. **Dashboard — Operacional**

							```
							Tela: Dashboard
							KPI cards: Tempo médio por etapa, % SLA cumprido, PCs pendentes, Retrabalho.
							Gráficos: aging por etapa (barra), desvios por centro de custo (linha/coluna).
							Tabela: “Pendências críticas” com ordenação.
							Filtros por período e centro de custo.
							```

							5. **Inbox de Aprovações**

							```
							Tela: Inbox de aprovações
							Cards: pedido #, fornecedor, valor R$, centro de custo, tempo restante de SLA (badge), mini-resumo IA (1 parágrafo).
							Ações rápidas: Aprovar, Reprovar (abre textarea obrigatório), Solicitar ajuste.
							Filtros: minhas pendentes, por SLA, por valor.
							```

							6. **Criar Pedido de Compra (formulário guiado)**

							```
							Tela: Novo Pedido de Compra
							Form: descrição, categoria, centro de custo, valor, fornecedor, anexos (upload com arrastar/soltar).
							Validações: anexos obrigatórios > R$10.000, campos destacados; sugestões IA para categoria e fornecedor similar.
							Barra lateral: saldo do orçamento e PCs parecidos.
							```

							7. **Detalhe do Pedido de Compra**

							```
							Tela: Detalhe do PC
							Topo: status atual, valor, solicitante, projeto/centro de custo.
							Abas: Linha do tempo (ações com hash), Anexos, Comentários (@menções), Política aplicada (versão e “por que”).
							CTA: Aprovar / Reprovar / Solicitar ajuste (com confirmação).
							```

							8. **Editor de Política (policy-as-code)**

							```
							Tela: Política — Versões e Edição
							Layout: esquerda timeline de versões (v1, v2...), centro editor em JSON amigável/DSL, direita “Diferenças” (antes/depois) e botão “Simular alterações”.
							Mostrar: rótulos de risco (“aumenta carga do CFO em +18%”).
							```

							9. **Publicação de Política (changelog e simulação final)**

							```
							Tela: Publicar Política
							Resumo: mudanças, impacto esperado (SLA, carga por aprovador), cenários críticos que mudaram.
							Exigir: caixa de confirmação “Entendo o impacto”, botão “Publicar v3”.
							```

							10. **Orçamentos — Orçado vs Comprometido**

							```
							Tela: Orçamentos
							Tabela por centro de custo/projeto: colunas Orçado, Comprometido, Saldo, %.
							Gráfico: evolução mensal do comprometido.
							Ações: ajustar previsão (nota explicativa), export CSV.
							```

							11. **Fornecedores**

							```
							Tela: Fornecedores
							Tabela: nome, CNPJ, categoria, volume anual (R$), variação de preço, risco (badge).
							Busca + filtro; card de fornecedor com histórico de PCs e variações.
							```

							12. **Relatórios de Processo**

							```
							Tela: Relatórios
							Blocos: Retrabalho por motivo, Gargalos por aprovador, Itens com split suspeito.
							Botões: exportar PDF/CSV; salvar relatório favorito.
							```

							13. **Auditoria & Export**

							```
							Tela: Auditoria e Exportação
							Filtro por período/usuário; lista de eventos com hash encadeado.
							Botão “Exportar tudo (ZIP)” com (dados CSV/JSON + anexos + políticas).
							Indicador de integridade dos hashes.
							```

							14. **Configurações — Usuários & Papéis (RBAC)**

							```
							Tela: Usuários & Papéis
							Tabela de usuários com papéis, projetos/centros permitidos; editor de papéis (permissões granulares).
							Toggle de MFA obrigatório para faixas altas.
							```

							15. **Notificações & SLA**

							```
							Tela: Notificações e SLA
							Configuração de lembretes (antes do prazo), canais (e-mail, WhatsApp/Telegram com opt-in), regras de escalonamento.
							Pré-visualização de notificação.
							```

							16. **Status & Backups**

							```
							Tela: Status do Sistema
							Indicadores: uptime, fila de jobs (pg-boss), backups (último sucesso, próximo agendado), RPO/RTO.
							Link para status page pública.
							```

							---

							# PASSO 3 — GERAR LOTE DESKTOP

							Diga à IA: **“GERAR LOTE DESKTOP com as telas 1 a 16”**.
							Se a IA suportar, peça **uma imagem por tela**, nomeando: `01-Login.png`, `02-Onboarding-IA.png`, … `16-Status-Backups.png`.

							---

							# PASSO 4 — GERAR LOTE MOBILE (PWA)

							Depois, peça a **adaptação para 390x844** (mobile/PWA) das **mesmas telas**.
							Diga: **“GERAR LOTE MOBILE re-renderizando as telas 1 a 16 para 390x844, mantendo conteúdo essencial e ação em 1–2 toques.”**

							---

							# PASSO 5 — CHECAGEM RÁPIDA (aceite visual)

							* PT-BR, R\$ e dd/mm/aaaa corretos.
							* Explicabilidade visível onde há decisão de IA.
							* Inbox aprova em **2 toques**.
							* Política tem **versões, comparativo e simulação**.
							* Auditoria mostra **hash encadeado** e export **1-clique**.

							Se quiser, eu mesmo gero as imagens a partir desses prompts — é só dizer “**GERAR LOTE DESKTOP**” e eu executo agora.
