"use client";

import { Icon } from '@/ui/DS';
import Link from 'next/link';

interface PrivacyBadgeProps {
  type: 'on-device' | 'anonymous' | 'opt-in' | 'local-cache';
  size?: 'sm' | 'md' | 'lg';
  showLink?: boolean;
  className?: string;
}

export default function PrivacyBadge({ 
  type, 
  size = 'md', 
  showLink = false, 
  className = '' 
}: PrivacyBadgeProps) {
  const badgeConfig = {
    'on-device': {
      icon: 'check',
      text: 'On-Device Processing',
      description: 'Processed locally with MediaPipe',
      color: 'bg-green-100 text-green-800',
      iconColor: 'text-green-600'
    },
    'anonymous': {
      icon: 'user',
      text: 'Anonymous Lookups',
      description: 'No personal tracking',
      color: 'bg-blue-100 text-blue-800',
      iconColor: 'text-blue-600'
    },
    'opt-in': {
      icon: 'settings',
      text: 'Opt-In Only',
      description: 'You control your data',
      color: 'bg-purple-100 text-purple-800',
      iconColor: 'text-purple-600'
    },
    'local-cache': {
      icon: 'save',
      text: 'Local Cache',
      description: 'Stored on your device',
      color: 'bg-orange-100 text-orange-800',
      iconColor: 'text-orange-600'
    }
  };

  const config = badgeConfig[type];
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`inline-flex items-center gap-2 ${sizeClasses[size]} ${config.color} rounded-full font-medium ${className}`}>
      <Icon name={config.icon as 'check' | 'user' | 'settings' | 'save'} className={`${iconSizes[size]} ${config.iconColor}`} />
      <span>{config.text}</span>
      {showLink && (
        <Link 
          href="/privacy" 
          className="hover:underline opacity-80 hover:opacity-100 transition-opacity"
          title={config.description}
        >
          <Icon name="link" className={`${iconSizes[size]} opacity-60`} />
        </Link>
      )}
    </div>
  );
}
