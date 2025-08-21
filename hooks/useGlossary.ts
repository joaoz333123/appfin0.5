'use client';

import { useMemo, useState } from 'react';

// Interface para definição de termos do glossário
export interface GlossaryTerm {
  term: string;
  acronym: string;
  definition: string;
  fullName: string;
  category: 'financial' | 'technical' | 'process' | 'system';
  examples?: string[];
  relatedTerms?: string[];
  documentationLink?: string;
}

// Base de dados de termos técnicos do AppFin
const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'PC',
    acronym: 'PC',
    fullName: 'Pedido de Compra',
    definition: 'Documento formal que registra uma solicitação de aquisição de bens ou serviços, contendo valor, categoria, centro de custo e aprovadores necessários.',
    category: 'process',
    examples: [
      'PC de equipamentos de TI',
      'PC para serviços de marketing',
      'PC de material de escritório'
    ],
    relatedTerms: ['CC', 'CAPEX', 'OPEX'],
    documentationLink: '/docs/pedidos'
  },
  {
    term: 'CC',
    acronym: 'CC',
    fullName: 'Centro de Custo',
    definition: 'Unidade organizacional responsável por controlar e alocar despesas específicas, permitindo rastreamento de gastos por departamento ou projeto.',
    category: 'financial',
    examples: [
      'CC TI - Tecnologia da Informação',
      'CC MKT - Marketing',
      'CC RH - Recursos Humanos',
      'CC ADM - Administrativo'
    ],
    relatedTerms: ['PC', 'CAPEX', 'OPEX'],
    documentationLink: '/docs/centros-custo'
  },
  {
    term: 'CAPEX',
    acronym: 'CAPEX',
    fullName: 'Capital Expenditure',
    definition: 'Investimento em bens de capital que agregam valor duradouro à empresa, como equipamentos, infraestrutura e tecnologia com vida útil superior a um ano.',
    category: 'financial',
    examples: [
      'Compra de servidores',
      'Aquisição de veículos',
      'Investimento em software',
      'Reforma de instalações'
    ],
    relatedTerms: ['OPEX', 'PC', 'CC'],
    documentationLink: '/docs/tipos-despesa'
  },
  {
    term: 'OPEX',
    acronym: 'OPEX',
    fullName: 'Operational Expenditure',
    definition: 'Despesas operacionais recorrentes necessárias para manter o funcionamento diário da empresa, como salários, aluguel e material de consumo.',
    category: 'financial',
    examples: [
      'Salários e benefícios',
      'Aluguel de escritório',
      'Material de escritório',
      'Licenças de software'
    ],
    relatedTerms: ['CAPEX', 'PC', 'CC'],
    documentationLink: '/docs/tipos-despesa'
  },
  {
    term: 'SLA',
    acronym: 'SLA',
    fullName: 'Service Level Agreement',
    definition: 'Acordo que define prazos máximos para cada etapa do processo de aprovação, garantindo agilidade e previsibilidade no fluxo de pedidos.',
    category: 'process',
    examples: [
      'SLA de 2 dias para aprovação gerencial',
      'SLA de 5 dias para aprovação diretoria',
      'SLA de 1 dia para pedidos até R$ 1.000'
    ],
    relatedTerms: ['PC', 'OPA'],
    documentationLink: '/docs/sla'
  },
  {
    term: 'OPA',
    acronym: 'OPA',
    fullName: 'Open Policy Agent',
    definition: 'Motor de políticas que automatiza decisões de aprovação baseado em regras configuráveis, considerando valor, categoria, centro de custo e hierarquia.',
    category: 'technical',
    examples: [
      'Aprovação automática para valores baixos',
      'Roteamento por hierarquia',
      'Validação de políticas de compra'
    ],
    relatedTerms: ['PC', 'SLA'],
    documentationLink: '/docs/opa'
  }
];

export interface UseGlossaryReturn {
  terms: GlossaryTerm[];
  findTerm: (acronym: string) => GlossaryTerm | undefined;
  searchTerms: (query: string) => GlossaryTerm[];
  getTermsByCategory: (category: GlossaryTerm['category']) => GlossaryTerm[];
  highlightText: (text: string) => { text: string; hasTerms: boolean };
  getRelatedTerms: (acronym: string) => GlossaryTerm[];
}

/**
 * Hook para gerenciar glossário de termos técnicos do AppFin
 *
 * @example
 * ```tsx
 * const { findTerm, highlightText } = useGlossary();
 * const term = findTerm('PC');
 * const highlighted = highlightText('Este PC precisa de aprovação');
 * ```
 */
export function useGlossary(): UseGlossaryReturn {
  const [terms] = useState<GlossaryTerm[]>(GLOSSARY_TERMS);

  // Encontrar termo por sigla
  const findTerm = useMemo(
    () => (acronym: string): GlossaryTerm | undefined => {
      return terms.find(
        term => term.acronym.toLowerCase() === acronym.toLowerCase()
      );
    },
    [terms]
  );

  // Buscar termos por query
  const searchTerms = useMemo(
    () => (query: string): GlossaryTerm[] => {
      if (!query.trim()) return [];

      const lowerQuery = query.toLowerCase();
      return terms.filter(
        term =>
          term.acronym.toLowerCase().includes(lowerQuery) ||
          term.fullName.toLowerCase().includes(lowerQuery) ||
          term.definition.toLowerCase().includes(lowerQuery)
      );
    },
    [terms]
  );

  // Filtrar por categoria
  const getTermsByCategory = useMemo(
    () => (category: GlossaryTerm['category']): GlossaryTerm[] => {
      return terms.filter(term => term.category === category);
    },
    [terms]
  );

  // Destacar termos no texto
  const highlightText = useMemo(
    () => (text: string): { text: string; hasTerms: boolean } => {
      let processedText = text;
      let hasTerms = false;

      // Criar regex para encontrar siglas (maiúsculas, 2-5 caracteres)
      const acronymRegex = /\b[A-Z]{2,5}\b/g;
      const matches = text.match(acronymRegex);

      if (matches) {
        const uniqueMatches = [...new Set(matches)];

        uniqueMatches.forEach(match => {
          const term = findTerm(match);
          if (term) {
            hasTerms = true;
            // Marcar para processamento posterior pelo GlossaryText
            processedText = processedText.replace(
              new RegExp(`\\b${match}\\b`, 'g'),
              `__GLOSSARY_START__${match}__GLOSSARY_END__`
            );
          }
        });
      }

      return { text: processedText, hasTerms };
    },
    [findTerm]
  );

  // Obter termos relacionados
  const getRelatedTerms = useMemo(
    () => (acronym: string): GlossaryTerm[] => {
      const term = findTerm(acronym);
      if (!term || !term.relatedTerms) return [];

      return term.relatedTerms
        .map(relatedAcronym => findTerm(relatedAcronym))
        .filter((relatedTerm): relatedTerm is GlossaryTerm => !!relatedTerm);
    },
    [findTerm]
  );

  return {
    terms,
    findTerm,
    searchTerms,
    getTermsByCategory,
    highlightText,
    getRelatedTerms
  };
}

export default useGlossary;
