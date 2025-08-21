package appfin.policy.validation

# =============================================================================
# SISTEMA DE VALIDAÇÃO OPA FLEXÍVEL PARA APPFIN v0.5
# =============================================================================
# 
# NÍVEIS DE CRITICIDADE:
# 🔴 CRÍTICO (ERROR): Falhas de segurança que impedem execução
# 🟡 IMPORTANTE (WARNING): Problemas que podem causar funcionamento inadequado
# 🔵 RECOMENDADO (SUGGESTION): Melhorias de boas práticas
# 
# FILOSOFIA: Permitir onboarding fácil com políticas básicas válidas,
# mas alertar sobre possíveis problemas e incentivar boas práticas.
# =============================================================================

# Resultado principal da validação
default valid = false
default errors = []
default warnings = []
default suggestions = []

# =============================================================================
# VALIDAÇÃO PRINCIPAL FLEXÍVEL
# =============================================================================
# Política é VÁLIDA se atender apenas os requisitos CRÍTICOS
valid {
    valid_structure_minimal     # 🔴 CRÍTICO: Estrutura mínima
    valid_faixas_minimal       # 🔴 CRÍTICO: Pelo menos uma faixa válida
    valid_aprovadores_critical  # 🔴 CRÍTICO: Aprovadores existem
}

# =============================================================================
# 🔴 VALIDAÇÕES CRÍTICAS (OBRIGATÓRIAS)
# =============================================================================

# Estrutura mínima obrigatória - apenas campos essenciais
valid_structure_minimal {
    input.limites_por_valor                    # Obrigatório: definir limites
    count(input.limites_por_valor) > 0         # Obrigatório: pelo menos uma faixa
}

# Pelo menos uma faixa de valor válida
valid_faixas_minimal {
    some faixa_id
    faixa := input.limites_por_valor[faixa_id]
    faixa.max_valor                            # Obrigatório: ter limite
    faixa.max_valor > 0                        # Obrigatório: limite positivo
    faixa.aprovadores                          # Obrigatório: ter aprovadores
    count(faixa.aprovadores) > 0               # Obrigatório: pelo menos um aprovador
}

# Aprovadores devem existir e ter formato válido
valid_aprovadores_critical {
    every faixa_id {
        faixa := input.limites_por_valor[faixa_id]
        every aprovador {
            aprovador := faixa.aprovadores[_]
            is_string(aprovador)               # Aprovador deve ser string
            count(aprovador) > 0               # Aprovador não pode ser vazio
        }
    }
}

# =============================================================================
# 🔴 ERROS CRÍTICOS (IMPEDEM FUNCIONAMENTO)
# =============================================================================

errors[erro] {
    not valid_structure_minimal
    erro := "CRÍTICO: Política deve ter 'limites_por_valor' com pelo menos uma faixa"
}

errors[erro] {
    not valid_faixas_minimal  
    erro := "CRÍTICO: Todas as faixas devem ter 'max_valor' > 0 e pelo menos um aprovador"
}

errors[erro] {
    not valid_aprovadores_critical
    erro := "CRÍTICO: Aprovadores devem ser strings não vazias"
}

# =============================================================================
# 🟡 VALIDAÇÕES IMPORTANTES (GERAM WARNINGS)
# =============================================================================

# Estrutura recomendada completa
missing_recommended_structure {
    not input.categorias
}
missing_recommended_structure {
    not input.sla_horas_por_etapa  
}
missing_recommended_structure {
    not input.anexos_min_por_faixa
}
missing_recommended_structure {
    not input.escalonamento
}

# SLA recomendado nas faixas
missing_sla_in_faixas {
    some faixa_id
    faixa := input.limites_por_valor[faixa_id]
    not faixa.sla_horas
}

# Anexos recomendados nas faixas  
missing_anexos_in_faixas {
    some faixa_id
    faixa := input.limites_por_valor[faixa_id]
    not faixa.anexos_min
}

# Aprovadores com nomes suspeitos
suspicious_aprovadores {
    some faixa_id
    faixa := input.limites_por_valor[faixa_id]
    some aprovador
    aprovador := faixa.aprovadores[_]
    not aprovador in ["gerente", "diretor", "cfo", "ceo", "manager", "director", "finance", "admin"]
}

# Categorias extras sem aprovadores adicionais
categoria_extra_incomplete {
    some categoria_id
    categoria := input.categorias[categoria_id]
    categoria.extra == true
    not categoria.aprovadores_adicionais
}

# =============================================================================
# 🟡 WARNINGS (PROBLEMAS IMPORTANTES)
# =============================================================================

warnings[warning] {
    missing_recommended_structure
    warning := "IMPORTANTE: Estrutura incompleta - recomenda-se incluir: categorias, sla_horas_por_etapa, anexos_min_por_faixa, escalonamento"
}

warnings[warning] {
    missing_sla_in_faixas
    warning := "IMPORTANTE: Algumas faixas não têm SLA definido - pode causar demoras na aprovação"
}

warnings[warning] {
    missing_anexos_in_faixas  
    warning := "IMPORTANTE: Algumas faixas não têm anexos obrigatórios definidos - pode gerar aprovações sem documentação adequada"
}

warnings[warning] {
    suspicious_aprovadores
    warning := "IMPORTANTE: Detectados aprovadores com nomes não padrão - verifique se estão corretos"
}

warnings[warning] {
    categoria_extra_incomplete
    warning := "IMPORTANTE: Categorias marcadas como 'extra=true' devem ter aprovadores_adicionais"
}

warnings[warning] {
    some faixa_id
    faixa := input.limites_por_valor[faixa_id]
    faixa.max_valor > 1000000
    warning := sprintf("IMPORTANTE: Faixa '%s' tem valor muito alto (%d) - considere revisar", [faixa_id, faixa.max_valor])
}

warnings[warning] {
    some faixa_id  
    faixa := input.limites_por_valor[faixa_id]
    faixa.sla_horas > 72
    warning := sprintf("IMPORTANTE: Faixa '%s' tem SLA muito longo (%d horas) - pode impactar agilidade", [faixa_id, faixa.sla_horas])
}

warnings[warning] {
    input.categorias.CAPEX
    categoria_capex := input.categorias.CAPEX
    categoria_capex.extra != true
    warning := "IMPORTANTE: Categoria CAPEX deveria ter aprovação extra (extra=true)"
}

# =============================================================================
# 🔵 SUGESTÕES (MELHORIAS RECOMENDADAS)
# =============================================================================

suggestions[suggestion] {
    not input.anexos_min_por_faixa
    suggestion := "RECOMENDADO: Adicione 'anexos_min_por_faixa' para definir documentos obrigatórios por valor"
}

suggestions[suggestion] {
    input.sla_horas_por_etapa
    not input.sla_horas_por_etapa.default
    suggestion := "RECOMENDADO: Defina SLA padrão em 'sla_horas_por_etapa.default' para casos não cobertos"
}

suggestions[suggestion] {
    not input.escalonamento
    suggestion := "RECOMENDADO: Configure 'escalonamento' para definir para onde enviar aprovações em atraso"
}

suggestions[suggestion] {
    count(input.limites_por_valor) == 1
    suggestion := "RECOMENDADO: Configure múltiplas faixas de valor para melhor controle (ex: até 1000, 1000-5000, etc.)"
}

suggestions[suggestion] {
    input.categorias
    not input.categorias.OPEX
    suggestion := "RECOMENDADO: Adicione categoria 'OPEX' para despesas operacionais"
}

suggestions[suggestion] {
    input.categorias
    not input.categorias.CAPEX  
    suggestion := "RECOMENDADO: Adicione categoria 'CAPEX' para investimentos de capital"
}

suggestions[suggestion] {
    some faixa_id
    faixa := input.limites_por_valor[faixa_id]
    count(faixa.aprovadores) == 1
    faixa.max_valor > 10000
    suggestion := sprintf("RECOMENDADO: Faixa '%s' com valor alto deveria ter múltiplos aprovadores", [faixa_id])
}

# =============================================================================
# 🔍 VALIDAÇÕES AUXILIARES PARA REPORTS DETALHADOS
# =============================================================================

# Contagem de problemas para relatórios
count_critical_errors := count([erro | errors[erro]])
count_warnings := count([warning | warnings[warning]]) 
count_suggestions := count([suggestion | suggestions[suggestion]])

# Status geral da política
policy_maturity := "básica" {
    valid
    count_warnings > 3
} else := "intermediária" {
    valid  
    count_warnings <= 3
    count_warnings > 0
} else := "avançada" {
    valid
    count_warnings == 0
} else := "inválida" {
    not valid
}

# Resumo para debugging
validation_summary := {
    "valid": valid,
    "maturity": policy_maturity,
    "critical_errors": count_critical_errors,
    "warnings": count_warnings,
    "suggestions": count_suggestions
}
