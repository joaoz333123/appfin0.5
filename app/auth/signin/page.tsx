'use client';

import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
export default function SignIn() {
  const router = useRouter();

  (() => {
    // Verificar se já está logado
    getSession().then(session => {
      if (session) {
        router.push('/');
      }
    });
  },
    [router]);

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Entrar no AppFin
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Sistema de Aprovação de Compras
          </p>
        </div>
        <div className='mt-8 space-y-6'>
          <button
            onClick={handleGoogleSignIn}
            className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            Entrar com Google
          </button>
        </div>
      </div>
    </div>
  );
}
