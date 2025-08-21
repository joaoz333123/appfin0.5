'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import { GlossaryTerm } from '@/hooks/useGlossary';
import { cn } from '@/lib/utils';
import {
    ArrowRight,
    BookOpen,
    Lightbulb,
    Tag
} from 'lucide-react';
import { ReactNode } from 'react';

interface GlossaryTooltipProps {
  term: GlossaryTerm;
  children: ReactNode;
  relatedTerms?: GlossaryTerm[];
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

const categoryConfig = {
  financial: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '💰',
    label: 'Financeiro'
  },
  technical: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '⚙️',
    label: 'Técnico'
  },
  process: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '📋',
    label: 'Processo'
  },
  system: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '🖥️',
    label: 'Sistema'
  }
};

/**
 * Componente de tooltip inteligente para termos do glossário
 *
 * @example
 * ```tsx
 * <GlossaryTooltip term={pcTerm}>
 *   <span className="underline decoration-dotted">PC</span>
 * </GlossaryTooltip>
 * ```
 */
export function GlossaryTooltip({
  term,
  children,
  relatedTerms = [],
  className,
  side = 'top'
}: GlossaryTooltipProps) {
  const categoryInfo = categoryConfig[term.category];

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span
          className={cn(
            "cursor-help underline decoration-dotted decoration-gray-400 hover:decoration-blue-500 transition-colors",
            className
          )}
        >
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        className="w-96 p-0 shadow-lg border-0 bg-white rounded-xl overflow-hidden"
        side={side}
        sideOffset={8}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 text-lg">
                  {term.acronym}
                </h4>
                <Badge
                  variant="outline"
                  className={cn("text-xs", categoryInfo.color)}
                >
                  {categoryInfo.icon} {categoryInfo.label}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 font-medium">
                {term.fullName}
              </p>
            </div>
            <BookOpen className="w-5 h-5 text-blue-500 flex-shrink-0" />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Definition */}
          <div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {term.definition}
            </p>
          </div>

          {/* Examples */}
          {term.examples && term.examples.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Exemplos
                </span>
              </div>
              <ul className="space-y-1">
                {term.examples.slice(0, 3).map((example, index) => (
                  <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Terms */}
          {relatedTerms.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Termos Relacionados
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {relatedTerms.slice(0, 4).map((relatedTerm) => (
                  <Badge
                    key={relatedTerm.acronym}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    {relatedTerm.acronym}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {term.documentationLink && (
          <div className="border-t bg-gray-50 px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs h-8 hover:bg-blue-50"
              asChild
            >
              <a
                href={term.documentationLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-3 h-3" />
                  Ver documentação completa
                </span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </Button>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

export default GlossaryTooltip;
