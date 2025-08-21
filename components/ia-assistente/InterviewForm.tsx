'use client';

import { useState } from 'react';
import { EntrevistaPolitica } from '@/lib/ai';

interface InterviewFormProps {
  onSubmit: (entrevista: EntrevistaPolitica) => void;
  loading: boolean;
}

const questions = [
  {
    id: 'faixas_valor',
    label: 'Faixas de Valor',
    placeholder: 'Ex: até 1k, 1k-5k, 5k-25k, acima 25k',
    description: 'Quais são os limites principais de valor para compras?',
  },
  {
    id: 'aprovadores',
    label: 'Aprovadores',
    placeholder: 'Ex: gerente, diretor, CFO, CEO',
    description: 'Quem aprova cada faixa de valor?',
  },
  {
    id: 'sla',
    label: 'SLA por Aprovador',
    placeholder: 'Ex: 4h, 8h, 24h, 48h',
    description: 'Quanto tempo cada aprovador tem para decidir?',
  },
  {
    id: 'documentos',
    label: 'Documentos Obrigatórios',
    placeholder: 'Ex: descrição, cotação, justificativa, proposta técnica',
    description: 'Quais anexos são obrigatórios por faixa?',
  },
  {
    id: 'capex',
    label: 'CAPEX (Investimentos)',
    placeholder: 'Ex: sim, exige CFO adicional',
    description: 'Investimentos precisam de aprovação adicional?',
  },
  {
    id: 'escalonamento',
    label: 'Escalonamento',
    placeholder: 'Ex: gerente→diretor→CFO→CEO',
    description: 'Quem substitui quem quando ausente?',
  },
  {
    id: 'especiais',
    label: 'Casos Especiais',
    placeholder: 'Ex: urgência, recorrência',
    description: 'Há regras para urgência ou recorrência?',
  },
  {
    id: 'excecoes',
    label: 'Exceções',
    placeholder: 'Ex: categorias especiais',
    description: 'Alguma categoria ou situação especial?',
  },
];

export default function InterviewForm({
  onSubmit,
  loading,
}: InterviewFormProps) {
  const [formData, setFormData] = useState<EntrevistaPolitica>({});

  const handleInputChange = (id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

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
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {questions.map(question => (
          <div key={question.id} className='space-y-2'>
            <label
              htmlFor={question.id}
              className='block text-sm font-medium text-gray-700'
            >
              {question.label}
            </label>
            <input
              type='text'
              id={question.id}
              placeholder={question.placeholder}
              value={formData[question.id as keyof EntrevistaPolitica] || ''}
              onChange={e => handleInputChange(question.id, e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              disabled={loading}
            />
            <p className='text-sm text-gray-500'>{question.description}</p>
          </div>
        ))}

        <button
          type='submit'
          disabled={loading}
          className='w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2'
        >
          {loading ? (
            <>
              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
              <span>Gerando Política...</span>
            </>
          ) : (
            <>
              <span>🤖</span>
              <span>Gerar Política com IA</span>
            </>
          )}
        </button>
      </form>

      {loading && (
        <div className='mt-4 p-4 bg-blue-50 rounded-md'>
          <div className='flex items-center space-x-2'>
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
            <span className='text-sm text-blue-600'>
              IA está analisando suas respostas e gerando a política...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
