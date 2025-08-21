import { useState } from 'react';
import { EntrevistaPolitica, RespostaIA } from '@/lib/ai';
import { ValidationResult } from '@/lib/policy';

export const useIAAssistant = () => {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<RespostaIA | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gerarPolitica = async (entrevista: EntrevistaPolitica) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/politicas/from-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entrevista }),
      });

      const _data = await response.json();

      if (data.success) {
        setResultado(data.data);
        setValidation(data.validation);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao gerar política');
    } finally {
      setLoading(false);
    }
  };

  const salvarPolitica = async () => {
    if (!resultado) return false;

    try {
      const response = await fetch('/api/politicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: `Política ${resultado.versao}`,
          descricao: resultado.resumo,
          politica: resultado.json,
          versao: resultado.versao,
        }),
      });

      if (response.ok) {
        return true;
      } else {
        setError('Erro ao salvar política');
        return false;
      }
    } catch (err) {
      setError('Erro ao salvar política');
      return false;
    }
  };

  const limparResultado = () => {
    setResultado(null);
    setValidation(null);
    setError(null);
  };

  return {
    loading,
    resultado,
    validation,
    error,
    gerarPolitica,
    salvarPolitica,
    limparResultado,
  };
};
