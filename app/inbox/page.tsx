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
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  Inbox,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Pedido {
  id: string;
  titulo: string;
  categoria: string;
  cc: string;
  valor: number;
  estado: string;
  solicitante: string;
  criado_em: string;
  resumo_ia: string;
  sla_restante: string;
  proximo_aprovador: string;
  anexos: number;
}

export default function InboxPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [notificacoesCount, setNotificacoesCount] = useState(0);

  useEffect(() => {
    // Carregar pedidos e notificações
    const carregarDados = async () => {
      try {
        // Simular carregamento de pedidos
        const mockPedidos: Pedido[] = [
          {
            id: '1',
            titulo: 'Notebook para equipe de TI',
            categoria: 'TI',
            cc: 'TI',
            valor: 3500,
            estado: 'em_aprovacao',
            solicitante: 'João Silva',
            criado_em: '2024-01-15T10:30:00Z',
            resumo_ia:
              'Pedido de notebook Dell Latitude 5520 para desenvolvedor. Inclui cotação de 3 fornecedores. Valor dentro do orçamento aprovado.',
            sla_restante: '2h 30min',
            proximo_aprovador: 'Você (Gerente)',
            anexos: 3,
          },
          {
            id: '2',
            titulo: 'Software de CRM',
            categoria: 'CAPEX',
            cc: 'MARKETING',
            valor: 15000,
            estado: 'em_aprovacao',
            solicitante: 'Maria Santos',
            criado_em: '2024-01-14T14:20:00Z',
            resumo_ia:
              'Implementação de CRM Salesforce para equipe de vendas. Proposta técnica detalhada anexada. ROI esperado de 300% em 12 meses.',
            sla_restante: '18h 45min',
            proximo_aprovador: 'CFO',
            anexos: 5,
          },
          {
            id: '3',
            titulo: 'Mobiliário para escritório',
            categoria: 'OPEX',
            cc: 'ADM',
            valor: 800,
            estado: 'em_aprovacao',
            solicitante: 'Pedro Costa',
            criado_em: '2024-01-15T09:15:00Z',
            resumo_ia:
              'Cadeira ergonômica para novo funcionário. Cotação única de fornecedor credenciado. Valor abaixo do limite de aprovação.',
            sla_restante: '1h 15min',
            proximo_aprovador: 'Você (Gerente)',
            anexos: 1,
          },
        ];

        // Carregar notificações
        const notifResponse = await fetch('/api/notificacoes');
        if (notifResponse.ok) {
          const { notificacoes: notifData } = await notifResponse.json();
          setNotificacoes(notifData);
          setNotificacoesCount(notifData.length);
        }

        setTimeout(() => {
          setPedidos(mockPedidos);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const handleAprovar = async (pedidoId: string) => {
    try {
      const response = await fetch(`/api/pedidos/${pedidoId}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aprovador_id: 'user123', // TODO: pegar do usuário logado
          papel_aprovador: 'gerente', // TODO: pegar do usuário logado
          comentario: 'Aprovado conforme política',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Pedido aprovado:', result);
        setPedidos(prev => prev.filter(p => p.id !== pedidoId));
        setSelectedPedido(null);
      } else {
        const _error = await response.json();
        console.error('Erro ao aprovar:', error);
        alert('Erro ao aprovar: ' + (error.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('Erro ao aprovar pedido');
    }
  };

  const handleReprovar = async (pedidoId: string, motivo: string) => {
    try {
      const response = await fetch(`/api/pedidos/${pedidoId}/reprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aprovador_id: 'user123', // TODO: pegar do usuário logado
          papel_aprovador: 'gerente', // TODO: pegar do usuário logado
          motivo: motivo,
          sugestoes: 'Verifique os requisitos e tente novamente',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Pedido reprovado:', result);
        setPedidos(prev => prev.filter(p => p.id !== pedidoId));
        setSelectedPedido(null);
      } else {
        const _error = await response.json();
        console.error('Erro ao reprovar:', error);
        alert('Erro ao reprovar: ' + (error.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao reprovar:', error);
      alert('Erro ao reprovar pedido');
    }
  };

  const handleMarcarNotificacaoComoLida = async (notificacaoId: string) => {
    try {
      const response = await fetch('/api/notificacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificacao_id: notificacaoId }),
      });

      if (response.ok) {
        setNotificacoes(prev => prev.filter(n => n.id !== notificacaoId));
        setNotificacoesCount(prev => prev - 1);
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const getEstado = (estado: string) => {
    switch (estado) {
      case 'em_aprovacao':
        return (
          <Badge variant='outline' className='text-blue-600 border-blue-600'>
            Em Aprovação
          </Badge>
        );
      case 'aprovado':
        return <Badge className='bg-green-600'>Aprovado</Badge>;
      case 'reprovado':
        return <Badge variant='destructive'>Reprovado</Badge>;
      default:
        return <Badge variant='outline'>Rascunho</Badge>;
    }
  };

  const getSLAStatus = (sla: string) => {
    const horas = parseInt(sla.split('h')[0]);
    if (horas < 2) {
      return <Badge variant='destructive'>Urgente</Badge>;
    } else if (horas < 8) {
      return <Badge className='bg-orange-600'>Atenção</Badge>;
    } else {
      return <Badge variant='outline'>Normal</Badge>;
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                Inbox de Aprovações
              </h1>
              <p className='text-gray-600'>
                {pedidos.length} pedidos aguardando sua aprovação
              </p>
            </div>
            <div className='flex items-center space-x-4'>
              {notificacoesCount > 0 && (
                <div className='relative'>
                  <Badge className='bg-red-600'>
                    {notificacoesCount} notificação
                    {notificacoesCount > 1 ? 's' : ''}
                  </Badge>
                </div>
              )}
              <Button asChild>
                <a href='/pc/novo'>Novo Pedido</a>
              </Button>
            </div>
          </div>
        </div>

        <div className='grid lg:grid-cols-3 gap-6'>
          {/* Lista de Pedidos */}
          <div className='lg:col-span-2 space-y-4'>
            {pedidos.map(pedido => (
              <Card
                key={pedido.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPedido?.id === pedido.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedPedido(pedido)}
              >
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-lg mb-2'>
                        {pedido.titulo}
                      </h3>
                      <div className='flex items-center space-x-4 text-sm text-gray-600 mb-3'>
                        <span>{pedido.categoria}</span>
                        <span>•</span>
                        <span>{pedido.cc}</span>
                        <span>•</span>
                        <span className='font-medium text-green-600'>
                          R$ {pedido.valor.toLocaleString()}
                        </span>
                      </div>
                      <p className='text-gray-700 text-sm line-clamp-2'>
                        {pedido.resumo_ia}
                      </p>
                    </div>
                    <div className='flex flex-col items-end space-y-2'>
                      {getEstado(pedido.estado)}
                      {getSLAStatus(pedido.sla_restante)}
                    </div>
                  </div>

                  <div className='flex items-center justify-between text-sm text-gray-500'>
                    <div className='flex items-center space-x-4'>
                      <span>Solicitante: {pedido.solicitante}</span>
                      <span>•</span>
                      <span>{pedido.anexos} anexos</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Clock className='w-4 h-4' />
                      <span>{pedido.sla_restante}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {pedidos.length === 0 && (
              <Card>
                <CardContent className='p-12 text-center'>
                  <Inbox className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    Inbox vazia
                  </h3>
                  <p className='text-gray-600'>
                    Não há pedidos aguardando sua aprovação no momento.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Detalhes do Pedido */}
          <div className='lg:col-span-1'>
            {selectedPedido ? (
              <Card className='sticky top-8'>
                <CardHeader>
                  <CardTitle>Detalhes do Pedido</CardTitle>
                  <CardDescription>{selectedPedido.titulo}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {/* Informações */}
                  <div className='space-y-3'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Valor:</span>
                      <span className='font-semibold text-green-600'>
                        R$ {selectedPedido.valor.toLocaleString()}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Categoria:</span>
                      <span>{selectedPedido.categoria}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Centro de Custo:</span>
                      <span>{selectedPedido.cc}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Solicitante:</span>
                      <span>{selectedPedido.solicitante}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Próximo Aprovador:</span>
                      <span className='font-medium'>
                        {selectedPedido.proximo_aprovador}
                      </span>
                    </div>
                  </div>

                  {/* Resumo IA */}
                  <div>
                    <h4 className='font-medium mb-2'>Resumo da IA</h4>
                    <p className='text-sm text-gray-700 bg-gray-50 p-3 rounded-md'>
                      {selectedPedido.resumo_ia}
                    </p>
                  </div>

                  {/* Anexos */}
                  <div>
                    <h4 className='font-medium mb-2'>
                      Anexos ({selectedPedido.anexos})
                    </h4>
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between p-2 bg-gray-50 rounded'>
                        <div className='flex items-center space-x-2'>
                          <FileText className='w-4 h-4 text-gray-400' />
                          <span className='text-sm'>cotacao.pdf</span>
                        </div>
                        <Button variant='ghost' size='sm'>
                          <Eye className='w-4 h-4' />
                        </Button>
                      </div>
                      <div className='flex items-center justify-between p-2 bg-gray-50 rounded'>
                        <div className='flex items-center space-x-2'>
                          <FileText className='w-4 h-4 text-gray-400' />
                          <span className='text-sm'>proposta_tecnica.pdf</span>
                        </div>
                        <Button variant='ghost' size='sm'>
                          <Eye className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className='space-y-3 pt-4 border-t'>
                    <Button
                      className='w-full'
                      onClick={() => handleAprovar(selectedPedido.id)}
                    >
                      <CheckCircle className='w-4 h-4 mr-2' />
                      Aprovar
                    </Button>
                    <Button
                      variant='outline'
                      className='w-full'
                      onClick={() =>
                        handleReprovar(
                          selectedPedido.id,
                          'Motivo da reprovação'
                        )
                      }
                    >
                      <XCircle className='w-4 h-4 mr-2' />
                      Reprovar
                    </Button>
                    <Button variant='ghost' className='w-full'>
                      <Edit className='w-4 h-4 mr-2' />
                      Solicitar Ajuste
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className='p-8 text-center text-gray-500'>
                  <Eye className='w-12 h-12 mx-auto mb-4' />
                  <p>Selecione um pedido para ver os detalhes</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Notificações */}
          {notificacoes.length > 0 && (
            <div className='space-y-4'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center space-x-2'>
                    <Inbox className='w-5 h-5' />
                    <span>Notificações</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {notificacoes.map(notificacao => (
                      <div
                        key={notificacao.id}
                        className='p-3 bg-gray-50 rounded-md'
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='font-medium text-sm'>
                              {notificacao.tipo === 'lembrete'
                                ? 'Lembrete SLA'
                                : notificacao.tipo === 'escala'
                                  ? 'Escalonamento'
                                  : notificacao.tipo}
                            </div>
                            <div className='text-xs text-gray-600 mt-1'>
                              {notificacao.payload_json?.pedido_titulo ||
                                'Pedido'}
                            </div>
                            <div className='text-xs text-gray-500 mt-1'>
                              {new Date(notificacao.criada_em).toLocaleString()}
                            </div>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() =>
                              handleMarcarNotificacaoComoLida(notificacao.id)
                            }
                          >
                            <CheckCircle className='w-4 h-4' />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
