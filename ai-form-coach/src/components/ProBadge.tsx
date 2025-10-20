"use client";
import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { subscriptionService } from '@/lib/subscription/subscriptionService';

interface ProBadgeProps {
  className?: string;
  showText?: boolean;
}

export default function ProBadge({ className = '', showText = true }: ProBadgeProps) {
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'founder' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAuthenticated(false);
          setUserTier('free');
          return;
        }

        setIsAuthenticated(true);
        const tier = await subscriptionService.getUserTier(user.id);
        setUserTier(tier);
      } catch (error) {
        console.error('Error checking subscription:', error);
        setUserTier('free');
      }
    };

    checkSubscription();
  }, []);

  // Don't show badge for free users
  if (userTier === 'free' || userTier === null) {
    return null;
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {userTier === 'pro' && (
        <>
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          {showText && <span className="text-emerald-700 dark:text-emerald-300">Pro</span>}
        </>
      )}
      {userTier === 'founder' && (
        <>
          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
          {showText && <span className="text-purple-700 dark:text-purple-300">Founder</span>}
        </>
      )}
    </span>
  );
}
