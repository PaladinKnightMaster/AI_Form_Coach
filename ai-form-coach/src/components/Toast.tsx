"use client";

import { useEffect, useState, useCallback } from 'react';
import { Icon } from '@/ui/DS';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastComponent({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [onRemove, toast.id]);

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, handleRemove]);

  const getToastStyles = () => {
    const baseStyles = "relative overflow-hidden rounded-xl shadow-lg border backdrop-blur-sm transition-all duration-300 ease-out transform";
    
    if (isLeaving) {
      return `${baseStyles} translate-x-full opacity-0 scale-95`;
    }
    
    if (isVisible) {
      return `${baseStyles} translate-x-0 opacity-100 scale-100`;
    }
    
    return `${baseStyles} translate-x-full opacity-0 scale-95`;
  };

  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return 'check';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert';
      case 'info':
        return 'alert';
      default:
        return 'alert';
    }
  };

  return (
    <div className={`${getToastStyles()} ${getTypeStyles()} max-w-sm w-full`}>
      {/* Progress bar */}
      {toast.duration && (
        <div className="absolute top-0 left-0 h-1 bg-current opacity-30 animate-progress" style={{ animationDuration: `${toast.duration}ms` }} />
      )}
      
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon 
              name={getIcon()} 
              className={`w-5 h-5 ${
                toast.type === 'success' ? 'text-green-600' :
                toast.type === 'error' ? 'text-red-600' :
                toast.type === 'warning' ? 'text-yellow-600' :
                'text-blue-600'
              }`} 
            />
          </div>
          
          <div className="ml-3 flex-1">
            <h4 className="text-sm font-semibold">
              {toast.title}
            </h4>
            {toast.message && (
              <p className="mt-1 text-sm opacity-90">
                {toast.message}
              </p>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleRemove}
              aria-label="Dismiss notification"
              className="inline-flex rounded-md p-1.5 hover:bg-black/5 transition-colors"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toast Container
interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[60] space-y-3">
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

// Toast Hook
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000, // Default 5 seconds
      ...toast,
    };
    
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  };

  const error = (title: string, message?: string) => {
    addToast({ type: 'error', title, message });
  };

  const warning = (title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  };

  const info = (title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  };

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}