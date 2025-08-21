// components/usability/UsabilityTester.tsx
'use client';

import { useState } from 'react';
import { UsabilityTestRunner } from '@/lib/usability';
import UsabilityResults from './UsabilityResults';

export default function UsabilityTester() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const runFullTestSuite = async () => {
    setIsRunning(true);
    setProgress(0);
    const results: any = {
      performance: {},
      functionality: {},
      usability: {},
      accessibility: {},
    };

    const runner = new UsabilityTestRunner();

    try {
      // 1. Testes de Performance
      setCurrentTest('Performance');
      setProgress(12.5);
      results.performance = await runner.testPerformance();

      // 2. Primeira Impressão
      setCurrentTest('Primeira Impressão');
      setProgress(25);
      results.firstImpression = await runner.testFirstImpression();

      // 3. Preenchimento do Formulário
      setCurrentTest('Preenchimento do Formulário');
      setProgress(37.5);
      results.formFilling = await runner.testFormFilling();

      // 4. Geração da Política
      setCurrentTest('Geração da Política');
      setProgress(50);
      results.generation = await runner.testPolicyGeneration();

      // 5. Validação e Preview
      setCurrentTest('Validação e Preview');
      setProgress(62.5);
      results.validation = await runner.testValidationAndPreview();

      // 6. Salvamento
      setCurrentTest('Salvamento e Conclusão');
      setProgress(75);
      results.save = await runner.testAndCompletion();

      // 7. Responsividade
      setCurrentTest('Responsividade');
      setProgress(87.5);
      results.responsiveness = await runner.testResponsiveness();

      // 8. Acessibilidade
      setCurrentTest('Acessibilidade');
      setProgress(100);
      results.accessibility = await runner.testAccessibility();

      // Calcular score geral
      results.overallScore = runner.calculateOverallScore(results);

      setTestResults(results);
    } catch (error) {
      console.error('Erro durante os testes:', error);
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  };

  const runSpecificTest = async (testType: string) => {
    setIsRunning(true);
    setCurrentTest(testType);
    const runner = new UsabilityTestRunner();

    try {
      let result: any = {};

      switch (testType) {
        case 'performance':
          result = await runner.testPerformance();
          break;
        case 'accessibility':
          result = await runner.testAccessibility();
          break;
        case 'firstImpression':
          result = await runner.testFirstImpression();
          break;
        case 'formFilling':
          result = await runner.testFormFilling();
          break;
        case 'generation':
          result = await runner.testPolicyGeneration();
          break;
        case 'validation':
          result = await runner.testValidationAndPreview();
          break;
        case 'save':
          result = await runner.testAndCompletion();
          break;
        case 'responsiveness':
          result = await runner.testResponsiveness();
          break;
        default:
          throw new Error('Tipo de teste inválido');
      }

      setTestResults({ [testType]: result });
    } catch (error) {
      console.error('Erro no teste específico:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className='p-6 bg-white rounded-lg shadow-lg'>
      <h2 className='text-2xl font-bold mb-4'>🧪 Teste de Usabilidade</h2>

      {isRunning && (
        <div className='mb-6'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm font-medium'>
              Executando teste: {currentTest}
            </span>
            <span className='text-sm text-gray-500'>
              {Math.round(progress)}%
            </span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-blue-600 h-2 rounded-full transition-all duration-300'
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
        <button
          onClick={runFullTestSuite}
          disabled={isRunning}
          className='bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors'
        >
          {isRunning ? 'Executando...' : '🧪 Executar Teste Completo'}
        </button>

        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => runSpecificTest('performance')}
            disabled={isRunning}
            className='bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 hover:bg-green-700'
          >
            Performance
          </button>
          <button
            onClick={() => runSpecificTest('accessibility')}
            disabled={isRunning}
            className='bg-purple-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 hover:bg-purple-700'
          >
            Acessibilidade
          </button>
          <button
            onClick={() => runSpecificTest('firstImpression')}
            disabled={isRunning}
            className='bg-orange-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 hover:bg-orange-700'
          >
            Primeira Impressão
          </button>
        </div>
      </div>

      {testResults && <UsabilityResults results={testResults} />}
    </div>
  );
}
