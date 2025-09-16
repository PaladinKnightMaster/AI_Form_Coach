"use client";

import { useState } from 'react';
import { Button, Icon, Badge } from '@/ui/DS';
import type { UserPlan } from '@/types/plans';

interface PlanManagementModalProps {
  plan: UserPlan;
  isOpen: boolean;
  onClose: () => void;
  onRemove: (planId: string) => void;
  onContinue: () => void;
  onToggleActive: (planId: string, isActive: boolean) => void;
  isRemoving?: boolean;
  isUpdating?: boolean;
}

export default function PlanManagementModal({
  plan,
  isOpen,
  onClose,
  onRemove,
  onContinue,
  onToggleActive,
  isRemoving = false,
  isUpdating = false
}: PlanManagementModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleDelete = () => {
    onRemove(plan.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage Plan
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* Plan Info */}
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {plan.name}
              </h3>
              <Badge tone={plan.is_active ? "success" : "warning"}>
                {plan.is_active ? "Active" : "Paused"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  Week {plan.current_week}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Current Week</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  Day {plan.current_day}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Current Day</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {new Date(plan.created_at).toLocaleDateString()}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Started</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {plan.plan_templates?.duration_weeks || 'N/A'} weeks
                </div>
                <div className="text-gray-500 dark:text-gray-400">Duration</div>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Progress Overview
            </h4>
            
            <div className="space-y-3">
              {/* Week Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Week Progress</span>
                  <span className="text-gray-900 dark:text-white">
                    {plan.current_week} / {plan.plan_templates?.duration_weeks || 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, ((plan.current_week - 1) / (plan.plan_templates?.duration_weeks || 1)) * 100)}%` 
                    }}
                  />
                </div>
              </div>

              {/* Day Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Day Progress</span>
                  <span className="text-gray-900 dark:text-white">
                    {plan.current_day} / {plan.plan_templates?.sessions_per_week || 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, ((plan.current_day - 1) / (plan.plan_templates?.sessions_per_week || 1)) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Actions
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={onContinue}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Icon name="play" className="w-4 h-4 mr-2" />
                Continue Plan
              </Button>
              
              <Button
                onClick={() => onToggleActive(plan.id, !plan.is_active)}
                disabled={isUpdating}
                className={`${plan.is_active 
                  ? 'bg-yellow-500 hover:bg-yellow-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
                } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </div>
                ) : (
                  <>
                    <Icon name={plan.is_active ? "pause" : "play"} className="w-4 h-4 mr-2" />
                    {plan.is_active ? 'Pause Plan' : 'Resume Plan'}
                  </>
                )}
              </Button>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <h5 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">
                Danger Zone
              </h5>
              
              {!showDeleteConfirm ? (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Icon name="trash" className="w-4 h-4 mr-2" />
                  Remove Plan
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Are you sure you want to remove this plan? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleDelete}
                      disabled={isRemoving}
                      className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                    >
                      {isRemoving ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Removing...
                        </div>
                      ) : (
                        'Yes, Remove'
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
