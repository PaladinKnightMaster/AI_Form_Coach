"use client";

import { ReactNode } from 'react';

interface AnimatedGradientBackgroundProps {
  children?: ReactNode;
  variant?: 'hero' | 'nutrition' | 'plans' | 'default';
  className?: string;
}

export function AnimatedGradientBackground({ 
  children, 
  variant = 'default',
  className = ''
}: AnimatedGradientBackgroundProps) {
  const getGradientConfig = () => {
    switch (variant) {
      case 'hero':
        return {
          primary: 'from-slate-900 via-slate-800 to-slate-700',
          secondary: 'from-blue-600 via-purple-600 to-indigo-600',
          accent: 'from-emerald-500 via-teal-500 to-cyan-500'
        };
      case 'nutrition':
        return {
          primary: 'from-emerald-900 via-green-800 to-teal-700',
          secondary: 'from-green-500 via-emerald-500 to-teal-500',
          accent: 'from-lime-400 via-yellow-400 to-orange-400'
        };
      case 'plans':
        return {
          primary: 'from-purple-900 via-violet-800 to-indigo-700',
          secondary: 'from-purple-500 via-violet-500 to-indigo-500',
          accent: 'from-pink-400 via-rose-400 to-red-400'
        };
      default:
        return {
          primary: 'from-gray-900 via-slate-800 to-gray-700',
          secondary: 'from-blue-600 via-indigo-600 to-purple-600',
          accent: 'from-cyan-400 via-blue-400 to-indigo-400'
        };
    }
  };

  const gradients = getGradientConfig();

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Primary gradient layer */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradients.primary}`} />
        
        {/* Animated secondary gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradients.secondary} opacity-30 animate-pulse`} />
        
        {/* Animated accent gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradients.accent} opacity-20 animate-pulse`} style={{ animationDelay: '2s' }} />
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-3xl animate-bounce" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 blur-3xl animate-bounce" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="absolute top-3/4 left-3/4 w-64 h-64 rounded-full bg-gradient-to-r from-pink-400/20 to-rose-400/20 blur-3xl animate-bounce" style={{ animationDuration: '10s', animationDelay: '4s' }} />
      </div>
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Convenience components for different sections
export function HeroGradientBackground({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <AnimatedGradientBackground variant="hero" className={className}>
      {children}
    </AnimatedGradientBackground>
  );
}

export function NutritionGradientBackground({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <AnimatedGradientBackground variant="nutrition" className={className}>
      {children}
    </AnimatedGradientBackground>
  );
}

export function PlansGradientBackground({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <AnimatedGradientBackground variant="plans" className={className}>
      {children}
    </AnimatedGradientBackground>
  );
}
