import { PoliticaJson, validatePolicyWithOPA } from '@/lib/policy';
import { checkContentSecurity, sanitizeContent } from '@/lib/security';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuração do Gemini 2.5 Flash
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    maxOutputTokens: 24000,
    temperature: 0.9,
  },
});

interface RespostaIA {
  versao: string;
  json: PoliticaJson;
  resumo: string;
  duvidas: string[];
  riscos: string[];
  sugestoes: string[];
  proximos_passos: string[];
}

// Validação de entrada para FormData
function validateFormData(formData: FormData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const requiredFields = [
    'faixas_valor',
    'aprovadores',
    'sla',
    'documentos',
    'capex',
    'escalonamento',
    'especiais',
    'excecoes',
  ];

  for (const field of requiredFields) {
    const value = formData.get(field);
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      errors.push(`Campo obrigatório '${field}' não fornecido ou vazio`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Sanitizar e validar conteúdo
function sanitizeAndValidateContent(formData: FormData): {
  isValid: boolean;
  sanitizedData: Record<string, string>;
  warnings: string[];
} {
  const sanitizedData: Record<string, string> = {};
  const warnings: string[] = [];

  const fields = [
    'faixas_valor',
    'aprovadores',
    'sla',
    'documentos',
    'capex',
    'escalonamento',
    'especiais',
    'excecoes',
  ];

  for (const field of fields) {
    const value = formData.get(field) as string;
    if (value) {
      // Verificar segurança do conteúdo
      const securityCheck = checkContentSecurity(value);
      if (!securityCheck.isSafe) {
        warnings.push(
          `Conteúdo potencialmente perigoso detectado em '${field}': ${securityCheck.warnings.join(', ')}`
        );
      }

      // Sanitizar conteúdo
      sanitizedData[field] = sanitizeContent(value.trim());
    }
  }

  return {
    isValid: Object.keys(sanitizedData).length === fields.length,
    sanitizedData,
    warnings,
  };
}

// Gerar política com Gemini 2.5 Flash
async function gerarPoliticaComGemini(
  dadosEntrevista: Record<string, string>,
  onProgress?: (progress: number) => void
): Promise<RespostaIA> {
  const prompt = `Você é uma IA especialista em governança de compras empresariais.

Com base nas seguintes informações da entrevista, gere uma política de aprovação de pedidos de compra:

ENTREVISTA:
- Faixas de Valor: ${dadosEntrevista.faixas_valor}
- Aprovadores: ${dadosEntrevista.aprovadores}
- SLA: ${dadosEntrevista.sla}
- Documentos: ${dadosEntrevista.documentos}
- CAPEX: ${dadosEntrevista.capex}
- Escalonamento: ${dadosEntrevista.escalonamento}
- Especiais: ${dadosEntrevista.especiais}
- Exceções: ${dadosEntrevista.excecoes}

IMPORTANTE: Responda APENAS o JSON puro, sem blocos de código, sem markdown, sem texto adicional.

Use exatamente este formato:
{
  "versao": "1.0",
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
      "OPEX": { "extra": false },
      "CAPEX": { "extra": true, "aprovadores_adicionais": ["cfo"], "sla_extra": 24 }
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
  "resumo": "Descrição clara e objetiva da política",
  "duvidas": ["dúvida 1", "dúvida 2"],
  "riscos": ["risco 1", "risco 2"],
  "sugestoes": ["sugestão 1", "sugestão 2"],
  "proximos_passos": ["passo 1", "passo 2"]
}

REGRAS:
- Use apenas papéis válidos: gerente, diretor, cfo, ceo
- max_valor e sla_horas devem ser números positivos
- Cada faixa deve ter pelo menos um aprovador
- Se CAPEX mencionado, configure como categoria extra
- Seja criativo mas realista na interpretação das informações
- Documente dúvidas e riscos de forma detalhada`;

  onProgress?.(30);

  const result = await geminiModel.generateContent(prompt);
  const response = result.response.text();

  onProgress?.(80);

  try {
    // Tentar parsear JSON direto
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

    // Tentar extrair JSON de markdown (fallback)
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as RespostaIA;
    }

    // Fallback: política padrão
    return {
      versao: '1.0',
      resumo: 'Política padrão gerada devido a erro na IA',
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
      duvidas: ['Erro na geração da IA - política padrão aplicada'],
      riscos: ['Política pode não refletir necessidades reais'],
      sugestoes: ['Revisar manualmente a política gerada'],
      proximos_passos: ['Validar política com stakeholders'],
    };
  }
}

export async function POST(_request: Request) {
  try {
    // Obter FormData da requisição
    const formData = await request.formData();

    // Validar campos obrigatórios
    const validation = validateFormData(formData);
    if (!validation.isValid) {
      return Response.json(
        {
          success: false,
          _error: 'Dados de entrada inválidos',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Sanitizar e validar conteúdo
    const sanitization = sanitizeAndValidateContent(formData);
    if (!sanitization.isValid) {
      return Response.json(
        {
          success: false,
          _error: 'Erro na sanitização dos dados',
          warnings: sanitization.warnings,
        },
        { status: 400 }
      );
    }

    console.log(
      '🔍 Dados validados e sanitizados:',
      sanitization.sanitizedData
    );
    if (sanitization.warnings.length > 0) {
      console.log('⚠️ Avisos de segurança:', sanitization.warnings);
    }

    // Implementar streaming response
    const encoder = new TextEncoder();
    const stream = new Stream({
      async start(controller) {
        const _startTime = Date.now();
        let streamFailed = false;

        try {
          // Enviar status inicial
          controller.enqueue(
            encoder.encode('data: {"status": "iniciando", "progress": 0}\n\n')
          );

          // Gerar política com progresso
          const resultado = await gerarPoliticaComGemini(
            sanitization.sanitizedData,
            progress => {
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: {"status": "gerando", "progress": ${progress}}\n\n`
                  )
                );
              } catch (streamError) {
                console.warn(
                  '⚠️ Erro no streaming, continuando sem stream:',
                  streamError
                );
                streamFailed = true;
              }
            }
          );

          controller.enqueue(
            encoder.encode('data: {"status": "validando", "progress": 90}\n\n')
          );

          // Validar política gerada
          const validationResult = await validatePolicyWithOPA(resultado.json);

          const endTime = Date.now();
          const responseTime = endTime - startTime;

          // Preparar resposta final no formato especificado
          const finalResponse = {
            versao: resultado.versao,
            json: resultado.json,
            resumo: resultado.resumo,
            duvidas: resultado.duvidas,
            riscos: resultado.riscos,
            sugestoes: resultado.sugestoes,
            proximos_passos: resultado.proximos_passos,
            validation: validationResult,
            performance: {
              response_time_ms: responseTime,
              stream_failed: streamFailed,
              security_warnings: sanitization.warnings,
            },
          };

          // Enviar resultado final
          controller.enqueue(
            encoder.encode(
              `data: {"status": "completo", "data": ${JSON.stringify(finalResponse)}}\n\n`
            )
          );

          console.log(`✅ Streaming completo em ${responseTime}ms`);
          controller.close();
        } catch (error) {
          console.error('❌ Erro no streaming:', error);
          streamFailed = true;

          // Tentar fallback para resposta completa
          try {
            const fallbackResult = await gerarPoliticaComGemini(
              sanitization.sanitizedData
            );
            const fallbackResponse = {
              versao: fallbackResult.versao,
              json: fallbackResult.json,
              resumo: fallbackResult.resumo,
              duvidas: fallbackResult.duvidas,
              riscos: fallbackResult.riscos,
              sugestoes: fallbackResult.sugestoes,
              proximos_passos: fallbackResult.proximos_passos,
              validation: {
                valid: false,
                errors: ['Fallback usado devido a erro'],
                warnings: [],
                suggestions: [],
                validation_time_ms: 0,
              },
              performance: {
                response_time_ms: Date.now() - startTime,
                stream_failed: true,
                fallback_used: true,
                security_warnings: sanitization.warnings,
              },
            };

            controller.enqueue(
              encoder.encode(
                `data: {"status": "fallback_completo", "data": ${JSON.stringify(fallbackResponse)}}\n\n`
              )
            );
          } catch (fallbackError) {
            controller.enqueue(
              encoder.encode(
                `data: {"status": "erro", "error": "${error instanceof Error ? error.message : 'Erro desconhecido'}"}\n\n`
              )
            );
          }

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-AppFin-Version': '0.5',
      },
    });
  } catch (error) {
    console.error('❌ Erro na API de streaming:', error);

    // Fallback para resposta JSON completa se streaming falhar completamente
    try {
      const formData = await request.formData();
      const sanitization = sanitizeAndValidateContent(formData);

      if (sanitization.isValid) {
        const fallbackResult = await gerarPoliticaComGemini(
          sanitization.sanitizedData
        );

        return Response.json({
          versao: fallbackResult.versao,
          json: fallbackResult.json,
          resumo: fallbackResult.resumo,
          duvidas: fallbackResult.duvidas,
          riscos: fallbackResult.riscos,
          sugestoes: fallbackResult.sugestoes,
          proximos_passos: fallbackResult.proximos_passos,
          performance: {
            fallback_complete_used: true,
            security_warnings: sanitization.warnings,
          },
        });
      }
    } catch (fallbackError) {
      console.error('❌ Fallback também falhou:', fallbackError);
    }

    return Response.json(
      {
        success: false,
        _error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

// Método GET para documentação
export async function GET() {
  return Response.json({
    name: 'IA Assistente - API com Streaming para Políticas',
    version: '1.0',
    description:
      'API para geração de políticas de aprovação usando Google Gemini 2.5 Flash com streaming',
    endpoint: 'POST /api/politicas/from-ia-stream',
    method: 'POST',
    content_type: 'multipart/form-data',
    required_fields: {
      faixas_valor:
        'string - Faixas de valor para aprovação (ex: "até 1k, 1k-5k, 5k-25k, acima 25k")',
      aprovadores:
        'string - Aprovadores por nível (ex: "gerente, diretor, CFO, CEO")',
      sla: 'string - SLAs por etapa (ex: "4h, 8h, 24h, 48h")',
      documentos:
        'string - Documentos obrigatórios (ex: "descrição, cotação, justificativa, proposta técnica")',
      capex: 'string - Regras para CAPEX (ex: "sim, exige CFO adicional")',
      escalonamento:
        'string - Cadeia de escalonamento (ex: "gerente→diretor→CFO→CEO")',
      especiais: 'string - Situações especiais (ex: "urgência, recorrência")',
      excecoes: 'string - Exceções à política (ex: "categorias especiais")',
    },
    response_format: {
      streaming: 'text/event-stream com progresso',
      fallback: 'application/json completo',
      structure: {
        versao: 'string',
        json: 'PoliticaJson estruturada',
        resumo: 'string',
        duvidas: 'string[]',
        riscos: 'string[]',
        sugestoes: 'string[]',
        proximos_passos: 'string[]',
      },
    },
    features: [
      'Streaming em tempo real com progresso',
      'Validação robusta de entrada',
      'Sanitização de segurança',
      'Fallback automático se stream falhar',
      'Validação OPA da política gerada',
      'Google Gemini 2.5 Flash SDK v0.21.0',
      'Tratamento robusto de erros',
    ],
    security: [
      'Validação de conteúdo perigoso',
      'Sanitização automática',
      'Headers de segurança',
      'Logs de violações',
    ],
    example_request: {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: {
        faixas_valor: 'até 1k, 1k-5k, 5k-25k, acima 25k',
        aprovadores: 'gerente, diretor, CFO, CEO',
        sla: '4h, 8h, 24h, 48h',
        documentos: 'descrição, cotação, justificativa, proposta técnica',
        capex: 'sim, exige CFO adicional',
        escalonamento: 'gerente→diretor→CFO→CEO',
        especiais: 'urgência, recorrência',
        excecoes: 'categorias especiais',
      },
    },
  });
}
