'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlossaryTerm, useGlossary } from '@/hooks/useGlossary';
import { cn } from '@/lib/utils';
import {
    BookOpen,
    ExternalLink,
    Filter,
    Lightbulb,
    Search,
    Tag
} from 'lucide-react';
import { useState } from 'react';

interface GlossaryPanelProps {
  className?: string;
  defaultCategory?: GlossaryTerm['category'] | 'all';
  showSearch?: boolean;
  compact?: boolean;
}

const categoryConfig = {
  all: { icon: '📖', label: 'Todos', color: 'bg-gray-100 text-gray-800' },
  financial: { icon: '💰', label: 'Financeiro', color: 'bg-green-100 text-green-800' },
  technical: { icon: '⚙️', label: 'Técnico', color: 'bg-blue-100 text-blue-800' },
  process: { icon: '📋', label: 'Processo', color: 'bg-purple-100 text-purple-800' },
  system: { icon: '🖥️', label: 'Sistema', color: 'bg-orange-100 text-orange-800' }
};

/**
 * Painel completo do glossário com busca e categorização
 *
 * @example
 * ```tsx
 * <GlossaryPanel
 *   defaultCategory="financial"
 *   showSearch={true}
 * />
 * ```
 */
export function GlossaryPanel({
  className,
  defaultCategory = 'all',
  showSearch = true,
  compact = false
}: GlossaryPanelProps) {
  const {
    terms,
    searchTerms,
    getTermsByCategory,
    getRelatedTerms
  } = useGlossary();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    GlossaryTerm['category'] | 'all'
  >(defaultCategory);

  // Filtrar termos baseado na busca e categoria
  const filteredTerms = (() => {
    let filtered = terms;

    // Filtrar por categoria
    if (selectedCategory !== 'all') {
      filtered = getTermsByCategory(selectedCategory);
    }

    // Filtrar por busca
    if (searchQuery.trim()) {
      const searchResults = searchTerms(searchQuery);
      filtered = filtered.filter(term =>
        searchResults.some(result => result.acronym === term.acronym)
      );
    }

    return filtered;
  })();

  const TermCard = ({ term }: { term: GlossaryTerm }) => {
    const relatedTerms = getRelatedTerms(term.acronym);
    const categoryInfo = categoryConfig[term.category];

    return (
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className={cn("pb-3", compact && "pb-2")}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className={cn("text-lg", compact && "text-base")}>
                <span className="font-bold text-blue-600">{term.acronym}</span>
                <span className="text-gray-500 ml-2 font-normal">
                  {term.fullName}
                </span>
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-xs", categoryInfo.color)}>
                  {categoryInfo.icon} {categoryInfo.label}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className={cn("pt-0 space-y-3", compact && "space-y-2")}>
          {/* Definition */}
          <CardDescription className={cn("text-sm leading-relaxed", compact && "text-xs")}>
            {term.definition}
          </CardDescription>

          {/* Examples */}
          {!compact && term.examples && term.examples.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Exemplos
                </span>
              </div>
              <ul className="space-y-1">
                {term.examples.slice(0, 2).map((example, index) => (
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
                  Relacionados
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {relatedTerms.slice(0, compact ? 2 : 4).map((relatedTerm) => (
                  <Badge
                    key={relatedTerm.acronym}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => setSearchQuery(relatedTerm.acronym)}
                  >
                    {relatedTerm.acronym}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Documentation Link */}
          {!compact && term.documentationLink && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between text-xs h-8"
              asChild
            >
              <a
                href={term.documentationLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-3 h-3" />
                  Documentação
                </span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className={cn("text-2xl font-bold text-gray-900", compact && "text-xl")}>
              Glossário Técnico
            </h2>
            <p className={cn("text-gray-600", compact && "text-sm")}>
              Definições dos termos utilizados no AppFin
            </p>
          </div>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar termos, definições ou exemplos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <Tabs
        value={selectedCategory}
        onValueChange={(value) => setSelectedCategory(value as typeof selectedCategory)}
      >
        <TabsList className="grid w-full grid-cols-5">
          {Object.entries(categoryConfig).map(([key, config]) => (
            <TabsTrigger
              key={key}
              value={key}
              className="text-xs"
            >
              <span className="mr-1">{config.icon}</span>
              {config.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(categoryConfig).map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {filteredTerms.length} {filteredTerms.length === 1 ? 'termo' : 'termos'}
                {searchQuery && ` para "${searchQuery}"`}
              </span>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="text-xs"
                >
                  Limpar busca
                </Button>
              )}
            </div>

            {/* Terms Grid */}
            <div className={cn(
              "grid gap-4",
              compact ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
            )}>
              {filteredTerms.map((term) => (
                <TermCard key={term.acronym} term={term} />
              ))}
            </div>

            {/* No Results */}
            {filteredTerms.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum termo encontrado</p>
                {searchQuery && (
                  <Button
                    variant="link"
                    onClick={() => setSearchQuery('')}
                    className="mt-2"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default GlossaryPanel;
