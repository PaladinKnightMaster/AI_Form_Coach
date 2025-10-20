"use client";

import { FormIQIndicator } from './FormIQDisplay';
import type { FormIQMetrics } from '@/lib/validators/formIQ';

export default function HUD({ 
  repCount, 
  cue, 
  spark, 
  subtext, 
  large, 
  pills,
  formIQMetrics,
  lastRepCorrect,
  showCorrectnessBadge,
  mentorCue,
  lastCueKey,
  poseQuality,
  lastRepErrors,
  wakeLockActive,
  enhancedPhaseDetection
}: { 
  repCount: number; 
  cue: string; 
  spark: number[]; 
  subtext?: string; 
  large?: boolean; 
  pills?: string[];
  formIQMetrics?: FormIQMetrics;
  lastRepCorrect?: boolean;
  showCorrectnessBadge?: boolean;
  mentorCue?: {
    key: string;
    text: string;
    severity: number;
    shouldSpeak: boolean;
  };
  lastCueKey?: string;
  poseQuality?: {
    score: number;
    state: 'good' | 'fair' | 'low';
  };
  lastRepErrors?: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  wakeLockActive?: boolean;
  enhancedPhaseDetection?: {
    enabled: boolean;
    confidence: number;
    smoothedValue: number;
    originalValue: number;
    processingTime: number;
  };
}) {
	const pct = (spark.filter(Boolean).length / Math.max(1, spark.length)) * 100;
	return (
		<div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md rounded-xl px-4 py-3 shadow-lg border border-white/20 min-w-[200px]">
			{/* Rep Count - Main Display */}
			<div className="text-center mb-3">
				<div className={`${large ? 'text-6xl' : 'text-4xl'} font-bold text-gray-800`}>{repCount}</div>
				<div className="text-xs text-gray-500 uppercase tracking-wide">Reps</div>
			</div>
			
			{/* Status Messages */}
			<div className="space-y-1 mb-3">
				<div className="text-sm font-medium text-gray-700 text-center">{cue || 'Ready to start'}</div>
				{subtext && <div className="text-xs text-gray-500 text-center">{subtext}</div>}
			</div>
			{/* Pills/Tags */}
			{pills && pills.length > 0 && (
				<div className="flex flex-wrap gap-1 mb-3 justify-center">
					{pills.map((p, i) => (
						<span key={`${p}-${i}`} className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">{p}</span>
					))}
				</div>
			)}
			
			{/* Progress Bar */}
			<div className="mb-3">
				<div className="flex justify-between items-center mb-1">
					<span className="text-xs text-gray-500">Progress</span>
					<span className="text-xs text-gray-500">{Math.round(pct)}%</span>
				</div>
				<div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
					<div className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300" style={{ width: `${pct}%` }} />
				</div>
			</div>
			
			{/* Status Indicators */}
			<div className="space-y-2">
				{/* Pose Quality Indicator */}
				{poseQuality && (
					<div className="flex items-center justify-between">
						<span className="text-xs text-gray-500">Pose Quality</span>
						<div className="flex items-center gap-2">
							<div className={`w-2 h-2 rounded-full ${
								poseQuality.state === 'good' ? 'bg-green-500' :
								poseQuality.state === 'fair' ? 'bg-yellow-500' :
								'bg-red-500 animate-pulse'
							}`} />
							<span className={`text-xs font-medium ${
								poseQuality.state === 'good' ? 'text-green-600' :
								poseQuality.state === 'fair' ? 'text-yellow-600' :
								'text-red-600'
							}`}>
								{poseQuality.state === 'good' ? 'Good' :
								 poseQuality.state === 'fair' ? 'Fair' : 'Low'} 
								({Math.round(poseQuality.score * 100)}%)
							</span>
						</div>
					</div>
				)}
			
				{/* Correctness Badge */}
				{showCorrectnessBadge && lastRepCorrect !== undefined && (
					<div className="flex items-center justify-between">
						<span className="text-xs text-gray-500">Last Rep</span>
						<div className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
							lastRepCorrect 
								? 'bg-green-100 text-green-700 border border-green-200' 
								: 'bg-red-100 text-red-700 border border-red-200'
						}`}>
							{lastRepCorrect ? '✓ Correct' : '✗ Try again'}
						</div>
					</div>
				)}
				
				{/* Error Chips */}
				{showCorrectnessBadge && lastRepErrors && lastRepErrors.length > 0 && !lastRepCorrect && (
					<div className="space-y-1">
						<span className="text-xs text-gray-500">Issues</span>
						<div className="flex flex-wrap gap-1">
							{lastRepErrors.slice(0, 2).map((error, index) => (
								<div key={index} className={`px-2 py-1 rounded-full text-xs font-medium ${
									error.severity === 'high' ? 'bg-red-100 text-red-700 border border-red-200' :
									error.severity === 'medium' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
									'bg-yellow-100 text-yellow-700 border border-yellow-200'
								}`}>
									{error.type === 'depth_low' ? '📏 Depth' :
									 error.type === 'knee_valgus' ? '🦵 Knees' :
									 error.type === 'chest_drop' ? '📉 Chest' :
									 error.type === 'hip_sag' ? '📐 Hips' :
									 error.type === 'tempo_fast' ? '⚡ Fast' :
									 error.type === 'tempo_slow' ? '🐌 Slow' :
									 error.type === 'bodyline_poor' ? '📐 Line' :
									 error.type}
								</div>
							))}
						</div>
					</div>
				)}
			</div>
			
			{/* Mentor Cue */}
			{mentorCue && (
				<div className={`mt-3 p-2 rounded-lg border ${
					mentorCue.severity === 5 ? 'bg-red-50 border-red-200' : // Critical
					mentorCue.severity === 4 ? 'bg-orange-50 border-orange-200' : // High
					mentorCue.severity === 3 ? 'bg-yellow-50 border-yellow-200' : // Medium
					mentorCue.severity === 2 ? 'bg-blue-50 border-blue-200' : // Low
					'bg-green-50 border-green-200' // Positive
				}`}>
					<div className="flex items-center gap-2">
						<span className="text-lg">
							{mentorCue.severity === 5 ? '🚨' : 
							 mentorCue.severity === 4 ? '⚠️' : 
							 mentorCue.severity === 3 ? '⚡' : 
							 mentorCue.severity === 2 ? '💡' : '✅'}
						</span>
						<span className={`text-sm font-medium ${
							mentorCue.severity === 5 ? 'text-red-700' :
							mentorCue.severity === 4 ? 'text-orange-700' :
							mentorCue.severity === 3 ? 'text-yellow-700' :
							mentorCue.severity === 2 ? 'text-blue-700' :
							'text-green-700'
						}`}>
							{mentorCue.text}
						</span>
					</div>
				</div>
			)}
			
			{/* Last Cue Chip - Fading animation */}
			{lastCueKey && lastCueKey !== mentorCue?.key && (
				<div className="mt-1 px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600 border border-gray-200 animate-fade-out">
					Last: {lastCueKey.replace(/_/g, ' ')}
				</div>
			)}
			
			{/* Wake Lock Status Indicator */}
			{wakeLockActive && (
				<div className="mt-2 flex items-center gap-1 text-xs text-green-600">
					<span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
					<span>Screen awake</span>
				</div>
			)}
			
			{/* Enhanced Phase Detection Indicator (P9) */}
			{enhancedPhaseDetection?.enabled && (
				<div className="mt-2 flex items-center gap-2 text-xs">
					<div className={`w-2 h-2 rounded-full ${
						enhancedPhaseDetection.confidence > 0.8 ? 'bg-green-500' :
						enhancedPhaseDetection.confidence > 0.6 ? 'bg-yellow-500' :
						'bg-red-500'
					}`} />
					<span className="text-gray-600">
						Enhanced Phase Detection ({Math.round(enhancedPhaseDetection.confidence * 100)}%)
					</span>
				</div>
			)}
			
			{/* Form IQ Indicator */}
			{formIQMetrics && repCount > 0 && (
				<div className="mt-2 pt-2 border-t border-gray-300">
					<FormIQIndicator formIQMetrics={formIQMetrics} />
				</div>
			)}
		</div>
	);
} 