"use client";

import { useState } from 'react';
import type { CoachingInsight, SessionAnalysis } from '@/lib/insights/coachingInsights';

interface CoachingInsightsProps {
  sessionAnalysis: SessionAnalysis;
  className?: string;
}

export function CoachingInsights({ sessionAnalysis, className = '' }: CoachingInsightsProps) {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const toggleInsight = (insightId: string) => {
    setExpandedInsight(expandedInsight === insightId ? null : insightId);
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Session Insights</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Overall Score:</span>
          <div className={`text-lg font-bold ${getScoreColor(sessionAnalysis.overallScore)}`}>
            {Math.round(sessionAnalysis.overallScore * 100)}%
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-3 mb-6">
        {sessionAnalysis.insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            isExpanded={expandedInsight === insight.id}
            onToggle={() => toggleInsight(insight.id)}
          />
        ))}
      </div>

      {/* Recommendations */}
      {sessionAnalysis.recommendations.length > 0 && (
        <div className="border-t border-gray-100 pt-6">
          <h4 className="font-semibold text-gray-900 mb-3">💡 Recommendations</h4>
          <div className="space-y-2">
            {sessionAnalysis.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Session Suggestion */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mt-6 border border-blue-100">
        <h4 className="font-semibold text-gray-900 mb-2">🎯 Next Session</h4>
        <p className="text-sm text-gray-700">{sessionAnalysis.nextSessionSuggestion}</p>
      </div>
    </div>
  );
}

/**
 * Individual insight card component
 */
function InsightCard({ 
  insight, 
  isExpanded, 
  onToggle 
}: { 
  insight: CoachingInsight; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  const getBorderColor = () => {
    switch (insight.type) {
      case 'achievement': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-orange-200 bg-orange-50';
      case 'tip': return 'border-blue-200 bg-blue-50';
      case 'habit': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`rounded-xl border p-4 transition-all duration-300 hover:shadow-md ${getBorderColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{insight.icon}</span>
          <div>
            <h4 className={`font-semibold ${insight.color}`}>{insight.title}</h4>
            <p className="text-sm text-gray-600">{insight.message}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {insight.action && (
            <a
              href={insight.action.href}
              className="text-xs bg-white px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors font-medium"
            >
              {insight.action.text}
            </a>
          )}
          
          <button
            onClick={onToggle}
            className="p-1 hover:bg-white/50 rounded-full transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Priority:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                insight.priority === 'high' 
                  ? 'bg-red-100 text-red-700' 
                  : insight.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {insight.priority}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Type:</span>
              <span className="capitalize">{insight.type}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Get color for overall score
 */
function getScoreColor(score: number): string {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-blue-600';
  if (score >= 0.4) return 'text-yellow-600';
  return 'text-orange-600';
}

/**
 * Compact insights widget for sidebar
 */
export function CompactInsights({ insights, className = '' }: { insights: CoachingInsight[]; className?: string }) {
  const highPriorityInsights = insights.filter(i => i.priority === 'high').slice(0, 2);

  if (highPriorityInsights.length === 0) return null;

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 ${className}`}>
      <h4 className="font-semibold text-white mb-3">💡 Quick Tips</h4>
      <div className="space-y-2">
        {highPriorityInsights.map((insight) => (
          <div key={insight.id} className="flex items-center gap-2">
            <span className="text-lg">{insight.icon}</span>
            <p className="text-sm text-gray-200">{insight.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
