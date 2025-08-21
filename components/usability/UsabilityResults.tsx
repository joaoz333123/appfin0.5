// components/usability/UsabilityResults.tsx
'use client';

import { useState } from 'react';

interface TestSectionProps {
  title: string;
  score: number;
  details: any;
  checklist: string[];
}

function TestSection({ title, score, details, checklist }: TestSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 80) return 'bg-yellow-100';
    if (score >= 70) return 'bg-orange-100';
    return 'bg-red-100';
  };

  return (
    <div className='border rounded-lg p-4'>
      <div
        className='flex items-center justify-between cursor-pointer'
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className='text-lg font-semibold'>{title}</h3>
        <div className='flex items-center space-x-2'>
          <span className={`text-lg font-bold ${getScoreColor(score)}`}>
            {Math.round(score)}/100
          </span>
          <button className='text-gray-500 hover:text-gray-700'>
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
        <div
          className={`h-2 rounded-full ${getScoreBg(score)}`}
          style={{ width: `${score}%` }}
        ></div>
      </div>

      {isExpanded && (
        <div className='mt-4 space-y-3'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {checklist.map((item, index) => (
              <div key={index} className='flex items-center space-x-2'>
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                <span className='text-sm text-gray-700'>{item}</span>
              </div>
            ))}
          </div>

          {details && (
            <div className='mt-4 p-3 bg-gray-50 rounded'>
              <h4 className='font-medium mb-2'>Detalhes Técnicos:</h4>
              <pre className='text-xs text-gray-600 overflow-x-auto'>
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecommendationsSection({ results }: { results: any }) {
  const generateRecommendations = () => {
    const recommendations = [];

    if (results.performance?.overall < 80) {
      recommendations.push('🚀 Otimizar performance da interface');
    }

    if (results.accessibility?.overall < 80) {
      recommendations.push(
        '♿ Melhorar acessibilidade e navegação por teclado'
      );
    }

    if (results.formFilling?.score < 80) {
      recommendations.push('📝 Simplificar formulário e melhorar validação');
    }

    if (results.generation?.score < 80) {
      recommendations.push('⚡ Melhorar feedback durante geração de políticas');
    }

    if (results.validation?.score < 80) {
      recommendations.push('✅ Melhorar apresentação dos resultados');
    }

    if (results.responsiveness?.overall < 80) {
      recommendations.push('📱 Otimizar responsividade para mobile');
    }

    if (recommendations.length === 0) {
      recommendations.push('🎉 Excelente! A interface está bem otimizada');
    }

    return recommendations;
  };

  return (
    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
      <h3 className='text-lg font-semibold text-blue-900 mb-3'>
        💡 Recomendações
      </h3>
      <ul className='space-y-2'>
        {generateRecommendations().map((rec, index) => (
          <li key={index} className='flex items-start space-x-2'>
            <span className='text-blue-600 mt-1'>•</span>
            <span className='text-blue-800'>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function UsabilityResults({ results }: { results: any }) {
  const calculateOverallScore = () => {
    if (results.overallScore) return results.overallScore;

    const scores = [
      results.firstImpression?.score,
      results.formFilling?.score,
      results.generation?.score,
      results.validation?.score,
      results.save?.score,
      results.responsiveness?.overall,
      results.accessibility?.overall,
      results.performance?.overall,
    ].filter(score => score !== undefined);

    return scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
  };

  const overallScore = calculateOverallScore();

  return (
    <div className='mt-6 space-y-6'>
      <div className='bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border'>
        <h3 className='text-xl font-bold text-gray-900 mb-2'>
          🏆 Score Geral: {Math.round(overallScore)}/100
        </h3>
        <div className='w-full bg-gray-200 rounded-full h-3'>
          <div
            className='bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500'
            style={{ width: `${overallScore}%` }}
          ></div>
        </div>
        <p className='text-sm text-gray-600 mt-2'>
          Teste executado em: {new Date().toLocaleString('pt-BR')}
        </p>
      </div>

      {/* 1. Primeira Impressão */}
      {results.firstImpression && (
        <TestSection
          title='1. Primeira Impressão'
          score={results.firstImpression.score || 0}
          details={results.firstImpression}
          checklist={[
            'Página carrega em < 3 segundos',
            'Loading state visível',
            'Título e descrição claros',
            'Layout responsivo',
          ]}
        />
      )}

      {/* 2. Preenchimento do Formulário */}
      {results.formFilling && (
        <TestSection
          title='2. Preenchimento do Formulário'
          score={results.formFilling.score || 0}
          details={results.formFilling}
          checklist={[
            'Campos têm labels claros',
            'Validação em tempo real',
            'Mensagens de erro claras',
            'Progresso visível',
          ]}
        />
      )}

      {/* 3. Geração da Política */}
      {results.generation && (
        <TestSection
          title='3. Geração da Política'
          score={results.generation.score || 0}
          details={results.generation}
          checklist={[
            'Indicador de progresso',
            'Tempo estimado visível',
            'Status atual visível',
            'Possibilidade de cancelar',
          ]}
        />
      )}

      {/* 4. Validação e Preview */}
      {results.validation && (
        <TestSection
          title='4. Validação e Preview'
          score={results.validation.score || 0}
          details={results.validation}
          checklist={[
            'Política bem formatada',
            'Resumo claro',
            'Riscos destacados',
            'Sugestões visíveis',
          ]}
        />
      )}

      {/* 5. Salvamento */}
      {results.save && (
        <TestSection
          title='5. Salvamento e Conclusão'
          score={results.save.score || 0}
          details={results.save}
          checklist={[
            'Confirmação antes de salvar',
            'Feedback de sucesso',
            'Opção de rascunho',
            'Próximos passos claros',
          ]}
        />
      )}

      {/* 6. Responsividade */}
      {results.responsiveness && (
        <TestSection
          title='6. Responsividade'
          score={results.responsiveness.overall || 0}
          details={results.responsiveness}
          checklist={[
            'Interface adaptada para touch',
            'Campos adequados para mobile',
            'Layout otimizado para desktop',
            'Performance otimizada',
          ]}
        />
      )}

      {/* 7. Acessibilidade */}
      {results.accessibility && (
        <TestSection
          title='7. Acessibilidade'
          score={results.accessibility.overall || 0}
          details={results.accessibility}
          checklist={[
            'Navegação por teclado',
            'Suporte a leitores de tela',
            'Contraste adequado',
            'Foco visível',
          ]}
        />
      )}

      {/* 8. Performance */}
      {results.performance && (
        <TestSection
          title='8. Performance'
          score={results.performance.overall || 0}
          details={results.performance}
          checklist={[
            'Carregamento inicial < 3s',
            'Geração de política < 10s',
            'Validação < 2s',
            'Salvamento < 3s',
          ]}
        />
      )}

      {/* Recomendações */}
      <RecommendationsSection results={results} />
    </div>
  );
}
