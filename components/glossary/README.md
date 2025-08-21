# Sistema de Glossário AppFin v0.5

## 📋 Visão Geral

Sistema inteligente de glossário que detecta automaticamente siglas técnicas no texto e oferece definições detalhadas via tooltips elegantes. Implementado com shadcn/ui e TypeScript.

## 🎯 Funcionalidades

- ✅ **Detecção automática** de siglas (PC, CC, CAPEX, OPEX, SLA, OPA)
- ✅ **Tooltips inteligentes** com definições, exemplos e termos relacionados
- ✅ **Painel completo** com busca e categorização
- ✅ **Hook reutilizável** para integração em todo o app
- ✅ **Responsivo** e acessível

## 🧩 Componentes

### `useGlossary` Hook
```tsx
const { findTerm, highlightText, searchTerms } = useGlossary();
```

### `GlossaryText` Componente
```tsx
<GlossaryText>
  Este PC de CAPEX precisa aprovação do CC conforme SLA.
</GlossaryText>
```

### `GlossaryTooltip` Componente
```tsx
<GlossaryTooltip term={term} relatedTerms={related}>
  <span>PC</span>
</GlossaryTooltip>
```

### `GlossaryPanel` Componente
```tsx
<GlossaryPanel
  showSearch={true}
  defaultCategory="financial"
  compact={false}
/>
```

## 📖 Termos Cobertos

### Financeiro (💰)
- **PC** - Pedido de Compra
- **CC** - Centro de Custo
- **CAPEX** - Capital Expenditure
- **OPEX** - Operational Expenditure

### Processo (📋)
- **SLA** - Service Level Agreement

### Técnico (⚙️)
- **OPA** - Open Policy Agent

## 🚀 Como Usar

### 1. Detecção Automática
```tsx
import { GlossaryText } from '@/components/glossary';

function MyComponent() {
  return (
    <GlossaryText>
      O PC deve seguir as regras de CAPEX do CC.
    </GlossaryText>
  );
}
```

### 2. Tooltip Manual
```tsx
import { useGlossary, GlossaryTooltip } from '@/components/glossary';

function MyComponent() {
  const { findTerm, getRelatedTerms } = useGlossary();
  const term = findTerm('PC');
  const related = getRelatedTerms('PC');

  return (
    <GlossaryTooltip term={term} relatedTerms={related}>
      <span>Pedido de Compra</span>
    </GlossaryTooltip>
  );
}
```

### 3. Painel Completo
```tsx
import { GlossaryPanel } from '@/components/glossary';

function GlossaryPage() {
  return (
    <GlossaryPanel
      showSearch={true}
      defaultCategory="all"
    />
  );
}
```

## 🎨 Personalização

### Categorias
```typescript
type Category = 'financial' | 'technical' | 'process' | 'system';
```

### Configuração de Cores
```typescript
const categoryConfig = {
  financial: { color: 'bg-green-100', icon: '💰' },
  technical: { color: 'bg-blue-100', icon: '⚙️' },
  process: { color: 'bg-purple-100', icon: '📋' },
  system: { color: 'bg-orange-100', icon: '🖥️' }
};
```

## 📁 Estrutura de Arquivos

```
components/glossary/
├── index.ts              # Exports
├── GlossaryText.tsx      # Detecção automática
├── GlossaryTooltip.tsx   # Tooltip inteligente
├── GlossaryPanel.tsx     # Painel completo
└── README.md             # Esta documentação

hooks/
└── useGlossary.ts        # Hook principal

app/glossario/
└── page.tsx              # Página dedicada
```

## 🔧 Dependências

- **@radix-ui/react-hover-card** - Tooltips
- **@radix-ui/react-tabs** - Navegação por categorias
- **lucide-react** - Ícones
- **shadcn/ui** - Componentes base

## 🎯 Integração com Tour

O glossário está integrado ao sistema de tour guiado e pode ser acessado via:
- Link na navegação principal (📖 Glossário)
- Página dedicada `/glossario`
- Detecção automática em todos os textos

## 📈 Próximas Melhorias

- [ ] Adicionar mais termos técnicos
- [ ] Integração com IA para definições dinâmicas
- [ ] Histórico de termos consultados
- [ ] Feedback de usuário sobre definições
- [ ] Exportação de glossário em PDF
