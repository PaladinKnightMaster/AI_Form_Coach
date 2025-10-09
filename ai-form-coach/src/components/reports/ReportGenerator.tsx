"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/ui/DS';
import { useFeatureAccess } from '@/components/FeatureGate';
import { reportDataCollector } from '@/lib/reports/dataCollector';
import { pdfReportGenerator } from '@/lib/reports/pdfGenerator';
import type { ReportOptions, ReportGenerationResult } from '@/lib/reports/types';
import { logEvent } from '@/lib/observability/events';

interface ReportGeneratorProps {
  sessionId: string;
  className?: string;
}

export default function ReportGenerator({ sessionId, className = '' }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<ReportGenerationResult | null>(null);
  const { hasAccess: isProUser, loading: accessLoading } = useFeatureAccess('export_data');

  const handleGenerateReport = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setLastResult(null);

    try {
      // Collect session data
      const sessionData = await reportDataCollector.collectSessionData(sessionId);
      
      if (!sessionData) {
        throw new Error('Failed to collect session data');
      }

      // Set report options based on user tier
      const options: ReportOptions = {
        includeWatermark: !isProUser,
        includeDetailedReps: isProUser || false, // Pro users get detailed rep breakdown
        includeInsights: true,
        includeNextFocus: true,
        format: 'pdf',
        quality: isProUser ? 'high' : 'standard'
      };

      // Generate report
      const result = await pdfReportGenerator.generateReport(sessionData, options, isProUser || false);
      
      setLastResult(result);

      // Log analytics
      if (result.success) {
        logEvent('report_generated', {
          sessionId,
          format: options.format,
          quality: options.quality,
          includeDetailedReps: options.includeDetailedReps,
          fileSize: result.fileSize,
          isProUser
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setLastResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [sessionId, isProUser, isGenerating]);

  if (accessLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Generate Form Report
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Export a detailed analysis of your workout session
          </p>
        </div>
        <Button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          loading={isGenerating}
          variant="primary"
        >
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>

      {/* Feature comparison */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Free Report</h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Session overview & metrics</li>
              <li>• Performance insights</li>
              <li>• Next focus areas</li>
              <li>• Standard quality PDF</li>
              <li>• Watermarked</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Pro Report</h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Everything in Free</li>
              <li>• Detailed rep breakdown</li>
              <li>• High-quality PDF</li>
              <li>• No watermark</li>
              <li>• Priority support</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Result feedback */}
      {lastResult && (
        <div className={`p-4 rounded-lg ${
          lastResult.success 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          {lastResult.success ? (
            <div>
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Report generated successfully!</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                File: {lastResult.fileName} 
                {lastResult.fileSize && ` (${Math.round(lastResult.fileSize / 1024)} KB)`}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Failed to generate report</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {lastResult.error}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pro upgrade prompt for free users */}
      {!isProUser && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 dark:text-blue-400 text-lg">💎</div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Upgrade to Pro for Enhanced Reports
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Get detailed rep breakdowns, high-quality exports, and watermark-free reports.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/pricing', '_blank')}
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
