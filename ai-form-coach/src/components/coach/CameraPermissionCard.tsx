"use client";

import { useState } from "react";
import { Button, Card, Icon } from "@/ui/DS";

interface CameraPermissionCardProps {
  onAllow: () => void;
}

export default function CameraPermissionCard({ onAllow }: CameraPermissionCardProps) {
  const [faqOpen, setFaqOpen] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full text-center" padding="lg">
        {/* Camera icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg">
          <Icon name="camera" className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          Camera Access Needed
        </h2>

        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          AI Form Coach uses your camera to see your exercise form and give real-time feedback.
        </p>

        {/* Privacy assurance */}
        <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-6 text-left">
          <div className="flex-shrink-0 mt-0.5">
            <Icon name="lock" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
            Your video is processed <strong>on your device</strong> and is <strong>never uploaded or stored</strong>. All AI analysis happens locally in your browser.
          </p>
        </div>

        {/* Skeleton preview illustration */}
        <div className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon name="activity" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              How it works
            </span>
          </div>
          {/* Simplified skeleton figure SVG */}
          <svg viewBox="0 0 120 160" className="w-20 h-28 mx-auto" aria-hidden="true">
            {/* Head */}
            <circle cx="60" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            {/* Torso */}
            <line x1="60" y1="30" x2="60" y2="80" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            {/* Arms */}
            <line x1="60" y1="45" x2="30" y2="65" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            <line x1="60" y1="45" x2="90" y2="65" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            {/* Legs */}
            <line x1="60" y1="80" x2="40" y2="120" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            <line x1="60" y1="80" x2="80" y2="120" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            {/* Joint dots */}
            <circle cx="60" cy="45" r="3" className="fill-emerald-500" />
            <circle cx="30" cy="65" r="3" className="fill-emerald-500" />
            <circle cx="90" cy="65" r="3" className="fill-emerald-500" />
            <circle cx="60" cy="80" r="3" className="fill-emerald-500" />
            <circle cx="40" cy="120" r="3" className="fill-emerald-500" />
            <circle cx="80" cy="120" r="3" className="fill-emerald-500" />
            {/* Angle arc hint */}
            <path d="M 50 95 A 15 15 0 0 1 60 80" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" className="text-teal-400" />
          </svg>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            We track key body joints to analyze your form in real time.
          </p>
        </div>

        {/* CTA button */}
        <Button
          variant="primary"
          size="lg"
          className="w-full mb-4"
          onClick={onAllow}
        >
          Allow Camera Access
          <Icon name="arrow-right" className="w-4 h-4 ml-1" />
        </Button>

        {/* Expandable FAQ */}
        <button
          type="button"
          onClick={() => setFaqOpen(!faqOpen)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors inline-flex items-center gap-1"
        >
          Why do you need my camera?
          <Icon name={faqOpen ? "chevron-up" : "chevron-down"} className="w-3 h-3" />
        </button>

        {faqOpen && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 text-left bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 leading-relaxed">
            <p className="mb-2">
              <strong>Form analysis:</strong> Your camera feed is processed by MediaPipe, a machine learning model that runs entirely in your browser. It identifies body landmarks (shoulders, hips, knees, ankles) to measure joint angles during exercises.
            </p>
            <p className="mb-2">
              <strong>Privacy:</strong> No video frames ever leave your device. There are no servers involved in the pose analysis — everything happens locally using your device&apos;s processor.
            </p>
            <p>
              <strong>You stay in control:</strong> You can revoke camera access at any time through your browser settings.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
