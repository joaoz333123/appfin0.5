'use client';

import { useCallback, useEffect, useState } from 'react';
import { Step } from 'react-joyride';

export interface TourStep extends Step {
  id: string;
  title: string;
  content: string;
}

export interface TourState {
  isRunning: boolean;
  stepIndex: number;
  steps: TourStep[];
  isCompleted: boolean;
  hasSeenTour: boolean;
}

const TOUR_STORAGE_KEY = 'appfin-tour-completed';

// Definindo as etapas do tour
const tourSteps: TourStep[] = [
  {
    id: 'home-overview',
    target: '.tour-home-overview',
    title: 'Bem-vindo ao AppFin v0.5! 🎉',
    content: 'Este é seu controle central de compras. Aqui você tem uma visão geral de como o sistema funciona para simplificar suas aprovações.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    id: 'ia-assistente',
    target: '.tour-ia-assistente',
    title: 'IA Assistente - Comece Aqui! 🤖',
    content: 'Recomendamos começar pela IA Assistente. Ela fará algumas perguntas e criará as regras do seu processo automaticamente. É obrigatório simular antes de ativar.',
    placement: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: 'novo-pc',
    target: '.tour-novo-pc',
    title: 'Novo PC - Criar Pedidos 📝',
    content: 'Aqui você cria novos pedidos de compra. Descreva o que quer comprar, anexe documentos e a IA verificará se falta algo e sugerirá a categoria.',
    placement: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: 'inbox',
    target: '.tour-inbox',
    title: 'Inbox - Aprovações Rápidas ✅',
    content: 'Sua central de aprovações! Inbox clara com valor, histórico, anexos e resumo inteligente da IA. Aprove, reprove ou peça ajustes em 2 cliques.',
    placement: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: 'chat-gemini',
    target: '.tour-chat',
    title: 'Chat Gemini - Funcionalidades Avançadas 🚀',
    content: 'Converse diretamente com a IA para análises avançadas, relatórios e esclarecimentos sobre políticas e processos.',
    placement: 'bottom',
    spotlightPadding: 8,
  },
];

export const useTour = () => {
  const [tourState, setTourState] = useState<TourState>({
    isRunning: false,
    stepIndex: 0,
    steps: tourSteps,
    isCompleted: false,
    hasSeenTour: false,
  });

  // Verifica localStorage na inicialização
  useEffect(() => {
    const hasSeenTour = localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
    setTourState((prev) => ({
      ...prev,
      hasSeenTour,
      isCompleted: hasSeenTour,
    }));
  }, []);

  // Inicia o tour
  const startTour = useCallback(() => {
    setTourState((prev) => ({
      ...prev,
      isRunning: true,
      stepIndex: 0,
      isCompleted: false,
    }));
  }, []);

  // Para o tour
  const stopTour = useCallback(() => {
    setTourState((prev) => ({
      ...prev,
      isRunning: false,
    }));
  }, []);

  // Reinicia o tour (remove do localStorage e inicia novamente)
  const restartTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setTourState((prev) => ({
      ...prev,
      isRunning: true,
      stepIndex: 0,
      isCompleted: false,
      hasSeenTour: false,
    }));
  }, []);

  // Completa o tour
  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setTourState((prev) => ({
      ...prev,
      isRunning: false,
      isCompleted: true,
      hasSeenTour: true,
    }));
  }, []);

  // Pula para a próxima etapa
  const nextStep = useCallback(() => {
    setTourState((prev) => ({
      ...prev,
      stepIndex: prev.stepIndex + 1,
    }));
  }, []);

  // Volta para a etapa anterior
  const prevStep = useCallback(() => {
    setTourState((prev) => ({
      ...prev,
      stepIndex: Math.max(0, prev.stepIndex - 1),
    }));
  }, []);

  // Pula para uma etapa específica
  const goToStep = useCallback((stepIndex: number) => {
    setTourState((prev) => ({
      ...prev,
      stepIndex: Math.max(0, Math.min(stepIndex, prev.steps.length - 1)),
    }));
  }, []);

  // Deve mostrar o tour automaticamente para novos usuários
  const shouldShowTour = !tourState.hasSeenTour && !tourState.isRunning;

  return {
    tourState,
    startTour,
    stopTour,
    restartTour,
    completeTour,
    nextStep,
    prevStep,
    goToStep,
    shouldShowTour,
  };
};
