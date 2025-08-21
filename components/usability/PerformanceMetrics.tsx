// components/usability/PerformanceMetrics.tsx
'use client';

interface PerformanceMetricsProps {
  performance: {
    pageLoad: number;
    generation: number;
    validation: number;
    save: number;
    overall: number;
  };
  cached?: boolean;
}

export default function PerformanceMetrics({
  performance,
  cached = false,
}: PerformanceMetricsProps) {
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getPerformanceColor = (time: number, threshold: number) => {
    if (time <= threshold) return 'text-green-600';
    if (time <= threshold * 1.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceStatus = (time: number, threshold: number) => {
    if (time <= threshold) return '✅ Excelente';
    if (time <= threshold * 1.5) return '⚠️ Aceitável';
    return '❌ Lento';
  };

  return (
    <div className='bg-white rounded-lg shadow-lg p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-gray-900'>
          🚀 Métricas de Performance
        </h3>
        {cached && (
          <span className='bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded'>
            Cache Hit
          </span>
        )}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Carregamento da Página */}
        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm font-medium text-gray-700'>
              Carregamento
            </span>
            <span
              className={`text-sm font-bold ${getPerformanceColor(performance.pageLoad, 3000)}`}
            >
              {formatTime(performance.pageLoad)}
            </span>
          </div>
          <div className='text-xs text-gray-600 mb-2'>
            {getPerformanceStatus(performance.pageLoad, 3000)}
          </div>
          <div className='w-full bg-gray-200 rounded-full h-1'>
            <div
              className='bg-blue-600 h-1 rounded-full'
              style={{
                width: `${Math.min((performance.pageLoad / 3000) * 100, 100)}%`,
              }}
            ></div>
          </div>
          <div className='text-xs text-gray-500 mt-1'>Meta: &lt; 3s</div>
        </div>

        {/* Geração de Política */}
        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm font-medium text-gray-700'>Geração</span>
            <span
              className={`text-sm font-bold ${getPerformanceColor(performance.generation, 10000)}`}
            >
              {formatTime(performance.generation)}
            </span>
          </div>
          <div className='text-xs text-gray-600 mb-2'>
            {getPerformanceStatus(performance.generation, 10000)}
          </div>
          <div className='w-full bg-gray-200 rounded-full h-1'>
            <div
              className='bg-green-600 h-1 rounded-full'
              style={{
                width: `${Math.min((performance.generation / 10000) * 100, 100)}%`,
              }}
            ></div>
          </div>
          <div className='text-xs text-gray-500 mt-1'>Meta: &lt; 10s</div>
        </div>

        {/* Validação */}
        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm font-medium text-gray-700'>Validação</span>
            <span
              className={`text-sm font-bold ${getPerformanceColor(performance.validation, 2000)}`}
            >
              {formatTime(performance.validation)}
            </span>
          </div>
          <div className='text-xs text-gray-600 mb-2'>
            {getPerformanceStatus(performance.validation, 2000)}
          </div>
          <div className='w-full bg-gray-200 rounded-full h-1'>
            <div
              className='bg-purple-600 h-1 rounded-full'
              style={{
                width: `${Math.min((performance.validation / 2000) * 100, 100)}%`,
              }}
            ></div>
          </div>
          <div className='text-xs text-gray-500 mt-1'>Meta: &lt; 2s</div>
        </div>

        {/* Salvamento */}
        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm font-medium text-gray-700'>
              Salvamento
            </span>
            <span
              className={`text-sm font-bold ${getPerformanceColor(performance.save, 3000)}`}
            >
              {formatTime(performance.save)}
            </span>
          </div>
          <div className='text-xs text-gray-600 mb-2'>
            {getPerformanceStatus(performance.save, 3000)}
          </div>
          <div className='w-full bg-gray-200 rounded-full h-1'>
            <div
              className='bg-orange-600 h-1 rounded-full'
              style={{
                width: `${Math.min((performance.save / 3000) * 100, 100)}%`,
              }}
            ></div>
          </div>
          <div className='text-xs text-gray-500 mt-1'>Meta: &lt; 3s</div>
        </div>
      </div>

      {/* Score Geral */}
      <div className='mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4'>
        <div className='flex items-center justify-between mb-2'>
          <span className='text-lg font-semibold text-gray-900'>
            Score Geral de Performance
          </span>
          <span className='text-2xl font-bold text-blue-600'>
            {Math.round(performance.overall)}/100
          </span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500'
            style={{ width: `${performance.overall}%` }}
          ></div>
        </div>
        <div className='flex justify-between text-xs text-gray-600 mt-1'>
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* Recomendações de Performance */}
      <div className='mt-4'>
        <h4 className='text-sm font-medium text-gray-900 mb-2'>
          💡 Recomendações:
        </h4>
        <ul className='text-xs text-gray-600 space-y-1'>
          {performance.pageLoad > 3000 && (
            <li>• Otimizar carregamento inicial da página</li>
          )}
          {performance.generation > 10000 && (
            <li>• Melhorar performance da geração de políticas</li>
          )}
          {performance.validation > 2000 && (
            <li>• Otimizar processo de validação</li>
          )}
          {performance.save > 3000 && (
            <li>• Melhorar performance do salvamento</li>
          )}
          {performance.overall >= 90 && (
            <li>• Excelente performance! Manter otimizações</li>
          )}
        </ul>
      </div>
    </div>
  );
}
