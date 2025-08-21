import { useState, useCallback } from 'react';
import { EntrevistaPolitica, RespostaIA } from '@/lib/ai';
import { ValidationResult } from '@/lib/policy';

interface PerformanceMetrics {
  response_time_ms: number;
  cache_hit: boolean;
}

export const useIAAssistantOptimized = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultado, setResultado] = useState<RespostaIA | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(
    null
  );

  const gerarPolitica = useCallback(async (entrevista: EntrevistaPolitica) => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setCached(false);
    setPerformance(null);

    try {
      const response = await fetch('/api/politicas/from-ia-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entrevista }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Stream não disponível');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const _data = JSON.parse(line.slice(6));

              switch (data.status) {
                case 'iniciando':
                  setProgress(0);
                  break;

                case 'gerando':
                  setProgress(data.progress);
                  break;

                case 'completo':
                  setResultado(data.resultado);
                  setValidation(data.validation);
                  setProgress(100);
                  setCached(data.cached || false);
                  setPerformance(data.performance);
                  break;

                case 'erro':
                  setError(data.error);
                  break;
              }
            } catch (e) {
              // Ignorar linhas inválidas
              console.warn('Linha inválida no stream:', line);
            }
          }
        }
      }
    } catch (err) {
      console.error('Erro ao gerar política:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar política');
    } finally {
      setLoading(false);
    }
  }, []);

  const limparResultado = useCallback(() => {
    setResultado(null);
    setValidation(null);
    setError(null);
    setCached(false);
    setPerformance(null);
    setProgress(0);
  }, []);

  const salvarPolitica = useCallback(async () => {
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
  }, [resultado]);

  return {
    loading,
    progress,
    resultado,
    validation,
    error,
    cached,
    performance,
    gerarPolitica,
    salvarPolitica,
    limparResultado,
  };
};
