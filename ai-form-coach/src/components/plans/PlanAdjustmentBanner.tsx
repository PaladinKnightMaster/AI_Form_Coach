"use client";

import { useState, useEffect } from 'react';
import { Button, Icon, Badge } from '@/ui/DS';
import { PlanAdjustmentService, type PlanAdjustment } from '@/lib/plans/planAdjustments';
import type { UserPlan } from '@/types/plans';
import type { ReadinessAssessment } from '@/lib/progression/engine';

interface PlanAdjustmentBannerProps {
  plan: UserPlan | null;
  readiness: ReadinessAssessment | null;
  currentDay: number;
  onPlanUpdate?: (adjustedPlan: UserPlan) => void;
}

export default function PlanAdjustmentBanner({
  plan,
  readiness,
  currentDay,
  onPlanUpdate
}: PlanAdjustmentBannerProps) {
  const [adjustment, setAdjustment] = useState<PlanAdjustment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [adjustmentService] = useState(() => new PlanAdjustmentService());

  useEffect(() => {
    if (plan && readiness) {
      const planAdjustment = adjustmentService.adjustPlanForReadiness(plan, readiness, currentDay);
      setAdjustment(planAdjustment);
    }
  }, [plan, readiness, currentDay, adjustmentService]);

  if (!adjustment || adjustment.type === 'none') {
    return null;
  }

  const details = adjustmentService.getAdjustmentDetails(adjustment);
  const summary = adjustmentService.getAdjustmentSummary(adjustment);

  const handleApplyAdjustment = async () => {
    if (adjustment && adjustment.type !== 'none') {
      const success = await adjustmentService.saveAdjustedPlan(adjustment.adjustedPlan);
      if (success && onPlanUpdate) {
        onPlanUpdate(adjustment.adjustedPlan);
      }
    }
  };

  const handleDismiss = () => {
    setAdjustment(null);
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
      case 'green':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getColorClasses(details.color)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{details.icon}</div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">
              {details.title}
            </h3>
            <p className="text-sm opacity-90 mb-2">
              {details.description}
            </p>
            
            {showDetails && details.adjustments.length > 0 && (
              <div className="mt-3 space-y-1">
                <h4 className="text-xs font-medium opacity-75">Adjustments made:</h4>
                <ul className="text-xs space-y-1">
                  {details.adjustments.map((adj, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-xs opacity-60">•</span>
                      <span>{adj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs bg-transparent hover:bg-black/10 dark:hover:bg-white/10 px-2 py-1"
          >
            <Icon name={showDetails ? "chevron-up" : "chevron-down"} className="w-3 h-3" />
          </Button>
          <Button
            onClick={handleDismiss}
            className="text-xs bg-transparent hover:bg-black/10 dark:hover:bg-white/10 px-2 py-1"
          >
            <Icon name="x" className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-3">
        <Button
          onClick={handleApplyAdjustment}
          className={`text-xs px-3 py-1 ${
            details.color === 'blue' 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : details.color === 'yellow'
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : details.color === 'green'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
        >
          <Icon name="check" className="w-3 h-3 mr-1" />
          Apply Adjustment
        </Button>
        
        <Button
          onClick={handleDismiss}
          className="text-xs bg-transparent hover:bg-black/10 dark:hover:bg-white/10 px-3 py-1"
        >
          Keep Original Plan
        </Button>
      </div>
      
      <div className="mt-2 text-xs opacity-75">
        Readiness: {Math.round((readiness?.overallScore || 0) * 100)}% • 
        Soreness: {Math.round((readiness?.soreness || 0) * 100)}%
      </div>
    </div>
  );
}
