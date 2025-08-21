// app/api/usability-test/route.ts
import { UsabilityTestRunner } from '@/lib/usability';
import { NextResponse } from 'next/server';

export async function POST(_request: Request) {
  try {
    const { testType } = await request.json();
    const runner = new UsabilityTestRunner();

    let results: any = {};

    switch (testType) {
      case 'full':
        results = {
          firstImpression: await runner.testFirstImpression(),
          formFilling: await runner.testFormFilling(),
          generation: await runner.testPolicyGeneration(),
          validation: await runner.testValidationAndPreview(),
          save: await runner.testAndCompletion(),
          responsiveness: await runner.testResponsiveness(),
          accessibility: await runner.testAccessibility(),
          performance: await runner.testPerformance(),
        };
        break;

      case 'performance':
        results = await runner.testPerformance();
        break;

      case 'accessibility':
        results = await runner.testAccessibility();
        break;

      case 'firstImpression':
        results = await runner.testFirstImpression();
        break;

      case 'formFilling':
        results = await runner.testFormFilling();
        break;

      case 'generation':
        results = await runner.testPolicyGeneration();
        break;

      case 'validation':
        results = await runner.testValidationAndPreview();
        break;

      case 'save':
        results = await runner.testAndCompletion();
        break;

      case 'responsiveness':
        results = await runner.testResponsiveness();
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de teste inválido' },
          { status: 400 }
        );
    }

    // Calcular score geral
    if (testType === 'full') {
      results.overallScore = runner.calculateOverallScore(results);
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro no teste de usabilidade:', error);
    return NextResponse.json(
      {
        success: false,
        _error: 'Erro interno no teste',
      },
      { status: 500 }
    );
  }
}
