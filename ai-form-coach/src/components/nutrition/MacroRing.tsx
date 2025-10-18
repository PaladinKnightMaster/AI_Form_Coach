"use client";

import React from 'react';

interface MacroRingProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function MacroRing({ 
  label, 
  value, 
  goal, 
  unit, 
  color, 
  size = 'md' 
}: MacroRingProps) {
  const percentage = Math.min((value / goal) * 100, 100);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className="flex flex-col items-center space-y-4 animate-slide-up group">
      <div className={`relative ${sizeClasses[size]} hover:scale-110 transition-all duration-300 group-hover:drop-shadow-lg`}>
        {/* Background ring */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={`${color} transition-all duration-700 ease-out drop-shadow-sm`}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-bold ${valueSizeClasses[size]} text-gray-900 dark:text-white transition-colors duration-300`}>
            {Math.round(value)}
          </div>
          <div className={`${textSizeClasses[size]} text-gray-500 dark:text-gray-400 transition-colors duration-300`}>
            {unit}
          </div>
        </div>
      </div>
      
      {/* Label and goal */}
      <div className="text-center">
        <div className={`font-semibold ${textSizeClasses[size]} text-gray-900 dark:text-white transition-colors duration-300`}>
          {label}
        </div>
        <div className={`${textSizeClasses[size]} text-gray-500 dark:text-gray-400 transition-colors duration-300`}>
          {Math.round(percentage)}% of {goal}{unit}
        </div>
      </div>
    </div>
  );
}
