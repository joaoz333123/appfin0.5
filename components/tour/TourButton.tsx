'use client';

import { Button } from '@/components/ui/button';
import { useTour } from '@/hooks/useTour';
import { HelpCircle, RotateCcw } from 'lucide-react';

interface TourButtonProps {
  variant?: 'outline' | 'default' | 'secondary' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export const TourButton: React.FC<TourButtonProps> = ({
  variant = 'outline',
  size = 'default',
  className = '',
  showIcon = true,
  children,
}) => {
  const { tourState, startTour, restartTour } = useTour();

  const handleClick = () => {
    if (tourState.hasSeenTour) {
      restartTour();
    } else {
      startTour();
    }
  };

  const buttonText = children || (tourState.hasSeenTour ? 'Refazer Tour' : 'Fazer Tour');
  const icon = tourState.hasSeenTour ? (
    <RotateCcw className="w-4 h-4" />
  ) : (
    <HelpCircle className="w-4 h-4" />
  );

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`gap-2 ${className}`}
      disabled={tourState.isRunning}
    >
      {showIcon && icon}
      {buttonText}
    </Button>
  );
};
