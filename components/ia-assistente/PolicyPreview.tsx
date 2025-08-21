'use client';

import { RespostaIA } from '@/lib/ai';
import { ValidationResult } from '@/lib/policy';
import { useState } from 'react';
import AIResults from './AIResults';
import ValidationDisplay from './ValidationDisplay';

interface PolicyPreviewProps {
  politica: RespostaIA | null;
  validation: ValidationResult | null;
  loading: boolean;
  on: () => Promise<boolean>;
  _error: string | null;
}

export default function PolicyPreview({
  politica,
  validation,
  loading,
  onSave,
  error,
}: PolicyPreviewProps) {
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSuccess] = useState(false);

  const handle = async () => {
    setSaving(true);
    setSuccess(false);

    const success = await on();
    setSuccess(success);
    setSaving(false);
  };

  if (!politica && !loading) {
    return (
      <div className='bg-white rounded-lg shadow-lg p-6'>
        <div className='text-center text-gray-500'>
          <div className='text-6xl mb-4'>🤖</div>
          <h3 className='text-lg font-medium mb-2'>Preview da Política</h3>
          <p>
            Preencha o formulário e clique em "Gerar Política" para ver o
            resultado aqui
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow-lg p-6'>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
          🎨 Preview da Política
        </h2>
        <p className='text-gray-600'>
          Política gerada pela IA e validada automaticamente
        </p>
      </div>

      {loading && (
        <div className='text-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>IA está gerando sua política...</p>
        </div>
      )}

      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
          <div className='flex items-center space-x-2'>
            <span className='text-red-600'>❌</span>
            <span className='text-red-800 font-medium'>Erro:</span>
            <span className='text-red-700'>{error}</span>
          </div>
        </div>
      )}

      {politica && !loading && (
        <div className='space-y-6'>
          {/* Validação */}
          <ValidationDisplay validation={validation} />

          {/* Resultados da IA */}
          <AIResults resultado={politica} />

          {/* JSON da Política */}
          <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
            <h3 className='text-lg font-semibold text-gray-900 mb-3'>
              📄 Política JSON
            </h3>
            <div className='bg-white border border-gray-300 rounded p-3 overflow-auto max-h-96'>
              <pre className='text-sm text-gray-800 whitespace-pre-wrap'>
                {JSON.stringify(politica.json, null, 2)}
              </pre>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className='flex justify-end space-x-3'>
            <button
              onClick={handle}
              disabled={saving || !validation?.valid}
              className={`px-6 py-3 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2 ${
                saving || !validation?.valid
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {saving ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Salvar Política</span>
                </>
              )}
            </button>
          </div>

          {/* Mensagem de Sucesso */}
          {saveSuccess && (
            <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
              <div className='flex items-center space-x-2'>
                <span className='text-green-600'>✅</span>
                <span className='text-green-800 font-medium'>
                  Política salva com sucesso!
                </span>
              </div>
            </div>
          )}

          {/* Aviso se política inválida */}
          {validation && !validation.valid && (
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
              <div className='flex items-center space-x-2'>
                <span className='text-yellow-600'>⚠️</span>
                <span className='text-yellow-800'>
                  A política precisa ser válida para ser salva. Corrija os erros
                  acima.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
