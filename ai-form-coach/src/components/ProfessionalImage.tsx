"use client";

import Image from 'next/image';
import { useState } from 'react';

interface ProfessionalImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fallbackSrc?: string;
}

export function ProfessionalImage({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  priority = false,
  fallbackSrc = '/placeholder-fitness.jpg'
}: ProfessionalImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [loading, setLoading] = useState(true);

  const handleError = () => {
    setImageSrc(fallbackSrc);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={`w-full h-full object-cover transition-all duration-500 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
}

// Predefined professional fitness images
export const FITNESS_IMAGES = {
  hero: {
    src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    alt: 'Professional fitness trainer with AI technology'
  },
  formCoaching: {
    src: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    alt: 'AI form coaching technology in action'
  },
  nutrition: {
    src: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    alt: 'Healthy nutrition tracking and meal planning'
  },
  workoutPlans: {
    src: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    alt: 'Personalized AI workout plans and training'
  },
  success: {
    src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    alt: 'Fitness success and achievement'
  },
  technology: {
    src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    alt: 'Advanced AI fitness technology'
  }
};

// User avatar images for testimonials
export const USER_AVATARS = {
  sarah: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
  mike: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
  emma: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
  david: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
  lisa: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
  alex: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
};
