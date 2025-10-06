"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Icon } from '@/ui/DS';
import type { PoseFeedback3D, Correction3D } from '@/lib/pose/pose3DFeedback';

interface Pose3DCoachProps {
  feedback: PoseFeedback3D | null;
  isActive: boolean;
  onStart?: () => void;
  onStop?: () => void;
  className?: string;
}

export default function Pose3DCoach({ 
  feedback, 
  isActive, 
  onStart, 
  onStop,
  className = '' 
}: Pose3DCoachProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [lastFeedbackTime, setLastFeedbackTime] = useState<number>(0);

  // Audio feedback
  const speakFeedback = useCallback((message: string, priority: string) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;
    
    // Throttle audio feedback
    const now = Date.now();
    if (now - lastFeedbackTime < 2000) return; // 2 second cooldown
    
    setLastFeedbackTime(now);
    
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = priority === 'critical' ? 0.8 : 0.6;
    
    speechSynthesis.speak(utterance);
  }, [audioEnabled, lastFeedbackTime]);

  // Handle feedback changes
  useEffect(() => {
    if (!feedback || !isActive) return;

    // Speak critical corrections
    feedback.corrections
      .filter(correction => correction.severity === 'critical')
      .forEach(correction => {
        speakFeedback(correction.correction, 'critical');
      });

    // Speak positive feedback occasionally
    if (feedback.positives.length > 0 && Math.random() < 0.3) {
      const positive = feedback.positives[0];
      speakFeedback(positive.message, 'low');
    }
  }, [feedback, isActive, speakFeedback]);

  if (!feedback) {
    return (
      <div className={`pose-3d-coach ${className}`}>
        <div className="text-center p-8">
          <Icon name="camera" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Ready to Start Coaching
          </h3>
          <p className="text-gray-500 mb-4">
            Start your workout to receive real-time form feedback
          </p>
          <Button onClick={onStart} variant="primary" className="flex items-center gap-2">
            <Icon name="play" className="w-4 h-4" />
            Start Coaching
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`pose-3d-coach bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <h3 className="text-lg font-semibold">
            {isActive ? 'Live Coaching' : 'Coaching Paused'}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAudioEnabled(!audioEnabled)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Icon name={audioEnabled ? "volume" : "volume"} className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="outline"
            size="sm"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          
          <Button
            onClick={isActive ? onStop : onStart}
            variant={isActive ? "secondary" : "primary"}
            size="sm"
            className="flex items-center gap-1"
          >
            <Icon name={isActive ? "pause" : "play"} className="w-4 h-4" />
            {isActive ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      {/* Main Feedback Area */}
      <div className="p-4 space-y-4">
        {/* Overall Feedback */}
        {feedback.overall && (
          <div className={`p-3 rounded-lg border-l-4 ${
            feedback.overall.priority === 'critical' ? 'bg-red-50 border-red-500' :
            feedback.overall.priority === 'high' ? 'bg-orange-50 border-orange-500' :
            feedback.overall.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
            'bg-green-50 border-green-500'
          }`}>
            <p className="text-sm font-medium">
              {feedback.overall.message}
            </p>
          </div>
        )}

        {/* Critical Corrections */}
        {feedback.corrections.filter(c => c.severity === 'critical').length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-red-600 flex items-center gap-1">
              <Icon name="alert-triangle" className="w-4 h-4" />
              Critical Corrections
            </h4>
            {feedback.corrections
              .filter(c => c.severity === 'critical')
              .map((correction, index) => (
                <CorrectionCard key={index} correction={correction} />
              ))}
          </div>
        )}

        {/* Major Corrections */}
        {feedback.corrections.filter(c => c.severity === 'major').length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-orange-600 flex items-center gap-1">
              <Icon name="alert-circle" className="w-4 h-4" />
              Major Corrections
            </h4>
            {feedback.corrections
              .filter(c => c.severity === 'major')
              .map((correction, index) => (
                <CorrectionCard key={index} correction={correction} />
              ))}
          </div>
        )}

        {/* Positive Feedback */}
        {feedback.positives.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-green-600 flex items-center gap-1">
              <Icon name="check-circle" className="w-4 h-4" />
              Great Job!
            </h4>
            {feedback.positives.map((positive, index) => (
              <div key={index} className="p-2 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">{positive.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Exercise Cues */}
        {feedback.exercise.cues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-blue-600 flex items-center gap-1">
              <Icon name="lightbulb" className="w-4 h-4" />
              Exercise Cues
            </h4>
            {feedback.exercise.cues.map((cue, index) => (
              <div key={index} className="p-2 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">{cue.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Movement Phase */}
        {feedback.phase && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Phase:</span>
              <span className="text-sm font-semibold capitalize text-blue-600">
                {feedback.phase.current}
              </span>
            </div>
            {feedback.phase.transition && (
              <p className="text-xs text-gray-600 mt-1">
                {feedback.phase.transition}
              </p>
            )}
          </div>
        )}

        {/* Detailed View */}
        {showDetails && (
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* All Corrections */}
            {feedback.corrections.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">All Corrections</h4>
                <div className="space-y-2">
                  {feedback.corrections.map((correction, index) => (
                    <CorrectionCard key={index} correction={correction} showDetails />
                  ))}
                </div>
              </div>
            )}

            {/* Progress Insights */}
            {feedback.progress && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Progress Insights</h4>
                <div className="space-y-2">
                  {feedback.progress.improvement.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-green-600">Improvements:</h5>
                      <ul className="text-xs text-gray-600 ml-2">
                        {feedback.progress.improvement.map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {feedback.progress.achievements.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-blue-600">Achievements:</h5>
                      <ul className="text-xs text-gray-600 ml-2">
                        {feedback.progress.achievements.map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {feedback.progress.recommendations.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-orange-600">Recommendations:</h5>
                      <ul className="text-xs text-gray-600 ml-2">
                        {feedback.progress.recommendations.map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Correction Card Component
function CorrectionCard({ correction, showDetails = false }: { correction: Correction3D; showDetails?: boolean }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'major': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'moderate': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return 'alert-triangle';
      case 'major': return 'alert-circle';
      case 'moderate': return 'alert';
      default: return 'message';
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getSeverityColor(correction.severity)}`}>
      <div className="flex items-start gap-2">
        <Icon name={getSeverityIcon(correction.severity)} className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium capitalize">{correction.joint}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              correction.severity === 'critical' ? 'bg-red-200 text-red-800' :
              correction.severity === 'major' ? 'bg-orange-200 text-orange-800' :
              correction.severity === 'moderate' ? 'bg-yellow-200 text-yellow-800' :
              'bg-gray-200 text-gray-800'
            }`}>
              {correction.severity}
            </span>
          </div>
          <p className="text-sm font-medium mb-1">{correction.issue}</p>
          <p className="text-sm">{correction.correction}</p>
          
          {showDetails && correction.audioCue && (
            <div className="mt-2 p-2 bg-white/50 rounded text-xs">
              <span className="font-medium">Audio:</span> {correction.audioCue.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
