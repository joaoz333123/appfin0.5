'use client';

import { EntrevistaPolitica } from '@/lib/ai';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Schema Zod para validação da entrevista
const entrevistaSchema = z.object({
  faixas_valor: z
    .string()
    .min(1, 'Campo obrigatório')
    .min(5, 'Descreva pelo menos as principais faixas de valor')
    .max(200, 'Máximo 200 caracteres')
    .regex(/\d+/, 'Deve conter pelo menos um valor numérico'),
  aprovadores: z
    .string()
    .min(1, 'Campo obrigatório')
    .min(3, 'Especifique pelo menos um aprovador')
    .max(150, 'Máximo 150 caracteres'),
  sla: z
    .string()
    .min(1, 'Campo obrigatório')
    .min(2, 'Especifique pelo menos um prazo')
    .max(100, 'Máximo 100 caracteres')
    .regex(/\d+/, 'Deve conter pelo menos um valor de tempo'),
  documentos: z
    .string()
    .min(1, 'Campo obrigatório')
    .min(5, 'Liste pelo menos um documento')
    .max(200, 'Máximo 200 caracteres'),
  capex: z
    .string()
    .optional()
    .refine(
      val => !val || val.length <= 100,
      'Máximo 100 caracteres'
    ),
  escalonamento: z
    .string()
    .optional()
    .refine(
      val => !val || val.length <= 150,
      'Máximo 150 caracteres'
    ),
  especiais: z
    .string()
    .optional()
    .refine(
      val => !val || val.length <= 200,
      'Máximo 200 caracteres'
    ),
  excecoes: z
    .string()
    .optional()
    .refine(
      val => !val || val.length <= 200,
      'Máximo 200 caracteres'
    ),
});

type EntrevistaForm = z.infer<typeof entrevistaSchema>;

interface InterviewFormOptimizedProps {
  onSubmit: (entrevista: EntrevistaPolitica) => void;
  loading: boolean;
  progress: number;
  cached?: boolean;
  performance?: { response_time_ms: number; cache_hit: boolean } | null;
}

const questions = [
  {
    id: 'faixas_valor',
    label: 'Faixas de Valor',
    placeholder: 'Ex: até 1k, 1k-5k, 5k-25k, acima 25k',
    description: 'Quais são os limites principais de valor para compras?',
    required: true,
    maxLength: 200,
  },
  {
    id: 'aprovadores',
    label: 'Aprovadores',
    placeholder: 'Ex: gerente, diretor, CFO, CEO',
    description: 'Quem aprova cada faixa de valor?',
    required: true,
    maxLength: 150,
  },
  {
    id: 'sla',
    label: 'SLA por Aprovador',
    placeholder: 'Ex: 4h, 8h, 24h, 48h',
    description: 'Quanto tempo cada aprovador tem para decidir?',
    required: true,
    maxLength: 100,
  },
  {
    id: 'documentos',
    label: 'Documentos Obrigatórios',
    placeholder: 'Ex: descrição, cotação, justificativa, proposta técnica',
    description: 'Quais anexos são obrigatórios por faixa?',
    required: true,
    maxLength: 200,
  },
  {
    id: 'capex',
    label: 'CAPEX (Investimentos)',
    placeholder: 'Ex: sim, exige CFO adicional',
    description: 'Investimentos precisam de aprovação adicional?',
    required: false,
    maxLength: 100,
  },
  {
    id: 'escalonamento',
    label: 'Escalonamento',
    placeholder: 'Ex: gerente→diretor→CFO→CEO',
    description: 'Quem substitui quem quando ausente?',
    required: false,
    maxLength: 150,
  },
  {
    id: 'especiais',
    label: 'Casos Especiais',
    placeholder: 'Ex: urgência, recorrência',
    description: 'Há regras para urgência ou recorrência?',
    required: false,
    maxLength: 200,
  },
  {
    id: 'excecoes',
    label: 'Exceções',
    placeholder: 'Ex: categorias especiais',
    description: 'Alguma categoria ou situação especial?',
    required: false,
    maxLength: 200,
  },
];

// Componente helper para campos validados da entrevista
const ValidatedInputField = ({
  question,
  register,
  errors,
  touchedFields,
  watch,
  disabled = false
}: {
  question: any;
  register: any;
  errors: any;
  touchedFields: any;
  watch: any;
  disabled?: boolean;
}) => {
  const hasError = errors[question.id];
  const isTouched = touchedFields[question.id];
  const isValid = isTouched && !hasError;
  const currentValue = watch(question.id) || '';

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        {question.label}
        {question.required && <span className="text-red-500">*</span>}
        {isValid && <Check className="w-4 h-4 text-green-600" />}
        {hasError && <AlertCircle className="w-4 h-4 text-red-600" />}
      </label>

      <input
        {...register(question.id)}
        type="text"
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 transition-colors duration-200
          ${hasError
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
            : isValid
              ? 'border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        placeholder={question.placeholder}
        disabled={disabled}
      />

      <div className="flex justify-between text-xs">
        {!hasError && question.description && (
          <span className="text-gray-500">{question.description}</span>
        )}
        {hasError && (
          <span className="text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {hasError.message}
          </span>
        )}
        <span className={`text-gray-400 ${currentValue.length > question.maxLength * 0.8 ? 'text-orange-500' : ''}`}>
          {currentValue.length}/{question.maxLength}
        </span>
      </div>
    </div>
  );
};

// Hook para debounce
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  (() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  },
    [value, delay]);

  return debouncedValue;
};

export default function InterviewFormOptimized({
  onSubmit,
  loading,
  progress,
  cached = false,
  performance,
}: InterviewFormOptimizedProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, touchedFields, isValid },
  } = useForm<EntrevistaForm>({
    resolver: zodResolver(entrevistaSchema),
    mode: 'onBlur', // Validação ao sair do campo
    reValidateMode: 'onChange', // Re-validação durante digitação
  });

  const handleFormSubmit = useCallback(
    (data: EntrevistaForm) => {
      onSubmit(data);
    },
    [onSubmit]
  );

  return (
    <div className='bg-white rounded-lg shadow-lg p-6'>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
          🤖 Entrevista para IA
        </h2>
        <p className='text-gray-600'>
          Responda as perguntas abaixo para que a IA gere sua política de
          aprovação
        </p>

        {/* Indicador de cache */}
        {cached && (
          <div className='mt-2 p-2 bg-green-50 border border-green-200 rounded-md'>
            <div className='flex items-center space-x-2'>
              <span className='text-green-600'>⚡</span>
              <span className='text-sm text-green-800 font-medium'>
                Resultado em cache - resposta instantânea!
              </span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-6'>
        {questions.map(question => (
          <ValidatedInputField
            key={question.id}
            question={question}
            register={register}
            errors={errors}
            touchedFields={touchedFields}
            watch={watch}
            disabled={loading}
          />
        ))}

        <button
          type='submit'
          disabled={loading || !isValid}
          className={`
            w-full font-medium py-3 px-4 rounded-md transition-all duration-200
            flex items-center justify-center space-x-2
            ${loading || !isValid
              ? 'bg-gray-400 cursor-not-allowed opacity-50'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          {loading ? (
            <>
              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
              <span>Gerando Política...</span>
            </>
          ) : (
            <>
              {isValid ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>🤖</span>
              <span>Gerar Política com IA</span>
            </>
          )}
        </button>

        {/* Indicador de validação do formulário */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">
                Complete os campos obrigatórios:
              </span>
            </div>
            <ul className="mt-2 text-sm text-red-700 space-y-1">
              {Object.entries(errors).map(([field, error]: [string, any]) => (
                <li key={field} className="flex items-center space-x-1">
                  <span>•</span>
                  <span>
                    {questions.find(q => q.id === field)?.label}: {error.message}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>

      {/* Loading com progresso */}
      {loading && (
        <div className='mt-4 p-4 bg-blue-50 rounded-md'>
          <div className='space-y-3'>
            <div className='flex items-center space-x-2'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
              <span className='text-sm text-blue-600'>
                IA está analisando suas respostas e gerando a política...
              </span>
            </div>

            {/* Barra de progresso */}
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out'
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className='flex justify-between text-xs text-blue-600'>
              <span>{progress}% concluído</span>
              {performance && (
                <span>
                  {performance.cache_hit
                    ? 'Cache hit'
                    : `${performance.response_time_ms}ms`}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Métricas de performance */}
      {performance && !loading && (
        <div className='mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md'>
          <div className='flex justify-between items-center text-sm'>
            <span className='text-gray-600'>Performance:</span>
            <div className='flex items-center space-x-4'>
              {performance.cache_hit ? (
                <span className='text-green-600 font-medium'>⚡ Cache Hit</span>
              ) : (
                <span className='text-blue-600 font-medium'>
                  ⏱️ {performance.response_time_ms}ms
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
