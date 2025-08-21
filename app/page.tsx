import { TourButton } from '@/components/tour/TourButton';
import { TourGuide } from '@/components/tour/TourGuide';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    CheckCircle,
    Clock,
    FileText,
    Shield,
    ShoppingCart,
    Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-6'>
            <div className='flex items-center space-x-3'>
              <Link href='/'>
                <div className='w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors'>
                  <ShoppingCart className='w-6 h-6 text-white' />
                </div>
              </Link>
              <Link href='/'>
                <h1 className='text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors'>
                  AppFin
                </h1>
              </Link>
            </div>
            <div className='flex items-center space-x-4'>
              <Link href='/politica'>
                <Button variant='outline'>Política</Button>
              </Link>
              <Link href='/politica/ia-assistente'>
                <Button variant='outline' className='tour-ia-assistente'>🤖 IA Assistente</Button>
              </Link>
              <Link href='/pc/novo'>
                <Button variant='outline' className='tour-novo-pc'>Novo PC</Button>
              </Link>
              <Link href='/inbox'>
                <Button variant='outline' className='tour-inbox'>Inbox</Button>
              </Link>
              <Link href='/chat'>
                <Button variant='outline' className='tour-chat'>Chat</Button>
              </Link>
              <Link href='/glossario'>
                <Button variant='outline'>📖 Glossário</Button>
              </Link>
              <TourButton variant='outline' size='default' />
              <Link href='/politica'>
                <Button>Começar</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className='py-20 tour-home-overview'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <h1 className='text-5xl font-bold text-gray-900 mb-6'>
            Controle Central de <span className='text-blue-600'>Compras</span>
          </h1>
          <p className='text-xl text-gray-600 mb-8 max-w-3xl mx-auto'>
            Tire a aprovação do WhatsApp/e-mail e coloque tudo num fluxo
            simples, rápido e com registro. Aprovações em 2 cliques com IA.
          </p>
          <div className='flex justify-center space-x-4'>
            <Link href='/politica'>
              <Button size='lg' className='text-lg px-8 py-3'>
                Começar Agora
              </Button>
            </Link>
            <Link href='/chat'>
              <Button variant='outline' size='lg' className='text-lg px-8 py-3'>
                Ver Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className='py-20 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              Como funciona
            </h2>
            <p className='text-lg text-gray-600'>
              Fluxo completo de aprovação com IA
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            <Card className='border-0 shadow-lg'>
              <CardHeader>
                <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4'>
                  <Zap className='w-6 h-6 text-blue-600' />
                </div>
                <CardTitle>Começo Guiado pela IA</CardTitle>
                <CardDescription>
                  A IA faz poucas perguntas e cria as regras do seu processo.
                  Simulação obrigatória antes de ativar.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className='border-0 shadow-lg'>
              <CardHeader>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4'>
                  <FileText className='w-6 h-6 text-green-600' />
                </div>
                <CardTitle>Criar Pedido Sem Atrito</CardTitle>
                <CardDescription>
                  Descreva o que quer comprar, anexe documentos e a IA checa se
                  falta algo e sugere categoria.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className='border-0 shadow-lg'>
              <CardHeader>
                <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4'>
                  <CheckCircle className='w-6 h-6 text-purple-600' />
                </div>
                <CardTitle>Aprovar em 2 Cliques</CardTitle>
                <CardDescription>
                  Inbox clara com valor, histórico, anexos e resumo inteligente
                  da IA. Aprove, reprove ou peça ajuste.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className='border-0 shadow-lg'>
              <CardHeader>
                <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4'>
                  <Clock className='w-6 h-6 text-orange-600' />
                </div>
                <CardTitle>Prazos Sob Controle</CardTitle>
                <CardDescription>
                  Acompanha SLA por etapa, manda lembretes e escala
                  automaticamente quando alguém atrasa.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className='border-0 shadow-lg'>
              <CardHeader>
                <div className='w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4'>
                  <CheckCircle className='w-6 h-6 text-red-600' />
                </div>
                <CardTitle>Orçado vs. Comprometido</CardTitle>
                <CardDescription>
                  Quando aprovado, o valor entra no comprometido. Visualize
                  saldos de forma objetiva.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className='border-0 shadow-lg'>
              <CardHeader>
                <div className='w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4'>
                  <Shield className='w-6 h-6 text-indigo-600' />
                </div>
                <CardTitle>Transparência Total</CardTitle>
                <CardDescription>
                  Tudo auditado: quem fez o quê, quando e com quais regras.
                   completo em 1 clique.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='py-20 bg-blue-600'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <h2 className='text-3xl font-bold text-white mb-4'>
            Pronto para simplificar suas aprovações?
          </h2>
          <p className='text-xl text-blue-100 mb-8'>
            Menos idas e vindas, decisões rápidas e um histórico confiável.
          </p>
          <Link href='/politica'>
            <Button size='lg' variant='secondary' className='text-lg px-8 py-3'>
              Começar Gratuitamente
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-gray-900 text-white py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='flex items-center justify-center space-x-3 mb-4'>
              <Link href='/'>
                <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors'>
                  <ShoppingCart className='w-5 h-5 text-white' />
                </div>
              </Link>
              <Link href='/'>
                <h3 className='text-xl font-bold hover:text-blue-400 transition-colors'>
                  AppFin
                </h3>
              </Link>
            </div>
            <p className='text-gray-400 mb-6'>
              Controle central de compras com IA
            </p>
            <div className='flex justify-center space-x-6'>
              <Link
                href='/politica'
                className='text-gray-400 hover:text-white transition-colors'
              >
                Política
              </Link>
              <Link
                href='/pc/novo'
                className='text-gray-400 hover:text-white transition-colors'
              >
                Novo PC
              </Link>
              <Link
                href='/inbox'
                className='text-gray-400 hover:text-white transition-colors'
              >
                Inbox
              </Link>
              <Link
                href='/chat'
                className='text-gray-400 hover:text-white transition-colors'
              >
                Chat
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Tour Guide */}
      <TourGuide autoStart={true} />
    </div>
  );
}
