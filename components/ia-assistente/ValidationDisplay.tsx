'use client';

import { ValidationResult } from '@/lib/policy';

interface ValidationDisplayProps {
  validation: ValidationResult | null;
}

export default function ValidationDisplay({
  validation,
}: ValidationDisplayProps) {
  if (!validation) return null;

  return (
    <div className='space-y-4'>
      {/* Status Principal */}
      <div
        className={`p-4 rounded-lg border-2 ${
          validation.valid
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}
      >
        <div className='flex items-center space-x-2'>
          <div
            className={`w-4 h-4 rounded-full ${
              validation.valid ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></div>
          <span
            className={`font-medium ${
              validation.valid ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {validation.valid ? '✅ Política Válida' : '❌ Política Inválida'}
          </span>
        </div>
      </div>

      {/* Erros */}
      {validation.errors.length > 0 && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <h4 className='text-sm font-medium text-red-800 mb-2'>
            ❌ Erros Encontrados
          </h4>
          <ul className='space-y-1'>
            {validation.errors.map((error, index) => (
              <li key={index} className='text-sm text-red-700'>
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <h4 className='text-sm font-medium text-yellow-800 mb-2'>
            ⚠️ Avisos
          </h4>
          <ul className='space-y-1'>
            {validation.warnings.map((warning, index) => (
              <li key={index} className='text-sm text-yellow-700'>
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sugestões */}
      {validation.suggestions.length > 0 && (
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <h4 className='text-sm font-medium text-blue-800 mb-2'>
            💡 Sugestões
          </h4>
          <ul className='space-y-1'>
            {validation.suggestions.map((suggestion, index) => (
              <li key={index} className='text-sm text-blue-700'>
                • {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Performance */}
      {validation.validation_time_ms !== undefined && (
        <div className='bg-gray-50 border border-gray-200 rounded-lg p-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-600'>Tempo de validação:</span>
            <span className='text-sm font-medium text-gray-800'>
              {validation.validation_time_ms}ms
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
