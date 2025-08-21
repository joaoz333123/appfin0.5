'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Building,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';

export default function PoliticaPage() {
  const [step, setStep] = useState(1);
  const [politica, setPolitica] = useState<any>(null);
  const [simulacao, setSimulacao] = useState<any[]>([]);

  const perguntas = [
    {
      id: 1,
      titulo: 'Centros de Custo',
      descricao: 'Quais são os principais centros de custo da sua empresa?',
      icon: Building,
      campos: ['ADM', 'TI', 'MARKETING', 'RH', 'FINANCEIRO', 'OPERACIONAL'],
    },
    {
      id: 2,
      titulo: 'Categorias de Compra',
      descricao: 'Quais categorias de compra você utiliza?',
      icon: FileText,
      campos: [
        'OPEX',
        'CAPEX',
        'TI',
        'MARKETING',
        'RH',
        'FINANCEIRO',
        'OPERACIONAL',
      ],
    },
    {
      id: 3,
      titulo: 'Faixas de Valor',
      descricao: 'Defina as faixas de valor para aprovação',
      icon: DollarSign,
      campos: [
        'Até R$ 1.000',
        'R$ 1.000 - R$ 5.000',
        'R$ 5.000 - R$ 25.000',
        'Acima de R$ 25.000',
      ],
    },
    {
      id: 4,
      titulo: 'Aprovadores',
      descricao: 'Quem aprova cada faixa de valor?',
      icon: Users,
      campos: ['Gerente', 'Diretor', 'CFO', 'CEO'],
    },
    {
      id: 5,
      titulo: 'SLA por Etapa',
      descricao: 'Qual o prazo máximo para cada etapa?',
      icon: Clock,
      campos: ['4 horas', '8 horas', '24 horas', '48 horas'],
    },
  ];

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Gerar política
      const politicaGerada = {
        limites_por_valor: {
          ate_1000: {
            max_valor: 1000,
            aprovadores: ['gerente'],
            sla_horas: 4,
            anexos_min: ['descricao'],
          },
          '1000_5000': {
            max_valor: 5000,
            aprovadores: ['gerente', 'diretor'],
            sla_horas: 8,
            anexos_min: ['descricao', 'cotacao'],
          },
          '5000_25000': {
            max_valor: 25000,
            aprovadores: ['diretor', 'cfo'],
            sla_horas: 24,
            anexos_min: ['descricao', 'cotacao', 'justificativa'],
          },
          acima_25000: {
            max_valor: 999999,
            aprovadores: ['cfo', 'ceo'],
            sla_horas: 48,
            anexos_min: [
              'descricao',
              'cotacao',
              'justificativa',
              'proposta_tecnica',
            ],
          },
        },
        categorias: {
          CAPEX: {
            extra: true,
            aprovadores_adicionais: ['cfo'],
            sla_extra: 24,
          },
        },
        sla_horas_por_etapa: {
          gerente: 4,
          diretor: 8,
          cfo: 24,
          ceo: 48,
        },
        anexos_min_por_faixa: {
          ate_1000: ['descricao'],
          '1000_5000': ['descricao', 'cotacao'],
          '5000_25000': ['descricao', 'cotacao', 'justificativa'],
          acima_25000: [
            'descricao',
            'cotacao',
            'justificativa',
            'proposta_tecnica',
          ],
        },
        escalonamento: {
          gerente: 'diretor',
          diretor: 'cfo',
          cfo: 'ceo',
        },
      };

      setPolitica(politicaGerada);
      setStep(6); // Simulação
    }
  };

  const handleSimular = async () => {
    // Simular 10 cenários
    const cenarios = [
      { titulo: 'Notebook para TI', categoria: 'TI', valor: 3500, cc: 'TI' },
      {
        titulo: 'Mobiliário para escritório',
        categoria: 'OPEX',
        valor: 800,
        cc: 'ADM',
      },
      {
        titulo: 'Software de CRM',
        categoria: 'CAPEX',
        valor: 15000,
        cc: 'MARKETING',
      },
      {
        titulo: 'Material de escritório',
        categoria: 'OPEX',
        valor: 300,
        cc: 'ADM',
      },
      {
        titulo: 'Servidor para TI',
        categoria: 'CAPEX',
        valor: 50000,
        cc: 'TI',
      },
      {
        titulo: 'Campanha de marketing',
        categoria: 'MARKETING',
        valor: 12000,
        cc: 'MARKETING',
      },
      {
        titulo: 'Treinamento para equipe',
        categoria: 'RH',
        valor: 8000,
        cc: 'RH',
      },
      {
        titulo: 'Consultoria financeira',
        categoria: 'FINANCEIRO',
        valor: 30000,
        cc: 'FINANCEIRO',
      },
      {
        titulo: 'Equipamento de produção',
        categoria: 'CAPEX',
        valor: 75000,
        cc: 'OPERACIONAL',
      },
      {
        titulo: 'Licenças de software',
        categoria: 'TI',
        valor: 2500,
        cc: 'TI',
      },
    ];

    setSimulacao(cenarios);
    setStep(7); // Resultado da simulação
  };

  const handlePublicar = async () => {
    // Salvar política no banco
    try {
      const response = await fetch('/api/politicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ politica, versao: 'v1' }),
      });

      if (response.ok) {
        setStep(8); // Sucesso
      }
    } catch (error) {
      console.error('Erro ao salvar política:', error);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Configurar Política de Aprovação
          </h1>
          <p className='text-gray-600'>
            A IA vai te ajudar a criar as regras do seu processo de aprovação
          </p>
        </div>

        {/* Progress */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <div key={s} className='flex items-center'>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    s <= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 8 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      s < step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        {step <= 5 && (
          <Card>
            <CardHeader>
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                  {React.createElement(perguntas[step - 1].icon, {
                    className: 'w-6 h-6 text-blue-600',
                  })}
                </div>
                <div>
                  <CardTitle>{perguntas[step - 1].titulo}</CardTitle>
                  <CardDescription>
                    {perguntas[step - 1].descricao}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <>
              <div className='grid grid-cols-2 gap-4'>
                {perguntas[step - 1].campos.map(campo => (
                  <div
                    key={campo}
                    className='p-4 border rounded-lg hover:bg-gray-50 cursor-pointer'
                  >
                    <div className='font-medium'>{campo}</div>
                  </div>
                ))}
              </div>
              <div className='mt-6 flex justify-end'>
                <Button onClick={handleNext}>Próximo</Button>
              </div>
            </>
          </Card>
        )}

        {step === 6 && (
          <Card>
            <CardHeader>
              <CardTitle>Política Gerada</CardTitle>
              <CardDescription>
                A IA criou sua política baseada nas suas respostas. Vamos
                simular alguns cenários?
              </CardDescription>
            </CardHeader>
            <>
              <div className='space-y-4'>
                <div className='p-4 bg-green-50 rounded-lg'>
                  <div className='flex items-center space-x-2'>
                    <CheckCircle className='w-5 h-5 text-green-600' />
                    <span className='font-medium text-green-800'>
                      Política criada com sucesso!
                    </span>
                  </div>
                </div>
                <Button onClick={handleSimular} className='w-full'>
                  Simular 10 Cenários
                </Button>
              </div>
            </>
          </Card>
        )}

        {step === 7 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado da Simulação</CardTitle>
              <CardDescription>
                Veja como sua política se comporta em cenários reais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {simulacao.map((cenario, index) => (
                  <div key={index} className='p-4 border rounded-lg'>
                    <div className='flex justify-between items-start'>
                      <div>
                        <div className='font-medium'>{cenario.titulo}</div>
                        <div className='text-sm text-gray-600'>
                          {cenario.categoria} • {cenario.cc} • R${' '}
                          {cenario.valor.toLocaleString()}
                        </div>
                      </div>
                      <Badge variant='outline'>
                        {cenario.valor <= 1000
                          ? 'Gerente'
                          : cenario.valor <= 5000
                            ? 'Diretor'
                            : cenario.valor <= 25000
                              ? 'CFO'
                              : 'CEO'}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button onClick={handlePublicar} className='w-full'>
                  Publicar Política
                </Button>
              </div>
            </CardContent>
            </Card>
        )}

        {step === 8 && (
          <Card>
            <CardHeader>
              <CardTitle>Política Publicada!</CardTitle>
              <CardDescription>
                Sua política está ativa e pronta para uso
              </CardDescription>
            </CardHeader>
            <CardContent className='text-center space-y-4'>
                <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto'>
                  <CheckCircle className='w-8 h-8 text-green-600' />
                </div>
                <div>
                  <div className='font-medium text-lg'>Política v1 ativada</div>
                  <div className='text-gray-600'>
                    Agora você pode criar pedidos de compra
                  </div>
                </div>
                <Button asChild>
                  <a href='/pc/novo'>Criar Primeiro Pedido</a>
                </Button>
            </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
