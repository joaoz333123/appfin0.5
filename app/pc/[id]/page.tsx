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
    ArrowLeft,
    CheckCircle,
    Clock,
    FileText,
    XCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function PedidoDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  // Dados mock para demonstração
  const pedido = {
    id: params.id,
    titulo: 'Aquisição de Notebooks para TI',
    categoria: 'TI',
    cc: 'TI',
    projeto: 'Modernização de Equipamentos',
    valor: 15000,
    estado: 'em_aprovacao',
    solicitante: 'João Silva',
    criado_em: '2024-01-15T10:30:00Z',
    politica_versao: 'v1',
    descricao: 'Aquisição de 5 notebooks para a equipe de desenvolvimento',
  };

  const aprovacoes = [
    {
      id: '1',
      etapa_idx: 1,
      papel_alvo: 'Gerente TI',
      aprovador: 'Maria Santos',
      decisao: 'aprovado',
      comentario: 'Aprovado conforme orçamento',
      em: '2024-01-15T14:30:00Z',
    },
    {
      id: '2',
      etapa_idx: 2,
      papel_alvo: 'Diretor',
      aprovador: null,
      decisao: 'pendente',
      comentario: null,
      em: null,
    },
  ];

  const anexos = [
    { id: '1', nome: 'cotacao_notebooks.pdf', tipo: 'cotacao' },
    { id: '2', nome: 'justificativa_tecnica.docx', tipo: 'justificativa' },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-4xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center space-x-4'>
            <Link href='/inbox'>
              <Button variant='outline' size='sm'>
                <ArrowLeft className='w-4 h-4 mr-2' />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                {pedido.titulo}
              </h1>
              <p className='text-gray-600'>ID: {pedido.id}</p>
            </div>
          </div>
          <Badge
            variant={pedido.estado === 'em_aprovacao' ? 'default' : 'secondary'}
          >
            {pedido.estado.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Informações principais */}
          <div className='lg:col-span-2 space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Pedido</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Categoria
                    </label>
                    <p className='text-gray-900'>{pedido.categoria}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Centro de Custo
                    </label>
                    <p className='text-gray-900'>{pedido.cc}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Projeto
                    </label>
                    <p className='text-gray-900'>{pedido.projeto}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Valor
                    </label>
                    <p className='text-gray-900 font-semibold'>
                      R$ {pedido.valor.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Descrição
                  </label>
                  <p className='text-gray-900 mt-1'>{pedido.descricao}</p>
                </div>
              </CardContent>
            </Card>

            {/* Linha do tempo */}
            <Card>
              <CardHeader>
                <CardTitle>Linha do Tempo</CardTitle>
                <CardDescription>Histórico de aprovações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {aprovacoes.map((aprovacao, index) => (
                    <div
                      key={aprovacao.id}
                      className='flex items-start space-x-4'
                    >
                      <div className='flex-shrink-0'>
                        {aprovacao.decisao === 'aprovado' ? (
                          <CheckCircle className='w-6 h-6 text-green-500' />
                        ) : aprovacao.decisao === 'reprovado' ? (
                          <XCircle className='w-6 h-6 text-red-500' />
                        ) : (
                          <Clock className='w-6 h-6 text-yellow-500' />
                        )}
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-center justify-between'>
                          <h4 className='font-medium text-gray-900'>
                            {aprovacao.papel_alvo}
                          </h4>
                          <Badge
                            variant={
                              aprovacao.decisao === 'aprovado'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {aprovacao.decisao.toUpperCase()}
                          </Badge>
                        </div>
                        {aprovacao.aprovador && (
                          <p className='text-sm text-gray-600'>
                            Aprovado por: {aprovacao.aprovador}
                          </p>
                        )}
                        {aprovacao.comentario && (
                          <p className='text-sm text-gray-600 mt-1'>
                            {aprovacao.comentario}
                          </p>
                        )}
                        {aprovacao.em && (
                          <p className='text-xs text-gray-500 mt-1'>
                            {new Date(aprovacao.em).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Anexos */}
            <Card>
              <CardHeader>
                <CardTitle>Anexos</CardTitle>
                <CardDescription>Documentos relacionados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {anexos.map(anexo => (
                    <div
                      key={anexo.id}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div className='flex items-center space-x-3'>
                        <FileText className='w-5 h-5 text-gray-400' />
                        <div>
                          <p className='font-medium text-gray-900'>
                            {anexo.nome}
                          </p>
                          <p className='text-sm text-gray-500'>{anexo.tipo}</p>
                        </div>
                      </div>
                      <Button variant='outline' size='sm'>
                        Baixar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Política Aplicada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Versão
                    </label>
                    <p className='text-gray-900'>{pedido.politica_versao}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Justificativa
                    </label>
                    <p className='text-sm text-gray-600'>
                      Valor acima de R$ 5.000 requer aprovação do Diretor
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Solicitante
                    </label>
                    <p className='text-gray-900'>{pedido.solicitante}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Criado em
                    </label>
                    <p className='text-gray-900'>
                      {new Date(pedido.criado_em).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
