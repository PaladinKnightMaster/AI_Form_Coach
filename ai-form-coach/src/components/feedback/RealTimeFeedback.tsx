"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Icon, Badge } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';

interface RealTimeFeedbackProps {
  exercise: 'squat' | 'pushup' | 'plank';
  isActive: boolean;
  onFeedback?: (feedback: FeedbackMessage) => void;
  className?: string;
}

interface FeedbackMessage {
  type: 'encouragement' | 'form' | 'achievement' | 'motivation';
  message: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
}

interface PerformanceMetrics {
  reps: number;
  formScore: number;
  tempo: number;
  lastRepTime: number;
  streak: number;
  personalBest: number;
  lastFeedbackTime: number;
  feedbackCount: number;
}

export default function RealTimeFeedback({ 
  exercise, 
  isActive, 
  onFeedback,
  className = '' 
}: RealTimeFeedbackProps) {
  const [feedback, setFeedback] = useState<FeedbackMessage[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    reps: 0,
    formScore: 0,
    tempo: 0,
    lastRepTime: 0,
    streak: 0,
    personalBest: 0,
    lastFeedbackTime: 0,
    feedbackCount: 0
  });
  const [isMuted, setIsMuted] = useState(false);
  const { success: showSuccess } = useToastContext();
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRepTimeRef = useRef<number>(0);

  // Strava-inspired feedback messages
  const feedbackMessages = {
    encouragement: [
      "Great form! Keep it up! 💪",
      "You're crushing it! 🔥",
      "Perfect tempo! 🎯",
      "Strong finish! ⚡",
      "Excellent range of motion! 📈",
      "That's the way to do it! 🚀",
      "Consistent and controlled! 🎪",
      "You're on fire today! 🔥"
    ],
    form: [
      "Try to go a bit deeper on the next rep",
      "Keep your core engaged throughout",
      "Maintain that steady tempo",
      "Focus on the negative phase",
      "Great depth on that one!",
      "Keep your chest up",
      "Perfect alignment!",
      "Control the descent more"
    ],
    achievement: [
      "🎉 New personal best!",
      "🔥 10 rep streak!",
      "⚡ Perfect form streak!",
      "🏆 Consistency champion!",
      "💪 Power through!",
      "🎯 Bullseye form!",
      "🚀 Speed demon!",
      "💎 Diamond form!"
    ],
    motivation: [
      "You're stronger than you think!",
      "Every rep counts!",
      "Push through the burn!",
      "You've got this!",
      "One more rep!",
      "Feel the power!",
      "You're unstoppable!",
      "Keep the momentum going!"
    ]
  };

  const updateMetrics = useCallback((newMetrics: Partial<PerformanceMetrics>) => {
    setMetrics(prev => {
      const updated = { ...prev, ...newMetrics };

      // Update last rep time when reps increase
      if (newMetrics.reps && newMetrics.reps > prev.reps) {
        lastRepTimeRef.current = Date.now();
      }

      return updated;
    });
  }, []);

  const generateFeedback = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRep = now - lastRepTimeRef.current;
    
    // Determine feedback type based on current state
    let feedbackType: keyof typeof feedbackMessages;
    let message: string;
    let priority: 'low' | 'medium' | 'high' = 'medium';

    // Achievement-based feedback
    if (metrics.reps > 0 && metrics.reps % 10 === 0) {
      feedbackType = 'achievement';
      message = feedbackMessages.achievement[Math.floor(Math.random() * feedbackMessages.achievement.length)];
      priority = 'high';
    }
    // Form-based feedback
    else if (metrics.formScore < 0.7) {
      feedbackType = 'form';
      message = feedbackMessages.form[Math.floor(Math.random() * feedbackMessages.form.length)];
      priority = 'high';
    }
    // Motivation for slow periods
    else if (timeSinceLastRep > 10000) {
      feedbackType = 'motivation';
      message = feedbackMessages.motivation[Math.floor(Math.random() * feedbackMessages.motivation.length)];
      priority = 'medium';
    }
    // General encouragement
    else {
      feedbackType = 'encouragement';
      message = feedbackMessages.encouragement[Math.floor(Math.random() * feedbackMessages.encouragement.length)];
      priority = 'low';
    }

    const newFeedback: FeedbackMessage = {
      type: feedbackType,
      message,
      timestamp: now,
      priority
    };

    setFeedback(prev => [newFeedback, ...prev.slice(0, 4)]); // Keep last 5 messages
    onFeedback?.(newFeedback);

    // Update metrics based on feedback type
    updateMetrics({
      lastFeedbackTime: now,
      feedbackCount: metrics.feedbackCount + 1
    });

    // Show toast for high priority feedback
    if (priority === 'high') {
      showSuccess('Great job!', message);
    }
  }, [metrics, showSuccess, onFeedback, updateMetrics, feedbackMessages.achievement, feedbackMessages.encouragement, feedbackMessages.form, feedbackMessages.motivation]);

  const startFeedbackLoop = useCallback(() => {
    const interval = setInterval(() => {
      if (isActive && !isMuted) {
        generateFeedback();
      }
    }, 3000 + Math.random() * 2000); // Random interval between 3-5 seconds

    feedbackTimeoutRef.current = interval;
  }, [isActive, isMuted, generateFeedback]);

  const stopFeedbackLoop = () => {
    if (feedbackTimeoutRef.current) {
      clearInterval(feedbackTimeoutRef.current);
    }
  };

  useEffect(() => {
    if (isActive) {
      startFeedbackLoop();
    } else {
      stopFeedbackLoop();
    }

    return () => stopFeedbackLoop();
  }, [isActive, exercise, startFeedbackLoop]);

  const getFeedbackIcon = (type: FeedbackMessage['type']) => {
    switch (type) {
      case 'encouragement': return 'check';
      case 'form': return 'target';
      case 'achievement': return 'trophy';
      case 'motivation': return 'activity';
      default: return 'message';
    }
  };

  const getFeedbackColor = (type: FeedbackMessage['type']) => {
    switch (type) {
      case 'encouragement': return 'text-green-600';
      case 'form': return 'text-blue-600';
      case 'achievement': return 'text-yellow-600';
      case 'motivation': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityBadge = (priority: FeedbackMessage['priority']) => {
    switch (priority) {
      case 'high': return <Badge tone="error" size="sm">High</Badge>;
      case 'medium': return <Badge tone="warning" size="sm">Med</Badge>;
      case 'low': return <Badge tone="info" size="sm">Low</Badge>;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Real-time Feedback
          </h3>
          <div className="flex items-center space-x-2">
            <Badge tone={isActive ? 'success' : 'neutral'} size="sm">
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              className={isMuted ? 'text-red-600' : 'text-gray-600'}
            >
              <Icon name={isMuted ? 'volume' : 'volume'} className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.reps}
            </div>
            <div className="text-xs text-gray-600">Reps</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(metrics.formScore * 100)}%
            </div>
            <div className="text-xs text-gray-600">Form</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.streak}
            </div>
            <div className="text-xs text-gray-600">Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.personalBest}
            </div>
            <div className="text-xs text-gray-600">PB</div>
          </div>
        </div>

        {/* Feedback Messages */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {feedback.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <Icon name="message" className="w-8 h-8 mx-auto mb-2" />
              <p>Start your workout to see real-time feedback!</p>
            </div>
          ) : (
            feedback.map((item, index) => (
              <div
                key={`${item.timestamp}-${index}`}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  item.priority === 'high' 
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <Icon 
                  name={getFeedbackIcon(item.type)} 
                  className={`w-5 h-5 mt-0.5 ${getFeedbackColor(item.type)}`} 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {item.type}
                    </span>
                    {getPriorityBadge(item.priority)}
                  </div>
                  <p className="text-sm text-gray-700">
                    {item.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {isActive ? 'Feedback active' : 'Start workout for feedback'}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFeedback([])}
              disabled={feedback.length === 0}
            >
              <Icon name="trash" className="w-4 h-4 mr-1" />
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => generateFeedback()}
              disabled={!isActive}
            >
              <Icon name="refresh" className="w-4 h-4 mr-1" />
              Test
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
