import { executeWithRetry, testSupabaseConnection } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(_request: Request) {
  try {
    console.log('🔍 Health check iniciado...');

    // Teste básico de conectividade
    const connectionTest = await executeWithRetry(
      () => testSupabaseConnection(),
      2, // máximo 2 tentativas
      500 // delay de 500ms
    );

    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      supabase: connectionTest,
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        nodeEnv: process.env.NODE_ENV,
      },
    };

    // Se o Supabase não está funcionando, retornar status degraded
    if (!connectionTest.success) {
      return NextResponse.json(
        {
          ...response,
          status: 'degraded',
          message: 'Supabase connection issues detected',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Health check falhou:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        _error: error instanceof Error ? error.message : 'Health check failed',
        environment: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          nodeEnv: process.env.NODE_ENV,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(_request: Request) {
  try {
    const { force_refresh } = await request.json();

    if (force_refresh) {
      console.log('🔄 Forçando refresh do schema cache...');
      // Force refresh seria implementado aqui se necessário
    }

    return GET(request);
  } catch (error) {
    return NextResponse.json(
      {
        _error: 'Invalid request body',
      },
      { status: 400 }
    );
  }
}
