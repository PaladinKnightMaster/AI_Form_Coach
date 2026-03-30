"use client";

import { FormIQMetrics, getFormIQGrade, getSideBalanceFeedback } from '@/lib/validators/formIQ';

interface FormIQDisplayProps {
  formIQMetrics: FormIQMetrics;
  exercise: string;
  className?: string;
}

/**
 * FormIQDisplay — designed for dark overlay contexts (camera feed, coach HUD).
 * Uses semi-transparent backgrounds with light text for glassmorphism effect.
 */
export function FormIQDisplay({ formIQMetrics, exercise, className = '' }: FormIQDisplayProps) {
  const { grade, description, color } = getFormIQGrade(formIQMetrics.formIQ);
  const balanceFeedback = getSideBalanceFeedback(formIQMetrics.sideBalance);

  return (
    <div className={`bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Form IQ</h3>
        <div className={`text-4xl font-bold mb-2 ${color}`}>
          {grade}
        </div>
        <div className="text-2xl font-bold text-white mb-2">
          {Math.round(formIQMetrics.formIQ * 100)}%
        </div>
        <p className="text-slate-300 text-sm">
          {description}
        </p>
      </div>

      {/* Form IQ Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 text-sm">Range of Motion</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                style={{ width: `${formIQMetrics.rangeOfMotion * 100}%` }}
              />
            </div>
            <span className="text-white text-sm font-medium">
              {Math.round(formIQMetrics.rangeOfMotion * 100)}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-300 text-sm">Tempo</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${formIQMetrics.tempo * 100}%` }}
              />
            </div>
            <span className="text-white text-sm font-medium">
              {Math.round(formIQMetrics.tempo * 100)}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-300 text-sm">Stability</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                style={{ width: `${formIQMetrics.stability * 100}%` }}
              />
            </div>
            <span className="text-white text-sm font-medium">
              {Math.round(formIQMetrics.stability * 100)}%
            </span>
          </div>
        </div>

        {/* Side Balance (only for squats and pushups) */}
        {(exercise === 'squat' || exercise === 'pushup') && (
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-sm">Side Balance</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden relative">
                {/* Balance indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0.5 h-3 bg-white/50"></div>
                </div>
                <div
                  className={`h-full transition-all duration-500 ${
                    Math.abs(formIQMetrics.sideBalance - 0.5) <= 0.05
                      ? 'bg-green-500'
                      : Math.abs(formIQMetrics.sideBalance - 0.5) <= 0.1
                      ? 'bg-yellow-500'
                      : 'bg-orange-500'
                  }`}
                  style={{
                    width: '100%',
                    transform: `translateX(${(formIQMetrics.sideBalance - 0.5) * 100}%)`
                  }}
                />
              </div>
              <span className={`text-sm font-medium ${balanceFeedback.color}`}>
                {formIQMetrics.sideBalance > 0.5 ? 'R' : 'L'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Side Balance Feedback */}
      {(exercise === 'squat' || exercise === 'pushup') && (
        <div className="border-t border-white/10 pt-4">
          <p className={`text-sm ${balanceFeedback.color}`}>
            {balanceFeedback.description}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Form IQ indicator for HUD — always on dark overlay.
 */
export function FormIQIndicator({ formIQMetrics, className = '' }: { formIQMetrics: FormIQMetrics; className?: string }) {
  const { grade, color } = getFormIQGrade(formIQMetrics.formIQ);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="text-xs text-slate-300">Form IQ:</div>
      <div className={`text-lg font-bold ${color}`}>
        {grade}
      </div>
      <div className="text-sm text-white">
        {Math.round(formIQMetrics.formIQ * 100)}%
      </div>
    </div>
  );
}
