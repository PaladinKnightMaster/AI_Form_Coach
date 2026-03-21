"use client";

import { useState, useEffect } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface CarouselItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  features: string[];
}

const carouselItems: CarouselItem[] = [
  {
    id: 'ai-coaching',
    title: 'AI Form Coaching',
    description: 'Get real-time feedback on your exercise form with advanced computer vision technology.',
    icon: '🎯',
    gradient: 'from-blue-500 to-purple-600',
    features: [
      'Real-time posture correction',
      'Rep counting with precision',
      'Form quality scoring',
      'Injury prevention alerts'
    ]
  },
  {
    id: 'smart-nutrition',
    title: 'Smart Nutrition Tracking',
    description: 'Effortlessly track your meals and macros with AI-powered food recognition.',
    icon: '🥗',
    gradient: 'from-green-500 to-teal-600',
    features: [
      'AI food recognition',
      'Macro tracking',
      'Meal planning',
      'Nutrition insights'
    ]
  },
  {
    id: 'workout-plans',
    title: 'AI Workout Plans',
    description: 'Personalized workout plans that adapt to your progress and goals.',
    icon: '🗓️',
    gradient: 'from-orange-500 to-red-600',
    features: [
      'Personalized routines',
      'Progressive overload',
      'Goal-based planning',
      'Adaptive scheduling'
    ]
  },
  {
    id: 'health-monitoring',
    title: 'Health Monitoring',
    description: 'Track your readiness, recovery, and overall health metrics.',
    icon: '📊',
    gradient: 'from-purple-500 to-pink-600',
    features: [
      'Readiness scoring',
      'Recovery tracking',
      'Sleep analysis',
      'Heart rate monitoring'
    ]
  }
];

export function FeatureCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const [isAutoPlaying, setIsAutoPlaying] = useState(!reduceMotion);

  useEffect(() => {
    if (!isAutoPlaying || reduceMotion) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselItems.length);
    }, 4000); // Auto-advance every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const currentItem = carouselItems[currentIndex];

  return (
    <div className="relative max-w-7xl">
      {/* Wide and compact carousel content */}
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-100">
        <div className="grid lg:grid-cols-2 min-h-[350px]">
          {/* Left side - Content */}
          <div className="p-8 flex flex-col justify-center">
            <div className="flex items-center mb-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentItem.gradient} flex items-center justify-center text-2xl mr-4 shadow-lg transform transition-all duration-500`}>
                {currentItem.icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 transition-all duration-500">
                  {currentItem.title}
                </h3>
              </div>
            </div>
            
            <p className="text-lg text-gray-600 mb-6 leading-relaxed transition-all duration-500">
              {currentItem.description}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {currentItem.features.map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-center text-gray-700 text-sm transform transition-all duration-500"
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${currentItem.gradient} mr-2 flex-shrink-0`}></div>
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Visual */}
          <div className={`relative bg-gradient-to-br ${currentItem.gradient} flex items-center justify-center overflow-hidden`}>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-4 w-16 h-16 bg-white/20 rounded-full blur-lg animate-pulse"></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 bg-white/20 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
            
            <div className="relative z-10 text-center text-white p-6">
              <div className="text-6xl mb-3 transform transition-all duration-700 hover:scale-110">
                {currentItem.icon}
              </div>
              <div className="text-xl font-bold opacity-90">
                {currentItem.title}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact navigation dots */}
      <div className="flex justify-center mt-6 space-x-2">
        {carouselItems.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? `bg-gradient-to-r ${carouselItems[currentIndex].gradient} scale-125 shadow-md` 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Compact progress bar */}
      <div className="mt-3 w-full bg-gray-200 rounded-full h-0.5 overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${currentItem.gradient} transition-all duration-100 ease-linear`}
          style={{
            width: isAutoPlaying ? '100%' : '0%',
            animation: isAutoPlaying ? 'progress 4s linear infinite' : 'none'
          }}
        />
      </div>

    </div>
  );
}
