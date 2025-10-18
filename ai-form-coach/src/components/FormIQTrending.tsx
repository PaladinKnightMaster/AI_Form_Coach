"use client";

import { useState } from 'react';
import { getFormIQGrade, getSideBalanceFeedback } from '@/lib/validators/formIQ';

interface FormIQTrendingProps {
  sessions: Array<{
    id: string;
    exercise: string;
    started_at: string;
    formIQ?: number;
    sideBalance?: number;
    is_demo?: boolean;
  }>;
  isPro: boolean;
  className?: string;
}

export function FormIQTrending({ sessions, isPro, className = '' }: FormIQTrendingProps) {
  const [selectedMetric, setSelectedMetric] = useState<'formIQ' | 'sideBalance'>('formIQ');

  // Calculate trending data
  const last7Days = sessions.filter(s => {
    const sessionDate = new Date(s.started_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  });

  const avgFormIQ = sessions.length > 0 
    ? sessions.reduce((sum, s) => sum + (s.formIQ ?? 0), 0) / sessions.length 
    : 0;

  const avgSideBalance = sessions.filter(s => s.sideBalance !== undefined).length > 0
    ? sessions.filter(s => s.sideBalance !== undefined).reduce((sum, s) => sum + (s.sideBalance ?? 0.5), 0) / sessions.filter(s => s.sideBalance !== undefined).length
    : 0.5;

  const { grade: formIQGrade, color: formIQColor } = getFormIQGrade(avgFormIQ);
  const balanceFeedback = getSideBalanceFeedback(avgSideBalance);

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Form Analytics</h3>
        {!isPro && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full">
            <span className="text-purple-700 text-xs font-medium">Pro Feature</span>
          </div>
        )}
      </div>

      {/* Metric Selector */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setSelectedMetric('formIQ')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            selectedMetric === 'formIQ'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Form IQ
        </button>
        <button
          onClick={() => setSelectedMetric('sideBalance')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            selectedMetric === 'sideBalance'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Side Balance
        </button>
      </div>

      {isPro ? (
        <>
          {/* Current Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <InsightCard 
              title="Average Form IQ" 
              value={`${formIQGrade} (${Math.round(avgFormIQ * 100)}%)`}
              className={`border-l-4 border-${formIQColor}-500`}
            />
            <InsightCard 
              title="Side Balance" 
              value={`${Math.abs(avgSideBalance - 0.5) <= 0.05 ? '⚖️' : avgSideBalance > 0.5 ? '➡️' : '⬅️'} ${Math.round(Math.abs(avgSideBalance - 0.5) * 200)}%`}
              subtitle={balanceFeedback.description}
            />
          </div>

          {/* Trending Chart */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedMetric === 'formIQ' ? 'Form IQ Trend' : 'Side Balance Trend'}
            </h4>
            <div className="h-48 bg-gray-50 rounded-xl p-4 flex items-end justify-between">
              {last7Days.length > 0 ? (
                last7Days.map((session) => {
                  const value = selectedMetric === 'formIQ' 
                    ? (session.formIQ ?? 0) 
                    : Math.abs((session.sideBalance ?? 0.5) - 0.5) * 2; // Convert balance to 0-1 imbalance scale
                  
                  const height = `${value * 100}%`;
                  const color = selectedMetric === 'formIQ'
                    ? value >= 0.8 ? 'bg-green-500' : value >= 0.6 ? 'bg-blue-500' : 'bg-orange-500'
                    : value <= 0.1 ? 'bg-green-500' : value <= 0.2 ? 'bg-yellow-500' : 'bg-orange-500';

                  return (
                    <div key={session.id} className="flex flex-col items-center flex-1">
                      <div className="w-full max-w-8 mx-2">
                        <div 
                          className={`${color} rounded-t transition-all duration-500 hover:opacity-80`}
                          style={{ height }}
                          title={`${session.exercise} - ${selectedMetric === 'formIQ' ? `${Math.round(value * 100)}%` : `${Math.round(value * 100)}% imbalance`}`}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-bottom-left">
                        {new Date(session.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full text-center text-gray-500">
                  <p>No data for the last 7 days</p>
                  <p className="text-sm">Complete workouts to see trending</p>
                </div>
              )}
            </div>
          </div>

          {/* Insights */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
            <h4 className="font-semibold text-gray-900 mb-2">💡 Insights</h4>
            <div className="space-y-2 text-sm text-gray-700">
              {avgFormIQ >= 0.8 && (
                <p>🎯 Excellent form consistency! Keep up the great work.</p>
              )}
              {avgFormIQ < 0.6 && (
                <p>📈 Focus on form quality over quantity for better results.</p>
              )}
              {Math.abs(avgSideBalance - 0.5) > 0.1 && (
                <p>⚖️ Work on balancing both sides equally for optimal development.</p>
              )}
              {last7Days.length >= 5 && (
                <p>🔥 Great consistency! You&apos;ve been active {last7Days.length} times this week.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Pro Upgrade Prompt */
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h4 className="text-xl font-bold text-gray-900 mb-4">Unlock Advanced Analytics</h4>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Get detailed Form IQ trending, side balance analysis, and personalized insights to optimize your training.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
              <span>✨ Form IQ trending charts</span>
              <span>⚖️ Side balance analysis</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
              <span>📈 Performance insights</span>
              <span>🎯 Personalized recommendations</span>
            </div>
          </div>
          <div className="mt-8">
            <a 
              href="/pricing" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 font-medium"
            >
              Upgrade to Pro
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Insight card for basic metrics
 */
function InsightCard({ title, value, subtitle, className }: { title: string; value: string; subtitle?: string; className?: string }) {
  return (
    <div className={`bg-white p-4 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow duration-300 ${className || ''}`}>
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}
