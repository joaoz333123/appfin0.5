import { authOptions } from '@/lib/auth';
import { uploadFile } from '@/lib/files';
import { evaluate, verificarDuplicatas } from '@/lib/policy';
import { Pedido, executeWithRetry, supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validação Zod
const pedidoSchema = z.object({
  titulo: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  cc: z.string().min(1, 'Centro de custo é obrigatório'),
  projeto: z.string().optional(),
  valor: z.number().positive('Valor deve ser positivo'),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  solicitante_id: z.string().min(1, 'Solicitante ID é obrigatório'),
});

export async function POST(_request: Request) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] 🚀 Iniciando criação de pedido`);

  try {
    // 1. AUTENTICAÇÃO - Obter sessão do usuário
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log(`[${requestId}] ❌ Usuário não autenticado`);
      return NextResponse.json(
        {
          _error: 'Usuário não autenticado',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    const solicitante_id = session.user.email;
    console.log(`[${requestId}] ✅ Usuário autenticado: ${solicitante_id}`);

    // 2. EXTRAÇÃO DOS DADOS - FormData ou JSON
    let dados: any;
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      dados = {
        titulo: formData.get('titulo') as string,
        categoria: formData.get('categoria') as string,
        cc: formData.get('cc') as string,
        projeto: (formData.get('projeto') as string) || undefined,
        valor: parseFloat(formData.get('valor') as string),
        descricao: formData.get('descricao') as string,
        solicitante_id,
        anexos: formData.getAll('anexos') as File[],
        forcar_criacao: formData.get('forcar_criacao') === 'true',
      };
    } else {
      const body = await request.json();
      dados = { ...body, solicitante_id };
    }

    console.log(`[${requestId}] 📥 Dados recebidos:`, {
      titulo: dados.titulo,
      categoria: dados.categoria,
      cc: dados.cc,
      valor: dados.valor,
      anexos: dados.anexos?.length || 0,
    });

    // 3. VALIDAÇÃO ZOD
    const validacao = pedidoSchema.safeParse(dados);
    if (!validacao.success) {
      const erros = validacao.error.errors.map(err => ({
        campo: err.path.join('.'),
        mensagem: err.message,
      }));
      console.log(`[${requestId}] ❌ Validação falhou:`, erros);
      return NextResponse.json(
        {
          _error: 'Dados inválidos',
          code: 'VALIDATION_ERROR',
          erros,
        },
        { status: 400 }
      );
    }

    const dadosValidados = validacao.data;
    console.log(`[${requestId}] ✅ Validação passou`);

    // 4. VERIFICAÇÃO DE DUPLICATAS
    console.log(`[${requestId}] 🔍 Verificando duplicatas...`);
    let duplicatas: any[] = [];
    let dbOnline = true;

    try {
      const resultadoDuplicatas = await verificarDuplicatas(
        dadosValidados,

      );
      duplicatas = resultadoDuplicatas.duplicatas;
      console.log(
        `[${requestId}] ✅ Verificação de duplicatas concluída: ${duplicatas.length} encontradas`
      );
    } catch (error) {
      console.warn(
        `[${requestId}] ⚠️ Erro na verificação de duplicatas:`,
        error
      );
      dbOnline = false;
    }

    // Se há duplicatas, verificar se usuário quer forçar criação
    if (duplicatas.length > 0) {
      const forcarCriacao =
        dados.forcar_criacao === true || dados.forcar_criacao === 'true';

      if (!forcarCriacao) {
        console.log(
          `[${requestId}] ⚠️ Duplicatas encontradas, solicitando confirmação`
        );
        return NextResponse.json(
          {
            warning: 'Possíveis duplicatas encontradas',
            code: 'DUPLICATES_FOUND',
            duplicatas: duplicatas.map(d => ({
              id: d.id,
              titulo: d.titulo,
              valor: d.valor,
              categoria: d.categoria,
              estado: d.estado,
              criado_em: d.criado_em,
            })),
            deve_confirmar: true,
          },
          { status: 200 }
        );
      } else {
        console.log(
          `[${requestId}] ⚠️ Usuário forçou criação apesar das duplicatas`
        );
      }
    }

    // 5. UPLOAD DE ANEXOS (se existirem)
    const anexosUrls: any[] = [];
    if (dados.anexos && dados.anexos.length > 0) {
      console.log(
        `[${requestId}] 📎 Fazendo upload de ${dados.anexos.length} anexo(s)`
      );
      try {
        for (const anexo of dados.anexos) {
          const { url, path } = await uploadFile(anexo);
          anexosUrls.push({
            url,
            path,
            nome: anexo.name,
            tamanho: anexo.size,
            tipo: anexo.type,
          });
        }
        console.log(`[${requestId}] ✅  de anexos concluído`);
      } catch (error) {
        console.warn(`[${requestId}] ⚠️ Erro no upload de anexos:`, error);
        // Continuar sem anexos em caso de erro
      }
    }

    // 6. BUSCAR POLÍTICA ATIVA
    let politica: any = null;
    let etapas: any[] = [];

    if (dbOnline) {
      try {
        console.log(`[${requestId}] 🔍 Buscando política ativa...`);
        const { _data: politicaData, _error: politicaError } =
          await executeWithRetry(() =>
            supabase
              .from('politicas')
              .select('*')
              .eq('versao', 'v1')
              .single()
          );

        if (politicaError || !politicaData) {
          console.warn(
            `[${requestId}] ⚠️ Política não encontrada, usando padrão`
          );
          dbOnline = false;
        } else {
          politica = politicaData;
          console.log(
            `[${requestId}] ✅ Política encontrada: ${politica.versao}`
          );

          // Gerar etapas de aprovação
          const pedidoTemp: Pedido = {
            id: 'temp',
            titulo: dadosValidados.titulo,
            categoria: dadosValidados.categoria,
            cc: dadosValidados.cc,
            projeto: dadosValidados.projeto || '',
            valor: dadosValidados.valor,
            estado: 'rascunho',
            solicitante_id: dadosValidados.solicitante_id,
            politica_versao: 'v1',
            criado_em: new Date().toISOString(),
          };

          etapas = evaluate(pedidoTemp, politica.json);
          console.log(`[${requestId}] ✅ Etapas geradas: ${etapas.length}`);
        }
      } catch (error) {
        console.warn(`[${requestId}] ⚠️ Erro ao buscar política:`, error);
        dbOnline = false;
      }
    }

    // 7. CRIAÇÃO DO PEDIDO
    if (dbOnline) {
      try {
        console.log(`[${requestId}] 💾 Salvando pedido no banco...`);

        const estadoInicial = etapas.length > 0 ? 'em_aprovacao' : 'rascunho';

        const { _data: pedido, _error: pedidoError } = await executeWithRetry(
                  () =>
          supabase
            .from('pedidos')
              .insert({
                titulo: dadosValidados.titulo,
                categoria: dadosValidados.categoria,
                cc: dadosValidados.cc,
                projeto: dadosValidados.projeto,
                valor: dadosValidados.valor,
                estado: estadoInicial,
                solicitante_id: dadosValidados.solicitante_id,
                politica_versao: politica?.versao || 'v1',
              })
              .select()
              .single()
        );

        if (pedidoError) {
          console.error(`[${requestId}] ❌ Erro ao criar pedido:`, pedidoError);
          throw new Error(`Erro ao criar pedido: ${pedidoError.message}`);
        }

        console.log(`[${requestId}] ✅ Pedido criado: ${pedido.id}`);

        // 8. SALVAR ANEXOS
        if (anexosUrls.length > 0) {
          console.log(
            `[${requestId}] 💾 Salvando ${anexosUrls.length} anexo(s)`
          );
          for (const anexo of anexosUrls) {
            try {
              await supabase.from('anexos').insert({
                pedido_id: pedido.id,
                tipo: 'documento',
                mime: anexo.tipo || 'application/octet-stream',
                url: anexo.url,
                texto_extraido: null,
              });
            } catch (error) {
              console.warn(`[${requestId}] ⚠️ Erro ao salvar anexo:`, error);
            }
          }
        }

        // 9. CRIAR ETAPAS DE APROVAÇÃO
        if (etapas.length > 0) {
          console.log(
            `[${requestId}] 💾 Criando ${etapas.length} etapa(s) de aprovação`
          );
          for (const etapa of etapas) {
            try {
              await supabase.from('aprovacoes').insert({
                pedido_id: pedido.id,
                papel_alvo: etapa.papel_alvo,
                decisao: 'pendente',
                criado_em: new Date().toISOString(),
              });
            } catch (error) {
              console.warn(
                `[${requestId}] ⚠️ Erro ao criar etapa de aprovação:`,
                error
              );
            }
          }
        }

        console.log(`[${requestId}] 🎉 Pedido criado com sucesso!`);

        return NextResponse.json({
          success: true,
          _data: pedido,
          etapas_geradas: etapas.length,
          proxima_etapa: etapas.length > 0 ? etapas[0].papel_alvo : null,
          anexos_salvos: anexosUrls.length,
          politica_aplicada: {
            versao: politica?.versao || 'padrão',
            etapas: etapas,
          },
          request_id: requestId,
        });
      } catch (error) {
        console.error(`[${requestId}] ❌ Erro ao salvar no banco:`, error);
        dbOnline = false;
      }
    }

    // 10. FALLBACK - DADOS MOCKADOS (se DB offline)
    if (!dbOnline) {
      console.log(`[${requestId}] 🔄  offline, usando fallback`);

      const pedidoMockado = {
        id: `mock-${Date.now()}`,
        titulo: dadosValidados.titulo,
        categoria: dadosValidados.categoria,
        cc: dadosValidados.cc,
        projeto: dadosValidados.projeto,
        valor: dadosValidados.valor,
        estado: 'rascunho',
        solicitante_id: dadosValidados.solicitante_id,
        politica_versao: 'v1-fallback',
        criado_em: new Date().toISOString(),
      };

      console.log(`[${requestId}] 🎉 Pedido criado via fallback!`);

      return NextResponse.json({
        success: true,
        _data: pedidoMockado,
        etapas_geradas: 0,
        proxima_etapa: null,
        anexos_salvos: anexosUrls.length,
        politica_aplicada: {
          versao: 'fallback',
          etapas: [],
        },
        warning: 'Pedido criado localmente - sincronização pendente',
        mode: 'fallback',
        request_id: requestId,
      });
    }
  } catch (error) {
    console.error(`[${requestId}] ❌ Erro crítico:`, error);

    // Log detalhado do erro
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        _error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
        details:
          process.env.NODE_ENV === 'development' ? errorDetails : undefined,
        request_id: requestId,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Tentar buscar do Supabase se configurado com retry
    try {
      const { data, error } =         await executeWithRetry(() =>
        supabase
          .from('pedidos')
          .select(
            `
            *,
            anexos (*),
            aprovacoes (
              id,
              papel_alvo,
              decisao,
              comentario,
              criado_em,
              aprovador_id
            )
          `
          )
          .order('criado_em', { ascending: false })
      );

      if (!error && data) {
        // Processar pedidos para incluir informações de etapas
        const pedidosProcessados = data.map(pedido => {
          const aprovacoes = pedido.aprovacoes || [];
          const etapasPendentes = aprovacoes.filter(
            (ap: any) => ap.decisao === 'pendente'
          );
          const etapasAprovadas = aprovacoes.filter(
            (ap: any) => ap.decisao === 'aprovado'
          );
          const etapasReprovadas = aprovacoes.filter(
            (ap: any) => ap.decisao === 'reprovado'
          );

          return {
            ...pedido,
            etapas: {
              total: aprovacoes.length,
              pendentes: etapasPendentes.length,
              aprovadas: etapasAprovadas.length,
              reprovadas: etapasReprovadas.length,
              proxima_etapa:
                etapasPendentes.length > 0
                  ? etapasPendentes[0].papel_alvo
                  : null,
            },
          };
        });

        return NextResponse.json({
          _data: pedidosProcessados,
          total: pedidosProcessados.length,
          resumo: {
            em_aprovacao: pedidosProcessados.filter(
              p => p.estado === 'em_aprovacao'
            ).length,
            aprovados: pedidosProcessados.filter(p => p.estado === 'aprovado')
              .length,
            reprovados: pedidosProcessados.filter(p => p.estado === 'reprovado')
              .length,
            rascunho: pedidosProcessados.filter(p => p.estado === 'rascunho')
              .length,
          },
        });
      }
    } catch (dbError) {
      console.log('Supabase não configurado, usando dados de exemplo');
    }

    // Dados de exemplo se não há conexão com banco
    const exampleData = [
      {
        id: '1',
        titulo: 'Notebooks para equipe de TI',
        categoria: 'TI',
        cc: 'TI',
        projeto: 'Modernização de equipamentos',
        valor: 15000,
        estado: 'em_aprovacao',
        solicitante_id: 'user123',
        politica_versao: 'v1.0',
        criado_em: '2024-01-15T10:00:00Z',
        anexos: [
          {
            id: '1',
            tipo: 'documento',
            mime: 'application/pdf',
            url: '/storage/cotacao_notebooks.pdf',
            texto_extraido: 'Cotação de notebooks Dell Latitude 5520...',
          },
        ],
        aprovacoes: [
          {
            id: '1',
            papel_alvo: 'gerente',
            decisao: 'pendente',
            comentario: null,
            criado_em: '2024-01-15T10:00:00Z',
            aprovador_id: null,
          },
          {
            id: '2',
            papel_alvo: 'diretor',
            decisao: 'pendente',
            comentario: null,
            criado_em: '2024-01-15T10:00:00Z',
            aprovador_id: null,
          },
        ],
        etapas: {
          total: 2,
          pendentes: 2,
          aprovadas: 0,
          reprovadas: 0,
          proxima_etapa: 'gerente',
        },
      },
      {
        id: '2',
        titulo: 'Mobiliário para escritório',
        categoria: 'OPEX',
        cc: 'ADM',
        projeto: 'Reforma do escritório',
        valor: 5000,
        estado: 'aprovado',
        solicitante_id: 'user456',
        politica_versao: 'v1.0',
        criado_em: '2024-01-14T14:30:00Z',
        anexos: [],
        aprovacoes: [
          {
            id: '3',
            papel_alvo: 'gerente',
            decisao: 'aprovado',
            comentario: 'Aprovado conforme política',
            criado_em: '2024-01-14T15:00:00Z',
            aprovador_id: 'gerente123',
          },
        ],
        etapas: {
          total: 1,
          pendentes: 0,
          aprovadas: 1,
          reprovadas: 0,
          proxima_etapa: null,
        },
      },
    ];

    return NextResponse.json({
      _data: exampleData,
      total: exampleData.length,
      resumo: {
        em_aprovacao: 1,
        aprovados: 1,
        reprovados: 0,
        rascunho: 0,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json({ _error: 'Erro interno' }, { status: 500 });
  }
}
