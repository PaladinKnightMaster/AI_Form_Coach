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
  lastRepErrors
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
}) {
	const pct = (spark.filter(Boolean).length / Math.max(1, spark.length)) * 100;
	return (
		<div className="absolute top-4 left-4 bg-white/70 backdrop-blur rounded-lg px-3 py-2">
			<div className={`${large ? 'text-7xl' : 'text-5xl'} font-bold`}>{repCount}</div>
			<div className="text-sm opacity-80">{cue || '—'}</div>
			{subtext ? <div className="text-xs opacity-80 mt-0.5">{subtext}</div> : null}
			{pills && pills.length > 0 && (
				<div className="flex gap-1 mt-1">
					{pills.map((p, i) => (
						<span key={`${p}-${i}`} className="text-[10px] px-2 py-0.5 rounded-full bg-black/10">{p}</span>
					))}
				</div>
			)}
			<div className="mt-2 h-8 w-40 bg-gray-200 rounded overflow-hidden">
				<div className="h-full bg-green-500" style={{ width: `${pct}%` }} />
			</div>
			
			{/* Pose Quality Light */}
			{poseQuality && (
				<div className="mt-2 flex items-center gap-2">
					<div className={`w-3 h-3 rounded-full border-2 ${
						poseQuality.state === 'good' ? 'bg-green-500 border-green-600' :
						poseQuality.state === 'fair' ? 'bg-yellow-500 border-yellow-600' :
						'bg-red-500 border-red-600'
					}`} />
					<span className="text-xs font-medium text-gray-700">
						{poseQuality.state === 'good' ? 'Good' :
						 poseQuality.state === 'fair' ? 'Fair' : 'Low'} 
						({Math.round(poseQuality.score * 100)}%)
					</span>
				</div>
			)}
			
			{/* Correctness Badge */}
			{showCorrectnessBadge && lastRepCorrect !== undefined && (
				<div className={`mt-2 px-2 py-1 rounded-full text-xs font-medium transition-opacity duration-1000 ${
					lastRepCorrect 
						? 'bg-green-100 text-green-800 border border-green-200' 
						: 'bg-red-100 text-red-800 border border-red-200'
				}`}>
					{lastRepCorrect ? '✓ Correct' : 'Try again'}
				</div>
			)}
			
			{/* Error Chips - P3: Show up to 2 error chips for 1 second */}
			{showCorrectnessBadge && lastRepErrors && lastRepErrors.length > 0 && !lastRepCorrect && (
				<div className="mt-1 flex flex-wrap gap-1 transition-opacity duration-1000">
					{lastRepErrors.slice(0, 2).map((error, index) => (
						<div key={index} className={`px-2 py-1 rounded-full text-xs font-medium ${
							error.severity === 'high' ? 'bg-red-100 text-red-800 border border-red-200' :
							error.severity === 'medium' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
							'bg-yellow-100 text-yellow-800 border border-yellow-200'
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
			)}
			
			{/* Mentor Cue Primary Pill */}
			{mentorCue && (
				<div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium border ${
					mentorCue.severity === 5 ? 'bg-red-100 text-red-800 border-red-200' : // Critical
					mentorCue.severity === 4 ? 'bg-orange-100 text-orange-800 border-orange-200' : // High
					mentorCue.severity === 3 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : // Medium
					mentorCue.severity === 2 ? 'bg-blue-100 text-blue-800 border-blue-200' : // Low
					'bg-green-100 text-green-800 border-green-200' // Positive
				}`}>
					{mentorCue.severity === 5 ? '🚨' : 
					 mentorCue.severity === 4 ? '⚠️' : 
					 mentorCue.severity === 3 ? '⚡' : 
					 mentorCue.severity === 2 ? '💡' : '✅'} {mentorCue.text}
				</div>
			)}
			
			{/* Last Cue Chip - Fading animation */}
			{lastCueKey && lastCueKey !== mentorCue?.key && (
				<div className="mt-1 px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600 border border-gray-200 animate-fade-out">
					Last: {lastCueKey.replace(/_/g, ' ')}
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