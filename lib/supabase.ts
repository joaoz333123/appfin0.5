import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase com validações
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validação básica das configurações
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase não configurado completamente. URLs/Keys estão undefined.'
  );
}

// Cliente anônimo para operações do frontend
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder_key'
);

// Cliente admin para operações de backend
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder_service_key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Função para verificar conectividade
export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testando conexão com Supabase...');

    // Teste básico de conexão com service role
    const { data, error } = await supabaseAdmin
      .from('politicas')
      .select('count(*)')
      .limit(1);

    if (error) {
      console.error('❌ Erro na conexão Supabase:', error.message);
      return {
        success: false,
        _error: error.message,
        details: error,
      };
    }

    console.log('✅ Conexão Supabase OK');
    return {
      success: true,
      message: 'Conexão estabelecida com sucesso',
      tablesAccessible: ['politicas'],
    };
  } catch (error) {
    console.error('❌ Erro crítico na conexão:', error);
    return {
      success: false,
      _error: error instanceof Error ? error.message : 'Erro desconhecido',
      details: error,
    };
  }
}

// Função retry para operações críticas
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error = new Error('Operação não executada');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        console.log(`✅ Operação Supabase sucedeu na tentativa ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error instanceof Error ? _error: new Error(String(error));
      console.warn(
        `⚠️ Tentativa ${attempt}/${maxRetries} falhou:`,
        lastError.message
      );

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw new Error(
    `Operação falhou após ${maxRetries} tentativas: ${lastError.message}`
  );
}

// Tipos para as tabelas
export interface Politica {
  id: string;
  versao: string;
  json: any;
  criado_por: string;
  criado_em: string;
}

export interface Pedido {
  id: string;
  titulo: string;
  categoria: string;
  cc: string;
  projeto: string;
  valor: number;
  estado:
    | 'rascunho'
    | 'em_aprovacao'
    | 'aprovado'
    | 'reprovado'
    | 'comprometido';
  solicitante_id: string;
  politica_versao: string;
  criado_em: string;
}

export interface Aprovacao {
  id: string;
  pedido_id: string;
  etapa_idx?: number;
  papel_alvo: string;
  aprovador_id: string | null;
  decisao: 'pendente' | 'aprovado' | 'reprovado' | 'ajuste_solicitado';
  comentario: string | null;
  em?: string;
  criado_em: string;
}

export interface Orcamento {
  id: string;
  mes: string;
  cc: string;
  categoria: string;
  orcado: number;
  comprometido: number;
}

export interface Anexo {
  id: string;
  pedido_id: string;
  tipo: string;
  mime: string;
  url: string;
  texto_extraido: string | null;
}

export interface Historico {
  id: string;
  entidade: string;
  entidade_id: string;
  acao: string;
  por: string;
  em: string;
  detalhes_json: any;
}

export interface Dashboard {
  id: string;
  nome: string;
  owner_id: string;
  sql: string;
  spec_json: any;
  narrativa: string;
  criado_em: string;
}

export interface Notificacao {
  id: string;
  user_id: string;
  tipo: 'lembrete' | 'escala' | 'aprovacao' | 'reprovacao';
  payload_json: any;
  lida: boolean;
  criada_em: string;
}
