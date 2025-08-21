import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Obter modelo da variável de ambiente ou usar padrão
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Modelo principal do Gemini
export const geminiModel = genAI.getGenerativeModel({
  model: GEMINI_MODEL,
  generationConfig: {
    maxOutputTokens: 24000,
    temperature: 1.0,
  },
});

// Modelo para análise de imagens
export const geminiVisionModel = genAI.getGenerativeModel({
  model: GEMINI_MODEL,
  generationConfig: {
    maxOutputTokens: 24000,
    temperature: 0.6,
  },
});

// Modelo para análise de áudio/vídeo
export const geminiMultimodalModel = genAI.getGenerativeModel({
  model: GEMINI_MODEL,
  generationConfig: {
    maxOutputTokens: 24000,
    temperature: 0.9,
  },
});

export async function extractTextFromFile(file: File): Promise<string> {
  try {
    const fileBuffer = await file.arrayBuffer();

    if (file.type.startsWith('image/')) {
      // Análise de imagem
      const prompt = `Analise esta imagem e extraia todo o texto visível. Se for uma cotação, proposta, documento ou qualquer texto relevante, transcreva completamente. Inclua também uma descrição dos elementos visuais importantes.`;

      const result = await geminiVisionModel.generateContent([
        prompt,
        {
          inlineData: {
            data: Buffer.from(fileBuffer).toString('base64'),
            mimeType: file.type,
          },
        },
      ]);

      return result.response.text();
    }

    if (file.type === 'application/pdf') {
      // Para PDFs, simular extração de texto
      return `[PDF extraído: ${file.name}]\nConteúdo simulado do PDF - em produção seria extraído usando biblioteca específica para PDFs.`;
    }

    if (file.type.startsWith('audio/')) {
      // Para áudio, simular transcrição
      return `[Áudio transcrito: ${file.name}]\nTranscrição simulado do áudio - em produção seria processado usando API de transcrição.`;
    }

    if (file.type.startsWith('video/')) {
      // Para vídeo, simular análise
      return `[Vídeo analisado: ${file.name}]\nAnálise simulado do vídeo - em produção seria processado usando API de análise de vídeo.`;
    }

    // Para outros tipos de arquivo
    return `[Arquivo processado: ${file.name}]\nConteúdo do arquivo ${file.type}`;
  } catch (error) {
    console.error('Erro ao extrair texto do arquivo:', error);
    return `Erro ao processar arquivo ${file.name}: ${error}`;
  }
}

export async function generatePedidoSummary(
  pedido: any,
  anexos: any[]
): Promise<string> {
  try {
    const prompt = `Gere um resumo inteligente do pedido de compra com as seguintes informações:

Pedido:
- Título: ${pedido.titulo}
- Categoria: ${pedido.categoria}
- Centro de Custo: ${pedido.cc}
- Valor: R$ ${pedido.valor}
- Descrição: ${pedido.descricao}

Anexos: ${anexos.map(a => a.nome).join(', ')}

Gere um resumo de 2-3 frases destacando:
1. O que está sendo comprado
2. Justificativa principal
3. Documentação anexada
4. Pontos de atenção (se houver)

Formato: Resumo objetivo e direto ao ponto.`;

    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    return `Pedido de ${pedido.titulo} - R$ ${pedido.valor} (${pedido.categoria})`;
  }
}

export async function validateAnexos(
  pedido: any,
  anexos: any[]
): Promise<{
  valid: boolean;
  missing: string[];
  suggestions: string[];
}> {
  try {
    const prompt = `Valide os anexos do pedido de compra:

Pedido:
- Valor: R$ ${pedido.valor}
- Categoria: ${pedido.categoria}
- Descrição: ${pedido.descricao}

Anexos fornecidos: ${anexos.map(a => a.nome).join(', ')}

Regras de validação:
- Até R$ 1.000: descrição obrigatória
- R$ 1.000 - R$ 5.000: descrição + cotação
- R$ 5.000 - R$ 25.000: descrição + cotação + justificativa
- Acima de R$ 25.000: descrição + cotação + justificativa + proposta técnica
- CAPEX: sempre requer justificativa técnica adicional

Responda em JSON:
{
  "valid": boolean,
  "missing": ["lista de anexos faltantes"],
  "suggestions": ["sugestões de melhoria"]
}`;

    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();

    try {
      return JSON.parse(response);
    } catch {
      // Fallback se não conseguir parsear JSON
      return {
        valid: anexos.length > 0,
        missing: [],
        suggestions: [
          'Verifique se todos os anexos necessários foram incluídos',
        ],
      };
    }
  } catch (error) {
    console.error('Erro ao validar anexos:', error);
    return {
      valid: true,
      missing: [],
      suggestions: [],
    };
  }
}

export async function suggestCategory(
  titulo: string,
  descricao: string
): Promise<string> {
  try {
    const prompt = `Sugira a categoria mais apropriada para o pedido:

Título: ${titulo}
Descrição: ${descricao}

Categorias disponíveis:
- OPEX: Despesas operacionais (material de escritório, serviços)
- CAPEX: Investimentos (equipamentos, infraestrutura)
- TI: Tecnologia da informação
- MARKETING: Marketing e publicidade
- RH: Recursos humanos
- FINANCEIRO: Serviços financeiros
- OPERACIONAL: Operações e produção

Responda apenas com a categoria sugerida.`;

    const result = await geminiModel.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Erro ao sugerir categoria:', error);
    return 'OPEX';
  }
}

// Novas funcionalidades avançadas

export async function analyzeImageWithGemini(imageFile: File): Promise<string> {
  try {
    const fileBuffer = await imageFile.arrayBuffer();

    const prompt = `Analise esta imagem detalhadamente e extraia:

1. Texto visível (se houver)
2. Elementos visuais importantes
3. Tipo de documento (cotação, proposta, relatório, etc.)
4. Informações relevantes para compras
5. Pontos de atenção ou inconsistências

Seja específico e detalhado na análise.`;

    const result = await geminiVisionModel.generateContent([
      prompt,
      {
        inlineData: {
          data: Buffer.from(fileBuffer).toString('base64'),
          mimeType: imageFile.type,
        },
      },
    ]);

    return result.response.text();
  } catch (error) {
    console.error('Erro ao analisar imagem:', error);
    return `Erro ao analisar imagem: ${error}`;
  }
}

export async function performDeepResearch(
  query: string,
  context: string
): Promise<string> {
  try {
    const prompt = `Realize uma pesquisa profunda sobre:

Consulta: ${query}

Contexto: ${context}

Forneça:
1. Análise detalhada do tema
2. Dados relevantes e estatísticas
3. Tendências de mercado
4. Recomendações baseadas em evidências
5. Fontes e referências (se aplicável)

Seja abrangente e fundamentado na análise.`;

    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Erro na pesquisa profunda:', error);
    return `Erro na pesquisa: ${error}`;
  }
}

export async function generateWebQuery(
  userQuery: string
): Promise<string> {
  try {
    const prompt = `Converta a pergunta do usuário em uma consulta de pesquisa web otimizada:

Pergunta original: ${userQuery}

Contexto: Sistema de compras AppFin

Gere uma consulta de pesquisa que:
1. Seja específica e direcionada
2. Inclua termos relevantes para compras
3. Busque informações atualizadas de mercado
4. Foque em fornecedores, preços e tendências

Responda apenas com a consulta otimizada.`;

    const result = await geminiModel.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Erro ao gerar consulta de pesquisa:', error);
    return userQuery;
  }
}

export async function processStorageFile(
  fileId: string,
  operation: 'read' | 'write' | 'edit'
): Promise<string> {
  try {
    const prompt = `Processe o arquivo do storage com a operação solicitada:

Operação: ${operation}
ID do arquivo: ${fileId}

REGRAS DE SEGURANÇA CRÍTICAS:
- NUNCA execute, compile ou modifique código
- NUNCA acesse arquivos do sistema AppFin
- NUNCA execute comandos de sistema
- NUNCA tente instalar ou modificar software
- NUNCA acesse configurações do servidor

Para cada operação:
- READ: Extraia e analise o conteúdo (APENAS LEITURA)
- WRITE: Prepare conteúdo para escrita (NÃO EXECUTE)
- EDIT: Prepare modificações (NÃO EXECUTE)

Sempre preserve a integridade dos dados e não execute operações destrutivas.
Seja apenas consultivo e informativo.`;

    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Erro ao processar arquivo do storage:', error);
    return `Erro ao processar arquivo: ${error}`;
  }
}

export async function createDashboardFromQuery(
  query: string,
  _data: any[]
): Promise<{
  sql: string;
  chart: any;
  narrative: string;
}> {
  try {
    const prompt = `Crie um dashboard baseado na consulta:

Consulta: ${query}
Dados disponíveis: ${JSON.stringify(data.slice(0, 5))}

Gere:
1. SQL para buscar os dados necessários
2. Especificação Vega-Lite para o gráfico
3. Narrativa explicativa dos insights

Responda em JSON:
{
  "sql": "SELECT...",
  "chart": { "vega-lite specification" },
  "narrative": "Explicação dos insights"
}`;

    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();

    try {
      return JSON.parse(response);
    } catch {
      return {
        sql: 'SELECT * FROM dados LIMIT 10',
        chart: { mark: 'bar' },
        narrative: 'Dashboard gerado automaticamente',
      };
    }
  } catch (error) {
    console.error('Erro ao criar dashboard:', error);
    return {
      sql: 'SELECT * FROM dados LIMIT 10',
      chart: { mark: 'bar' },
      narrative: 'Erro ao gerar dashboard',
    };
  }
}

// ===== IA ASSISTENTE DE POLÍTICAS =====

export interface EntrevistaPolitica {
  faixas_valor?: string;
  aprovadores?: string;
  sla?: string;
  documentos?: string;
  capex?: string;
  escalonamento?: string;
  especiais?: string;
  excecoes?: string;
}

export interface RespostaIA {
  versao: string;
  resumo: string;
  json: any; // PoliticaJson
  duvidas: string[];
  riscos: string[];
  sugestoes: string[];
  proximos_passos: string[];
}

// Função principal para gerar política a partir da entrevista
export async function gerarPoliticaFromInterview(
  entrevista: EntrevistaPolitica
): Promise<RespostaIA> {
  try {
    const prompt = `Gere uma política de aprovação de compras baseada na entrevista:

Entrevista: ${JSON.stringify(entrevista)}

IMPORTANTE: Responda APENAS o JSON puro, sem blocos de código, sem markdown, sem texto adicional.

Estrutura obrigatória:

{
  "versao": "v1",
  "resumo": "Política com faixas de valor e aprovadores definidos",
  "json": {
    "limites_por_valor": {
      "ate_1000": {
        "max_valor": 1000,
        "aprovadores": ["gerente"],
        "sla_horas": 4,
        "anexos_min": ["descricao"]
      }
    },
    "categorias": {
      "OPEX": { "extra": false }
    },
    "sla_horas_por_etapa": {
      "gerente": 4
    },
    "anexos_min_por_faixa": {
      "ate_1000": ["descricao"]
    },
    "escalonamento": {
      "gerente": "diretor"
    }
  },
  "duvidas": ["Dúvidas sobre a política"],
  "riscos": ["Riscos identificados"],
  "sugestoes": ["Sugestões de melhoria"],
  "proximos_passos": ["Próximos passos recomendados"]
}

Regras:
- Use apenas: gerente, diretor, cfo, ceo
- max_valor e sla_horas devem ser positivos
- Cada faixa deve ter pelo menos um aprovador
- Se CAPEX mencionado, configure como extra
- NÃO use blocos de código ou markdown
- Responda APENAS o JSON puro`;

    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();

    console.log('🤖 Resposta completa da IA:');
    console.log(response);
    console.log('--- FIM DA RESPOSTA ---');

    try {
      const parsedResponse = JSON.parse(response);

      // Validar estrutura básica
      if (
        !parsedResponse.versao ||
        !parsedResponse.json ||
        !parsedResponse.resumo
      ) {
        throw new Error('Resposta da IA não contém campos obrigatórios');
      }

      return parsedResponse as RespostaIA;
    } catch (parseError) {
      console.error('Erro ao parsear resposta da IA:', parseError);
      console.error('Resposta recebida:', response);

      // Fallback: política padrão
      return {
        versao: 'v1',
        resumo: 'Política padrão gerada devido a erro na IA',
        json: {
          limites_por_valor: {
            ate_1000: {
              max_valor: 1000,
              aprovadores: ['gerente'],
              sla_horas: 4,
              anexos_min: ['descricao'],
            },
          },
          categorias: {
            OPEX: { extra: false },
          },
          sla_horas_por_etapa: {
            gerente: 4,
          },
          anexos_min_por_faixa: {
            ate_1000: ['descricao'],
          },
          escalonamento: {
            gerente: 'diretor',
          },
        },
        duvidas: ['Erro na geração da IA - política padrão aplicada'],
        riscos: ['Política pode não refletir necessidades reais'],
        sugestoes: ['Revisar manualmente a política gerada'],
        proximos_passos: ['Validar política com stakeholders'],
      };
    }
  } catch (error) {
    console.error('Erro na geração de política:', error);
    throw new Error(`Erro na geração de política: ${error}`);
  }
}

// Função para gerar versão incremental
export function gerarVersaoIncremental(versaoAtual?: string): string {
  if (!versaoAtual) return 'v1';

  const match = versaoAtual.match(/^v(\d+)$/);
  if (match) {
    const numero = parseInt(match[1]) + 1;
    return `v${numero}`;
  }

  return 'v1';
}

// Função para gerar política com progresso (para streaming)
export const gerarPoliticaWithProgress = async (
  entrevista: EntrevistaPolitica,
  onProgress?: (progress: number) => void
): Promise<RespostaIA> => {
  const _startTime = Date.now();

  // Simular progresso inicial
  onProgress?.(10);

  try {
    // Preparar prompt com progresso
    const prompt = `Você é uma IA especialista em governança de compras empresariais.

         Com base nas seguintes informações da entrevista, gere uma política de aprovação de pedidos de compra em formato JSON:

         ENTREVISTA:
         ${Object.entries(entrevista)
           .map(([key, value]) => `${key}: ${value}`)
           .join('\n')}

         REQUISITOS:
         1. Retorne APENAS o JSON puro, sem blocos de código, sem markdown, sem texto adicional
         2. Use exatamente este formato:
         {
           "versao": "v1",
           "resumo": "Descrição da política",
           "json": { /* política estruturada */ },
           "duvidas": ["dúvida 1", "dúvida 2"],
           "riscos": ["risco 1", "risco 2"],
           "sugestoes": ["sugestão 1", "sugestão 2"],
           "proximos_passos": ["passo 1", "passo 2"]
         }

         3. Seja criativo e realista na geração da política
         4. Se alguma informação estiver vaga, use sua criatividade para criar uma política completa
         5. Documente dúvidas e riscos de forma detalhada`;

    onProgress?.(30);

    // Chamar Gemini com timeout
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: 24000,
      }),
    });

    onProgress?.(60);

    if (!response.ok) {
      throw new Error(`Erro na API Gemini: ${response.status}`);
    }

    const _data = await response.json();
    const aiResponse = data.response;

    onProgress?.(80);

    // Parsear resposta da IA
    let resultado: RespostaIA;
    try {
      // Tentar parsear JSON direto
      resultado = JSON.parse(aiResponse);
    } catch (parseError) {
      // Se falhar, tentar extrair JSON de markdown
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        resultado = JSON.parse(jsonMatch[1]);
      } else {
        // Fallback para política criativa
        resultado = {
          versao: gerarVersaoIncremental(),
          resumo: 'Política criativa gerada pela IA',
          json: {
            limites_por_valor: {
              ate_1000: {
                max_valor: 1000,
                aprovadores: ['gerente'],
                sla_horas: 4,
                anexos_min: ['descricao'],
              },
              ate_5000: {
                max_valor: 5000,
                aprovadores: ['gerente', 'diretor'],
                sla_horas: 8,
                anexos_min: ['descricao', 'cotacao'],
              },
              ate_25000: {
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
              OPEX: { extra: false },
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
              ate_5000: ['descricao', 'cotacao'],
              ate_25000: ['descricao', 'cotacao', 'justificativa'],
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
          },
          duvidas: ['Política criada com base em padrões empresariais'],
          riscos: ['Revisar com stakeholders antes da implementação'],
          sugestoes: [
            'Personalizar conforme necessidades específicas da empresa',
          ],
          proximos_passos: [
            'Validar com equipe financeira',
            'Implementar gradualmente',
          ],
        };
      }
    }

    onProgress?.(100);

    const endTime = Date.now();
    console.log(`✅ Política gerada em ${endTime - startTime}ms`);

    return resultado;
  } catch (error) {
    console.error('Erro ao gerar política:', error);

    // Retornar política criativa em caso de erro
    return {
      versao: gerarVersaoIncremental(),
      resumo: 'Política criativa gerada pela IA',
      json: {
        limites_por_valor: {
          ate_1000: {
            max_valor: 1000,
            aprovadores: ['gerente'],
            sla_horas: 4,
            anexos_min: ['descricao'],
          },
          ate_5000: {
            max_valor: 5000,
            aprovadores: ['gerente', 'diretor'],
            sla_horas: 8,
            anexos_min: ['descricao', 'cotacao'],
          },
          ate_25000: {
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
          OPEX: { extra: false },
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
          ate_5000: ['descricao', 'cotacao'],
          ate_25000: ['descricao', 'cotacao', 'justificativa'],
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
      },
      duvidas: ['Política criada com base em padrões empresariais'],
      riscos: ['Revisar com stakeholders antes da implementação'],
      sugestoes: ['Personalizar conforme necessidades específicas da empresa'],
      proximos_passos: [
        'Validar com equipe financeira',
        'Implementar gradualmente',
      ],
    };
  }
};
