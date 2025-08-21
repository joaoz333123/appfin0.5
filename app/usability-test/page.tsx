// app/usability-test/page.tsx
'use client';

import UsabilityTester from '@/components/usability/UsabilityTester';

export default function UsabilityTestPage() {
  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            🧪 Teste de Usabilidade - IA Assistente de Políticas
          </h1>
          <p className='text-gray-600'>
            Sistema automatizado para testar a usabilidade da interface da IA
            Assistente
          </p>
        </div>

        {/* Teste de Usabilidade */}
        <UsabilityTester />

        {/* Informações sobre os Testes */}
        <div className='mt-12 bg-white rounded-lg shadow-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            📋 Critérios de Teste
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <div>
              <h4 className='font-medium text-gray-900 mb-2'>
                1. Primeira Impressão
              </h4>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• Carregamento &lt; 3s</li>
                <li>• Loading state visível</li>
                <li>• Título claro</li>
                <li>• Layout responsivo</li>
              </ul>
            </div>
            <div>
              <h4 className='font-medium text-gray-900 mb-2'>2. Formulário</h4>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• Labels claros</li>
                <li>• Validação em tempo real</li>
                <li>• Mensagens de erro</li>
                <li>• Progresso visível</li>
              </ul>
            </div>
            <div>
              <h4 className='font-medium text-gray-900 mb-2'>3. Geração</h4>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• Indicador de progresso</li>
                <li>• Tempo estimado</li>
                <li>• Status visível</li>
                <li>• Opção de cancelar</li>
              </ul>
            </div>
            <div>
              <h4 className='font-medium text-gray-900 mb-2'>4. Resultados</h4>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• Política formatada</li>
                <li>• Resumo claro</li>
                <li>• Riscos destacados</li>
                <li>• Sugestões visíveis</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Checklist Completo */}
        <div className='mt-8 bg-white rounded-lg shadow-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            📋 Checklist Completo de Usabilidade
          </h3>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            <div>
              <h4 className='font-medium text-gray-900 mb-3'>
                🎯 Primeira Impressão (0-30 segundos)
              </h4>
              <ul className='text-sm text-gray-600 space-y-2'>
                <li className='flex items-start'>
                  <span className='mr-2'>✅</span>
                  <span>Página carrega em &lt; 3 segundos</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-2'>✅</span>
                  <span>Loading state visível durante carregamento</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-2'>✅</span>
                  <span>Título e descrição claros</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-2'>✅</span>
                  <span>Layout responsivo (mobile/desktop)</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-2'>✅</span>
                  <span>Usuário entende imediatamente o que fazer</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-2'>✅</span>
                  <span>Instruções claras e visíveis</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-2'>✅</span>
                  <span>Exemplo de uso disponível</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-2'>✅</span>
                  <span>Botões de ação óbvios</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className='font-medium text-gray-900 mb-3'>
                📝 Preenchimento do Formulário
              </h4>
              <ul className='text-sm text-gray-600 space-y-2'>
                <li className='flex items-start'>
                  <span className='mr-2'>✅</span>
                  <span>Campos têm labels claros</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-2'>✅</span>
                  <span>Placeholders informativos</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-2'>✅</span>
                  <span>Validação em tempo real</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-2'>✅</span>
                  <span>Mensagens de erro claras</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-2'>✅</span>
                  <span>Campos obrigatórios marcados</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-2'>✅</span>
                  <span>Ordem lógica dos campos</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-2'>✅</span>
                  <span>Progresso visível</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-2'>✅</span>
                  <span>Possibilidade de voltar/editar</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Critérios de Aceite */}
        <div className='mt-8 bg-green-50 border border-green-200 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-green-900 mb-4'>
            ✅ Critérios de Aceite
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <ul className='text-sm text-green-800 space-y-2'>
              <li>• Testes automatizados executam todos os 8 critérios</li>
              <li>• Métricas quantitativas para cada critério (0-100)</li>
              <li>• Relatórios detalhados com recomendações</li>
            </ul>
            <ul className='text-sm text-green-800 space-y-2'>
              <li>• Interface visual para acompanhar resultados</li>
              <li>• API REST para integração com ferramentas externas</li>
              <li>• Scripts de execução para CI/CD</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
