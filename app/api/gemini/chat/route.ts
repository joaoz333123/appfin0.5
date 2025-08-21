import {
    checkContentSecurity,
    logSecurityViolation,
    sanitizeContent,
} from '@/lib/security';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Obter modelo da variável de ambiente ou usar padrão
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export async function POST(_request: Request) {
  try {
    const formData = await request.formData();
    const message = formData.get('message') as string;
    const settings = JSON.parse(formData.get('settings') as string);
    const storageFiles = JSON.parse(formData.get('storageFiles') as string);
    const attachments = formData.getAll('attachments') as File[];

    // Configurar o modelo Gemini
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        maxOutputTokens: Math.min(settings.maxTokens || 24000, 24000),
        temperature: Math.min(settings.temperature || 1.0, 1.0),
      },
    });

    // Preparar contexto baseado nas configurações
    const systemPrompt = `Você é o Gemini avançado do AppFin, um sistema de controle de compras.

Funcionalidades disponíveis:
- Web : ${settings.web ? 'ATIVO' : 'INATIVO'}
- Deep Research: ${settings.deepResearch ? 'ATIVO' : 'INATIVO'}
- Storage Access: ${settings.storageAccess ? 'ATIVO' : 'INATIVO'}
- File Read: ${settings.fileRead ? 'ATIVO' : 'INATIVO'}
- File Write: ${settings.fileWrite ? 'ATIVO' : 'INATIVO'}
- File Edit: ${settings.fileEdit ? 'ATIVO' : 'INATIVO'}

REGRAS DE SEGURANÇA CRÍTICAS:
1. NUNCA execute, compile ou modifique código do sistema
2. NUNCA acesse, leia ou modifique arquivos do AppFin
3. NUNCA execute comandos de sistema ou terminal
4. NUNCA tente instalar, atualizar ou remover software
5. NUNCA acesse variáveis de ambiente ou configurações do servidor
6. NUNCA tente conectar a bancos de dados externos
7. NUNCA execute operações de rede ou HTTP não autorizadas
8. Preserve a integridade dos dados do AppFin
9. Seja criativo e útil nas respostas
10. Adapte-se ao contexto do usuário
11. Forneça respostas detalhadas e completas

Contexto do AppFin:
- Sistema de aprovação de pedidos de compra
- Controle de orçamentos e comprometidos
- Gestão de políticas de aprovação
- Sistema de anexos e documentos

Seja criativo, útil e detalhado em suas respostas.`;

    // Processar anexos se houver
    let attachmentContext = '';
    if (attachments.length > 0) {
      attachmentContext = '\n\nANEXOS RECEBIDOS:\n';
      for (const attachment of attachments) {
        attachmentContext += `- ${attachment.name} (${attachment.type}, ${attachment.size} bytes)\n`;

        // Se for imagem, adicionar análise visual
        if (attachment.type.startsWith('image/')) {
          attachmentContext += `  [ANÁLISE VISUAL: Analise esta imagem e extraia informações relevantes]\n`;
        }

        // Se for PDF, adicionar extração de texto
        if (attachment.type === 'application/pdf') {
          attachmentContext += `  [EXTRAÇÃO DE TEXTO: Extraia e analise o conteúdo deste PDF]\n`;
        }
      }
    }

    // Processar arquivos do storage se selecionados
    let storageContext = '';
    if (settings.storageAccess && storageFiles.length > 0) {
      storageContext = '\n\nARQUIVOS DO STORAGE SELECIONADOS:\n';

      for (const fileId of storageFiles) {
        try {
          // Buscar informações do arquivo
          const { _data: fileData, error } = await supabase
            .from('anexos')
            .select('*')
            .eq('id', fileId)
            .single();

          if (fileData) {
            storageContext += `- ${fileData.tipo}: ${fileData.url}\n`;

            // Se tem texto extraído, incluir
            if (fileData.texto_extraido) {
              storageContext += `  Conteúdo: ${fileData.texto_extraido.substring(0, 500)}...\n`;
            }

            // Se fileRead está ativo, tentar ler o arquivo
            if (settings.fileRead) {
              storageContext += `  [LEITURA: Analise este arquivo e extraia informações relevantes]\n`;
            }
          }
        } catch (error) {
          console.error('Erro ao processar arquivo do storage:', error);
        }
      }
    }

    // Adicionar contexto de dados do AppFin
    let dataContext = '';
    if (settings.storageAccess) {
      try {
        // Buscar dados relevantes
        const { _data: pedidos } = await supabase
          .from('pedidos')
          .select('*')
          .order('criado_em', { ascending: false })
          .limit(10);

        const { _data: orcamentos } = await supabase
          .from('orcamentos')
          .select('*')
          .order('mes', { ascending: false })
          .limit(10);

        if (pedidos && orcamentos) {
          dataContext = '\n\nDADOS ATUAIS DO APPFIN:\n';
          dataContext += `Pedidos recentes: ${pedidos.length}\n`;
          dataContext += `Orçamentos: ${orcamentos.length}\n`;

          // Incluir alguns dados de exemplo
          if (pedidos.length > 0) {
            dataContext += '\nÚltimos pedidos:\n';
            pedidos.slice(0, 3).forEach(pedido => {
              dataContext += `- ${pedido.titulo} (R$ ${pedido.valor}, ${pedido.estado})\n`;
            });
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    }

    // Construir prompt final
    const fullPrompt = `${systemPrompt}${attachmentContext}${storageContext}${dataContext}

PERGUNTA DO USUÁRIO: ${message}

Seja criativo, detalhado e útil em sua resposta. Adapte-se ao contexto e forneça informações completas.`;

    // Gerar resposta
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Verificar segurança do conteúdo
    const securityCheck = checkContentSecurity(text);

    let finalText = text;
    if (!securityCheck.isSafe) {
      logSecurityViolation(text, 'Gemini Chat API');
      finalText = sanitizeContent(text);
    }

    // Processar operações de arquivo se solicitado (APENAS SIMULAÇÃO)
    let storageModified = false;
    if (settings.fileWrite || settings.fileEdit) {
      // Verificar se a resposta indica necessidade de escrita/edição
      if (
        text.toLowerCase().includes('criar') ||
        text.toLowerCase().includes('editar') ||
        text.toLowerCase().includes('salvar') ||
        text.toLowerCase().includes('atualizar')
      ) {
        // SEMPRE simular operação de escrita (NUNCA executar)
        storageModified = true;
        console.log(
          '🔒 Operação de escrita/edição detectada - APENAS SIMULAÇÃO por segurança'
        );
      }
    }

    return NextResponse.json({
      content: finalText,
      metadata: {
        web: settings.web,
        deepResearch: settings.deepResearch,
        storageAccess: settings.storageAccess,
        fileOperations: [
          settings.fileRead ? 'read' : '',
          settings.fileWrite ? 'write' : '',
          settings.fileEdit ? 'edit' : '',
        ].filter(Boolean),
        storageModified,
        securityWarning: !securityCheck.isSafe
          ? 'Conteúdo potencialmente perigoso detectado'
          : null,
        securityDetails: !securityCheck.isSafe
          ? {
              warnings: securityCheck.warnings,
              blockedContent: securityCheck.blockedContent,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Erro no chat do Gemini:', error);
    return NextResponse.json(
      { _error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
