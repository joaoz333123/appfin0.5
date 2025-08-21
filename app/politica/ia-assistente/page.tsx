'use client';

import { useIAAssistantOptimized } from '@/hooks/useIAAssistantOptimized';
import InterviewFormOptimized from '@/components/ia-assistente/InterviewFormOptimized';
import PolicyPreview from '@/components/ia-assistente/PolicyPreview';
import PerformanceMetrics from '@/components/ia-assistente/PerformanceMetrics';

export default function IAAssistentePage() {
  const {
    loading,
    progress,
    resultado,
    validation,
    error,
    cached,
    performance,
    gerarPolitica,
    salvarPolitica,
  } = useIAAssistantOptimized();

  const handleSubmit = (entrevista: any) => {
    gerarPolitica(entrevista);
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            🤖 IA Assistente de Políticas
          </h1>
          <p className='text-gray-600'>
            Crie políticas de aprovação de compras de forma inteligente e
            automatizada
          </p>
        </div>

        {/* Layout Principal */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Coluna Esquerda - Formulário */}
          <div>
            <InterviewFormOptimized
              onSubmit={handleSubmit}
              loading={loading}
              progress={progress}
              cached={cached}
              performance={performance}
            />
          </div>

          {/* Coluna Direita - Preview */}
          <div>
            <PolicyPreview
              politica={resultado}
              validation={validation}
              loading={loading}
              on={salvarPolitica}
              error={error}
            />
          </div>
        </div>

        {/* Métricas de Performance */}
        {performance && (
          <PerformanceMetrics performance={performance} cached={cached} />
        )}

        {/* Informações Adicionais */}
        <div className='mt-12 bg-white rounded-lg shadow-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            💡 Como Funciona
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='text-center'>
              <div className='text-3xl mb-2'>📝</div>
              <h4 className='font-medium text-gray-900 mb-2'>
                1. Responda as Perguntas
              </h4>
              <p className='text-sm text-gray-600'>
                Preencha o formulário com as informações sobre suas regras de
                aprovação
              </p>
            </div>
            <div className='text-center'>
              <div className='text-3xl mb-2'>🤖</div>
              <h4 className='font-medium text-gray-900 mb-2'>
                2. IA Analisa e Gera
              </h4>
              <p className='text-sm text-gray-600'>
                A IA analisa suas respostas e gera uma política estruturada
              </p>
            </div>
            <div className='text-center'>
              <div className='text-3xl mb-2'>✅</div>
              <h4 className='font-medium text-gray-900 mb-2'>
                3. Valida e Salva
              </h4>
              <p className='text-sm text-gray-600'>
                A política é validada automaticamente e pode ser salva no
                sistema
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
