'use client';

import { RespostaIA } from '@/lib/ai';

interface AIResultsProps {
  resultado: RespostaIA | null;
}

export default function AIResults({ resultado }: AIResultsProps) {
  if (!resultado) return null;

  return (
    <div className='space-y-6'>
      {/* Resumo */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
        <h3 className='text-lg font-semibold text-blue-900 mb-2'>
          📋 Resumo da Política
        </h3>
        <p className='text-blue-800'>{resultado.resumo}</p>
        <div className='mt-2 text-sm text-blue-600'>
          Versão: {resultado.versao}
        </div>
      </div>

      {/* Dúvidas */}
      {resultado.duvidas.length > 0 && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <h3 className='text-lg font-semibold text-yellow-900 mb-2'>
            ❓ Dúvidas Identificadas
          </h3>
          <ul className='space-y-2'>
            {resultado.duvidas.map((duvida, index) => (
              <li key={index} className='text-yellow-800'>
                • {duvida}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Riscos */}
      {resultado.riscos.length > 0 && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <h3 className='text-lg font-semibold text-red-900 mb-2'>
            ⚠️ Riscos Identificados
          </h3>
          <ul className='space-y-2'>
            {resultado.riscos.map((risco, index) => (
              <li key={index} className='text-red-800'>
                • {risco}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sugestões */}
      {resultado.sugestoes.length > 0 && (
        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
          <h3 className='text-lg font-semibold text-green-900 mb-2'>
            💡 Sugestões de Melhoria
          </h3>
          <ul className='space-y-2'>
            {resultado.sugestoes.map((sugestao, index) => (
              <li key={index} className='text-green-800'>
                • {sugestao}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Próximos Passos */}
      {resultado.proximos_passos.length > 0 && (
        <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
          <h3 className='text-lg font-semibold text-purple-900 mb-2'>
            📋 Próximos Passos
          </h3>
          <ul className='space-y-2'>
            {resultado.proximos_passos.map((passo, index) => (
              <li key={index} className='text-purple-800'>
                {index + 1}. {passo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
