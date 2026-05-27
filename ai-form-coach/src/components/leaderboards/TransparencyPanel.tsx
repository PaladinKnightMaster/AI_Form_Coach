"use client";

import { useState } from 'react';
import { Icon } from '@/ui/DS';

interface TransparencyPanelProps {
  className?: string;
}

export default function TransparencyPanel({ className = '' }: TransparencyPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center">
            <Icon name="alert-circle" className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-medium text-gray-900">
              How are these scores calculated?
            </span>
          </div>
          <Icon 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            className="w-5 h-5 text-gray-500" 
          />
        </button>

        {isOpen && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {/* Verification Explanation */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                What &ldquo;Verified&rdquo; Means
              </h4>
              <p className="text-sm text-gray-600">
                Verified sessions have proper camera positioning, adequate lighting, and consistent pose visibility (≥80% of frames). 
                These provide the most accurate form analysis and are included in leaderboards by default.
              </p>
            </div>

            {/* Metric Formulas */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Scoring Metrics
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Quality Score</div>
                  <p className="text-gray-600">
                    0-100% for each rep based on form accuracy, range of motion, and movement control. 
                    Scores above 70% are considered &ldquo;correct.&rdquo;
                  </p>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Correct Rate</div>
                  <p className="text-gray-600">
                    Percentage of reps that score above 70% quality threshold.
                  </p>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Integrity Score</div>
                  <p className="text-gray-600">
                    Measures consistency of good form throughout the session - 
                    how many reps meet quality standards.
                  </p>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Volume</div>
                  <p className="text-gray-600">
                    Total reps multiplied by average quality score - 
                    rewards both quantity and quality.
                  </p>
                </div>
              </div>
            </div>

            {/* Exercise-Specific Criteria */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Exercise-Specific Criteria
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Squats</div>
                  <p className="text-gray-600">
                    Hip crease below knee level, knees tracking over toes, chest up, full return to standing
                  </p>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Push-ups</div>
                  <p className="text-gray-600">
                    Chest to ground, straight body line, full arm extension, controlled tempo
                  </p>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Planks</div>
                  <p className="text-gray-600">
                    Straight body line, engaged core, no sagging hips or raised buttocks
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Note */}
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-start">
                <Icon name="lock" className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-blue-900 text-sm">
                    On-Device Processing
                  </div>
                  <p className="text-blue-700 text-xs mt-1">
                    All video analysis happens on your device using MediaPipe technology. 
                    Your video never leaves your device - only numerical scores are stored.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
