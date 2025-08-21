// hooks/useUsabilityTest.ts
'use client';

import { useState, useCallback } from 'react';

interface UseUsabilityTestReturn {
  isRunning: boolean;
  currentTest: string;
  progress: number;
  results: any;
  error: string | null;
  runFullTest: () => Promise<void>;
  runSpecificTest: (testType: string) => Promise<void>;
  resetResults: () => void;
}

export function useUsabilityTest(): UseUsabilityTestReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runFullTest = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setError(null);

    try {
      const response = await fetch('/api/usability-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testType: 'full' }),
      });

      if (!response.ok) {
        throw new Error('Erro na requisição');
      }

      const _data = await response.json();

      if (data.success) {
        setResults(data.results);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  }, []);

  const runSpecificTest = useCallback(async (testType: string) => {
    setIsRunning(true);
    setCurrentTest(testType);
    setError(null);

    try {
      const response = await fetch('/api/usability-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testType }),
      });

      if (!response.ok) {
        throw new Error('Erro na requisição');
      }

      const _data = await response.json();

      if (data.success) {
        setResults(data.results);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsRunning(false);
    }
  }, []);

  const resetResults = useCallback(() => {
    setResults(null);
    setError(null);
    setProgress(0);
    setCurrentTest('');
  }, []);

  return {
    isRunning,
    currentTest,
    progress,
    results,
    error,
    runFullTest,
    runSpecificTest,
    resetResults,
  };
}
