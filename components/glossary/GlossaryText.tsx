'use client';

import { useGlossary } from '@/hooks/useGlossary';
import { cn } from '@/lib/utils';
import { Fragment, ReactNode } from 'react';
import { GlossaryTooltip } from './GlossaryTooltip';

interface GlossaryTextProps {
  children: ReactNode;
  className?: string;
  enableGlossary?: boolean;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * Componente que automaticamente detecta e adiciona tooltips para siglas técnicas
 *
 * @example
 * ```tsx
 * <GlossaryText>
 *   Este PC de CAPEX precisa aprovação do CC de TI conforme SLA do OPA.
 * </GlossaryText>
 * ```
 */
export function GlossaryText({
  children,
  className,
  enableGlossary = true,
  tooltipSide = 'top'
}: GlossaryTextProps) {
  const { findTerm, getRelatedTerms, highlightText } = useGlossary();

  // Se glossário desabilitado, renderizar normalmente
  if (!enableGlossary) {
    return <span className={className}>{children}</span>;
  }

  // Processar apenas strings de texto
  const processTextNode = (text: string): ReactNode[] => {
    const { text: processedText, hasTerms } = highlightText(text);

    if (!hasTerms) {
      return [text];
    }

    // Dividir por marcadores de glossário
    const parts = processedText.split(/(__GLOSSARY_START__|__GLOSSARY_END__)/);
    const result: ReactNode[] = [];
    let isInGlossaryTerm = false;
    let currentTermAcronym = '';

    parts.forEach((part, index) => {
      if (part === '__GLOSSARY_START__') {
        isInGlossaryTerm = true;
        return;
      }

      if (part === '__GLOSSARY_END__') {
        isInGlossaryTerm = false;
        if (currentTermAcronym) {
          const term = findTerm(currentTermAcronym);
          const relatedTerms = getRelatedTerms(currentTermAcronym);

          if (term) {
            result.push(
              <GlossaryTooltip
                key={`${currentTermAcronym}-${index}`}
                term={term}
                relatedTerms={relatedTerms}
                side={tooltipSide}
              >
                {currentTermAcronym}
              </GlossaryTooltip>
            );
          } else {
            result.push(currentTermAcronym);
          }
          currentTermAcronym = '';
        }
        return;
      }

      if (isInGlossaryTerm) {
        currentTermAcronym = part;
      } else {
        result.push(part);
      }
    });

    return result;
  };

  // Processar children recursivamente
  const processChildren = (node: ReactNode): ReactNode => {
    if (typeof node === 'string') {
      const processed = processTextNode(node);
      return processed.length === 1 ? processed[0] : <Fragment>{processed}</Fragment>;
    }

    if (typeof node === 'number') {
      return node;
    }

    if (node == null || typeof node === 'boolean') {
      return node;
    }

    // Para React elements
    if (typeof node === 'object' && 'type' in node && 'props' in node) {
      const element = node as React.ReactElement;

      // Se tem children, processar recursivamente
      if (element.props?.children) {
        const processedChildren = Array.isArray(element.props.children)
          ? element.props.children.map((child: ReactNode) => processChildren(child))
          : processChildren(element.props.children);

        return {
          ...element,
          props: {
            ...element.props,
            children: processedChildren
          }
        };
      }
    }

    return node;
  };

  const processedChildren = processChildren(children);

  return (
    <span className={cn("glossary-text", className)}>
      {processedChildren}
    </span>
  );
}

export default GlossaryText;
