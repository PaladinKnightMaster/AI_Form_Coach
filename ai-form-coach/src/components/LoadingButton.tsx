"use client";

import { Button } from '@/ui/DS';
import { ReactNode } from 'react';

interface LoadingButtonProps {
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export default function LoadingButton({
  children,
  loading = false,
  loadingText = 'Loading...',
  disabled = false,
  className = '',
  onClick,
  type = 'button'
}: LoadingButtonProps) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${className} ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </Button>
  );
}
