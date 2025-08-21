import { ValidationResult, validatePolicyWithOPA } from './policy';

export const validatePolicyAsync = async (
  politica: any
): Promise<ValidationResult> => {
  return new Promise(resolve => {
    // Simular validação em background para não bloquear a resposta
    setTimeout(() => {
      try {
        const result = validatePolicyWithOPA(politica);
        resolve(result);
      } catch (error) {
        // Em caso de erro na validação, retornar resultado básico
        resolve({
          valid: false,
          errors: [
            `Erro na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          ],
          warnings: [],
          suggestions: [],
          validation_time_ms: 0,
        });
      }
    }, 100); // Delay mínimo para simular processamento assíncrono
  });
};

// Função para validação em lote (útil para cache)
export const validatePoliciesBatch = async (
  politicas: any[]
): Promise<ValidationResult[]> => {
  const promises = politicas.map(politica => validatePolicyAsync(politica));
  return Promise.all(promises);
};

// Função para validação com timeout
export const validatePolicyWithTimeout = async (
  politica: any,
  timeoutMs: number = 5000
): Promise<ValidationResult> => {
  return Promise.race([
    validatePolicyAsync(politica),
    new Promise<ValidationResult>(resolve => {
      setTimeout(() => {
        resolve({
          valid: false,
          errors: ['Timeout na validação'],
          warnings: [],
          suggestions: [],
          validation_time_ms: timeoutMs,
        });
      }, timeoutMs);
    }),
  ]);
};
