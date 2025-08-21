'use client';

import { useTour } from '@/hooks/useTour';
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect } from 'react';
import Joyride, { ACTIONS, CallBackProps, EVENTS, STATUS } from 'react-joyride';

interface TourGuideProps {
  autoStart?: boolean;
  className?: string;
}

export const TourGuide: React.FC<TourGuideProps> = ({
  autoStart = false,
  className = ''
}) => {
  const {
    tourState,
    startTour,
    stopTour,
    completeTour,
    nextStep,
    prevStep,
    shouldShowTour,
  } = useTour();

  // Inicia o tour automaticamente para novos usuários se autoStart for true
  useEffect(() => {
    if (autoStart && shouldShowTour) {
      // Pequeno delay para garantir que os elementos da página carregaram
      const timer = setTimeout(() => {
        startTour();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [autoStart, shouldShowTour, startTour]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;

    // Eventos de finalização
    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      const isLastStep = index === tourState.steps.length - 1;

      if (action === ACTIONS.NEXT) {
        if (isLastStep) {
          completeTour();
        } else {
          nextStep();
        }
      } else if (action === ACTIONS.PREV) {
        prevStep();
      }
    }

    // Status de finalização/cancelamento
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      if (status === STATUS.FINISHED) {
        completeTour();
      } else {
        stopTour();
      }
    }
  };

  // Estilos customizados compatíveis com shadcn/ui
  const joyrideStyles = {
    options: {
      primaryColor: '#2563eb', // blue-600
      zIndex: 10000,
    },
    tooltip: {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      color: '#1f2937',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      padding: '20px',
      maxWidth: '400px',
    },
    tooltipTitle: {
      color: '#111827',
      fontSize: '18px',
      fontWeight: '600',
      margin: '0 0 12px 0',
      lineHeight: '1.4',
    },
    tooltipContent: {
      color: '#6b7280',
      fontSize: '14px',
      lineHeight: '1.6',
      margin: '0 0 20px 0',
    },
    tooltipFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '20px',
      padding: '0',
    },
    buttonNext: {
      backgroundColor: '#2563eb',
      border: 'none',
      borderRadius: '6px',
      color: '#ffffff',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      padding: '8px 16px',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    buttonBack: {
      backgroundColor: 'transparent',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      color: '#6b7280',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      padding: '8px 16px',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    buttonClose: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#9ca3af',
      cursor: 'pointer',
      fontSize: '14px',
      padding: '4px',
      position: 'absolute' as const,
      right: '12px',
      top: '12px',
      transition: 'color 0.2s',
    },
    buttonSkip: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#6b7280',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      padding: '8px 12px',
      transition: 'color 0.2s',
    },
    spotlight: {
      borderRadius: '8px',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
  };

  const customLocale = {
    back: (
      <>
        <ChevronLeft className="w-4 h-4" />
        Anterior
      </>
    ),
    close: <X className="w-4 h-4" />,
    last: (
      <>
        Concluir
        <Check className="w-4 h-4" />
      </>
    ),
    next: (
      <>
        Próximo
        <ChevronRight className="w-4 h-4" />
      </>
    ),
    skip: 'Pular',
  };

  if (!tourState.isRunning) {
    return null;
  }

  return (
    <div className={className}>
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        hideCloseButton={false}
        run={tourState.isRunning}
        scrollToFirstStep
        showProgress
        showSkipButton
        stepIndex={tourState.stepIndex}
        steps={tourState.steps}
        styles={joyrideStyles}
        locale={customLocale}
        disableOverlayClose
        disableCloseOnEsc={false}
        spotlightClicks
        hideBackButton={false}
      />
    </div>
  );
};
