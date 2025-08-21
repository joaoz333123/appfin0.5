'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Componente que usa useParams envolvido em Suspense
function AuthErrorContent() {
  const searchParams = useParams();
  const _error = searchParams.get('error');

  const getErrorMessage = (_error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'Erro de configuração do servidor';
      case 'AccessDenied':
        return 'Acesso negado';
      case 'Verification':
        return 'Erro de verificação';
      case 'Default':
        return 'Falha na autenticação. Verifique suas credenciais.';
      case 'OAuthSignin':
        return 'Erro ao iniciar o processo de autenticação';
      case 'OAuthCallback':
        return 'Erro no retorno da autenticação';
      case 'OAuthCreateAccount':
        return 'Erro ao criar conta com provedor externo';
      case 'EmailCreateAccount':
        return 'Erro ao criar conta com email';
      case 'Callback':
        return 'Erro no processo de callback';
      case 'OAuthAccountNotLinked':
        return 'Esta conta já está vinculada a outro provedor';
      case 'EmailSignin':
        return 'Erro ao enviar email de autenticação';
      case 'CredentialsSignin':
        return 'Credenciais inválidas';
      case 'SessionRequired':
        return 'Sessão necessária para acessar esta página';
      default:
        return 'Erro de autenticação inesperado';
    }
  };

  return (
    <div className='max-w-md w-full space-y-8'>
      <div>
        <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
          Erro de Autenticação
        </h2>
        <p className='mt-2 text-center text-sm text-red-600'>
          {getErrorMessage(error)}
        </p>
        {error && (
          <p className='mt-1 text-center text-xs text-gray-500'>
            Código do erro: {error}
          </p>
        )}
      </div>
      <div className='mt-8 space-y-6'>
        <Link
          href='/auth/signin'
          className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
        >
          Tentar Novamente
        </Link>
        <Link
          href='/'
          className='group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
        >
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}

// Componente de fallback durante loading
function AuthErrorFallback() {
  return (
    <div className='max-w-md w-full space-y-8'>
      <div>
        <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
          Carregando...
        </h2>
        <div className='mt-4 flex justify-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <Suspense fallback={<AuthErrorFallback />}>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
