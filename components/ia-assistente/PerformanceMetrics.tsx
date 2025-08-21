'use client';

interface PerformanceMetricsProps {
  performance: { response_time_ms: number; cache_hit: boolean } | null;
  cached: boolean;
}

export default function PerformanceMetrics({
  performance,
  cached,
}: PerformanceMetricsProps) {
  if (!performance) return null;

  const getPerformanceColor = (time: number) => {
    if (time < 2000) return 'text-green-600';
    if (time < 5000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (time: number) => {
    if (time < 2000) return '⚡';
    if (time < 5000) return '🟡';
    return '🐌';
  };

  return (
    <div className='bg-white rounded-lg shadow-lg p-4 mb-6'>
      <h3 className='text-lg font-semibold text-gray-900 mb-3'>
        📊 Métricas de Performance
      </h3>

      <div className='grid grid-cols-2 gap-4'>
        {/* Tempo de Resposta */}
        <div className='bg-gray-50 rounded-lg p-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-600'>Tempo de Resposta</span>
            <div className='flex items-center space-x-1'>
              <span
                className={getPerformanceColor(performance.response_time_ms)}
              >
                {getPerformanceIcon(performance.response_time_ms)}
              </span>
              <span
                className={`font-medium ${getPerformanceColor(performance.response_time_ms)}`}
              >
                {performance.cache_hit
                  ? 'Instantâneo'
                  : `${performance.response_time_ms}ms`}
              </span>
            </div>
          </div>
        </div>

        {/* Cache Status */}
        <div className='bg-gray-50 rounded-lg p-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-600'>Cache</span>
            <div className='flex items-center space-x-1'>
              {performance.cache_hit ? (
                <>
                  <span className='text-green-600'>✅</span>
                  <span className='text-green-600 font-medium'>Hit</span>
                </>
              ) : (
                <>
                  <span className='text-blue-600'>🔄</span>
                  <span className='text-blue-600 font-medium'>Miss</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Melhoria de Performance */}
      {performance.cache_hit && (
        <div className='mt-3 p-2 bg-green-50 border border-green-200 rounded-md'>
          <div className='flex items-center space-x-2'>
            <span className='text-green-600'>🚀</span>
            <span className='text-sm text-green-800'>
              Resposta instantânea graças ao cache!
              {performance.response_time_ms > 0 && (
                <span className='font-medium'>
                  {' '}
                  Economia de ~{Math.round(performance.response_time_ms / 1000)}
                  s
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Dicas de Performance */}
      <div className='mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md'>
        <div className='text-xs text-blue-800'>
          <strong>💡 Dica:</strong> Cache válido por 30 minutos. Respostas
          similares serão instantâneas!
        </div>
      </div>
    </div>
  );
}
