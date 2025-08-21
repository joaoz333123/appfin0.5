# Sistema de Tour Guiado - AppFin v0.5

Um sistema completo de tour guiado para novos usuários do AppFin, implementado com `react-joyride` e estilizado com shadcn/ui.

## Funcionalidades

- ✅ Tour guiado em 5 etapas principais
- ✅ Persistência do estado no localStorage
- ✅ Botão "Refazer Tour" no header
- ✅ Auto-início para novos usuários
- ✅ Estilo compatível com shadcn/ui
- ✅ Possibilidade de pular etapas
- ✅ Controle completo de navegação

## Componentes

### `useTour` Hook
Hook principal para gerenciar o estado do tour.

```tsx
const {
  tourState,
  startTour,
  stopTour,
  restartTour,
  completeTour,
  shouldShowTour
} = useTour();
```

### `TourGuide` Component
Componente principal que renderiza o tour usando react-joyride.

```tsx
<TourGuide autoStart={true} />
```

### `TourButton` Component
Botão reutilizável para iniciar/reiniciar o tour.

```tsx
<TourButton variant="outline" size="default" />
```

## Etapas do Tour

1. **Página inicial** - Visão geral do sistema
2. **IA Assistente** - Primeiro passo recomendado
3. **Novo PC** - Como criar pedidos
4. **Inbox** - Onde aprovar pedidos
5. **Chat Gemini** - Funcionalidades avançadas

## Classes CSS Necessárias

Para que o tour funcione corretamente, adicione estas classes aos elementos:

- `.tour-home-overview` - Seção principal da página inicial
- `.tour-ia-assistente` - Botão/link da IA Assistente
- `.tour-novo-pc` - Botão/link Novo PC
- `.tour-inbox` - Botão/link Inbox
- `.tour-chat` - Botão/link Chat

## Uso

### 1. Importar os componentes

```tsx
import { TourGuide, TourButton } from '@/components/tour';
```

### 2. Adicionar o TourGuide à página

```tsx
export default function Page() {
  return (
    <div>
      {/* Seu conteúdo */}
      <TourGuide autoStart={true} />
    </div>
  );
}
```

### 3. Adicionar o TourButton ao header

```tsx
<TourButton variant="outline" />
```

### 4. Adicionar classes CSS aos elementos

```tsx
<Button className="tour-ia-assistente">IA Assistente</Button>
<section className="tour-home-overview">
  {/* Conteúdo principal */}
</section>
```

## Personalização

### Modificar as etapas

Edite o array `tourSteps` em `hooks/useTour.ts`:

```tsx
const tourSteps: TourStep[] = [
  {
    id: 'custom-step',
    target: '.custom-class',
    title: 'Título personalizado',
    content: 'Descrição personalizada',
    placement: 'bottom',
  },
  // mais etapas...
];
```

### Customizar estilos

Os estilos são definidos no objeto `joyrideStyles` em `TourGuide.tsx`, seguindo o design system do shadcn/ui.

## Características Técnicas

- **Framework**: React 18+ com TypeScript
- **Biblioteca**: react-joyride
- **Design System**: shadcn/ui + Tailwind CSS
- **Persistência**: localStorage
- **Ícones**: lucide-react
- **Responsivo**: Totalmente responsivo
- **Acessibilidade**: Suporte a navegação por teclado
