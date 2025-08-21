'use client';

import { GlossaryPanel, GlossaryText } from '@/components/glossary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowLeft,
    BookOpen,
    Lightbulb,
    Target,
    Users,
    Zap
} from 'lucide-react';
import Link from 'next/link';

export default function GlossarioPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">
                Glossário AppFin
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Domine os termos técnicos e siglas utilizados no sistema de aprovação de pedidos corporativo
            </p>
          </div>
        </div>

        {/* Quick Guide */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Termos Essenciais</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <GlossaryText>
                <p className="text-gray-600">
                  Aprenda sobre PC, CC, CAPEX, OPEX e outros termos fundamentais para o dia a dia.
                </p>
              </GlossaryText>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Recursos Técnicos</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <GlossaryText>
                <p className="text-gray-600">
                  Entenda como OPA e SLA funcionam no fluxo de aprovações automáticas.
                </p>
              </GlossaryText>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Para Toda Equipe</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Linguagem comum para gestores, aprovadores e usuários finais.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Como Usar */}
        <Card className="mb-8 border-0 shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lightbulb className="w-6 h-6 text-amber-500" />
              <CardTitle>Como usar o glossário?</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-gray-900">
                  📖 No sistema
                </h4>
                <GlossaryText>
                  <p className="text-gray-700 leading-relaxed">
                    Siglas como PC, CC, CAPEX, OPEX, SLA e OPA aparecem automaticamente
                    sublinhadas em todo o sistema. Passe o mouse sobre elas para ver
                    definições detalhadas e exemplos práticos.
                  </p>
                </GlossaryText>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-gray-900">
                  🔍 Nesta página
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  Use a busca para encontrar termos específicos ou navegue pelas
                  categorias: Financeiro, Técnico, Processo e Sistema. Clique em
                  termos relacionados para navegar entre conceitos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Glossário Principal */}
        <GlossaryPanel showSearch={true} defaultCategory="all" />

        {/* Footer */}
        <div className="mt-12 text-center">
          <Card className="border-0 shadow-md bg-gray-900 text-white">
            <CardContent className="py-8">
              <h3 className="text-xl font-semibold mb-2">
                Dúvidas sobre algum termo?
              </h3>
              <p className="text-gray-300 mb-4">
                Nossa equipe está sempre disponível para esclarecer conceitos e processos.
              </p>
              <Button variant="secondary" asChild>
                <Link href="/chat">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Perguntar ao Chat IA
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
