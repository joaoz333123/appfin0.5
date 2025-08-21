import { supabase } from '@/lib/supabase';
import archiver from 'archiver';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Buscar dados
    const [pedidos, aprovacoes, orcamentos, politicas, anexos] =
      await Promise.all([
        supabase.from('pedidos').select('*'),
        supabase.from('aprovacoes').select('*'),
        supabase.from('orcamentos').select('*'),
        supabase.from('politicas').select('*'),
        supabase.from('anexos').select('*'),
      ]);

    // Criar ZIP
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', chunk => chunks.push(chunk));
    archive.on('end', () => {});

    // Adicionar CSVs
    archive.append(convertToCSV(pedidos.data || []), { name: 'pedidos.csv' });
    archive.append(convertToCSV(aprovacoes.data || []), {
      name: 'aprovacoes.csv',
    });
    archive.append(convertToCSV(orcamentos.data || []), {
      name: 'orcamentos.csv',
    });
    archive.append(convertToCSV(politicas.data || []), {
      name: 'politicas.csv',
    });

    // Adicionar lista de anexos
    const anexosList = (anexos.data || [])
      .map(a => `${a.pedido_id}/${a.tipo}/${a.url}`)
      .join('\n');
    archive.append(anexosList, { name: 'anexos/lista.txt' });

    // Finalizar ZIP
    await archive.finalize();

    const zipBuffer = Buffer.concat(chunks);

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="appfin-export.zip"',
      },
    });
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return NextResponse.json({ _error: 'Erro interno' }, { status: 500 });
  }
}

function convertToCSV(_data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(',')
    ),
  ];

  return csvRows.join('\n');
}
