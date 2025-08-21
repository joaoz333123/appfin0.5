import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(_request: Request) {
  try {
    // Tentar buscar dados do Supabase se configurado
    let files: any[] = [];

    try {
      const { data: anexos, error } = await supabase
        .from('anexos')
        .select('*')
        .order('criado_em', { ascending: false });

      if (!error && anexos) {
        // Transformar dados para o formato esperado pela UI
        files = anexos.map(anexo => ({
          id: anexo.id,
          name: anexo.url.split('/').pop() || 'arquivo',
          type: anexo.mime || 'application/octet-stream',
          size: 0, // Tamanho não disponível no banco
          path: anexo.url,
          lastModified: new Date(anexo.criado_em),
          content: anexo.texto_extraido,
        }));
      }
    } catch (dbError) {
      console.log('Supabase não configurado, usando dados de exemplo');
    }

    // Se não há dados do banco, usar arquivos de exemplo
    if (files.length === 0) {
      files = [
        {
          id: '1',
          name: 'cotacao_notebooks.pdf',
          type: 'application/pdf',
          size: 1024000,
          path: '/storage/cotacao_notebooks.pdf',
          lastModified: new Date('2024-01-15'),
          content:
            'Cotação de notebooks Dell Latitude 5520 para equipe de TI...',
        },
        {
          id: '2',
          name: 'proposta_tecnica.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 512000,
          path: '/storage/proposta_tecnica.docx',
          lastModified: new Date('2024-01-14'),
          content: 'Proposta técnica para implementação de CRM Salesforce...',
        },
        {
          id: '3',
          name: 'imagem_cotacao.jpg',
          type: 'image/jpeg',
          size: 256000,
          path: '/storage/imagem_cotacao.jpg',
          lastModified: new Date('2024-01-13'),
          content: 'Imagem da cotação de mobiliário para escritório...',
        },
        {
          id: '4',
          name: 'relatorio_orcamento.xlsx',
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: 768000,
          path: '/storage/relatorio_orcamento.xlsx',
          lastModified: new Date('2024-01-12'),
          content: 'Relatório de orçamentos por centro de custo...',
        },
        {
          id: '5',
          name: 'audio_apresentacao.mp3',
          type: 'audio/mpeg',
          size: 2048000,
          path: '/storage/audio_apresentacao.mp3',
          lastModified: new Date('2024-01-11'),
          content: 'Apresentação em áudio sobre nova política de compras...',
        },
      ];
    }

    return NextResponse.json(files);
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    return NextResponse.json(
      { _error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
