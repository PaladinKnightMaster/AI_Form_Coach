import type { PoseEstimateResult } from '../pose/engine';

export type Exercise = 'squat' | 'pushup' | 'plank';
export type Phase = 'idle' | 'down' | 'up' | 'hold';

// Enhanced error types for detailed form analysis
export type FormError = {
	type: 'depth_low' | 'knee_valgus' | 'chest_drop' | 'hip_sag' | 'tempo_fast' | 'tempo_slow' | 'bodyline_poor';
	severity: 'low' | 'medium' | 'high';
	duration: number; // Duration in milliseconds
	message: string;
	timestamp: number;
	value?: number; // The measured value that caused the error
	threshold?: number; // The threshold that was exceeded
};

// Enhanced rep metrics with comprehensive form analysis
export type RepMetric = {
	startTs: number;
	endTs: number;
	peakAngle?: number;
	peakDepth?: number;
	speed?: number;
	romFlags?: string[];
	formIQ?: number;
	sideBalance?: number;
	valid?: boolean; // Used for undo functionality
	
	// Enhanced metrics
	duration: number; // Rep duration in milliseconds
	tempo: 'fast' | 'normal' | 'slow'; // Tempo classification
	errors: FormError[]; // Form errors detected during this rep
	quality: 'excellent' | 'good' | 'fair' | 'poor'; // Overall rep quality
	score: number; // 0-100 quality score
	
	// Exercise-specific metrics
	squat?: {
		depth: number; // Actual depth achieved
		torsoAngle: number; // Torso angle at bottom
		kneeValgus: number; // Knee valgus measurement
	};
	pushup?: {
		elbowAngle: number; // Elbow angle at bottom
		bodyLine: number; // Body line angle
		bodyLinePercentage: number; // % of rep with good body line
	};
	plank?: {
		bodyLine: number; // Average body line angle
		bodyLinePercentage: number; // % of hold with good body line
		hipSagDuration: number; // Duration of hip sag in ms
	};
};

export type ValidatorState = {
	repCount: number;
	phase: Phase;
	cues: string[];
	metrics: RepMetric[];
	
	// Enhanced state tracking
	currentRep?: {
		startTs: number;
		phaseHistory: Array<{ phase: Phase; timestamp: number }>;
		errorHistory: FormError[];
		measurements: {
			angles: number[];
			depths: number[];
			bodyLines: number[];
		};
	};
	
	// Session-level metrics
	sessionMetrics?: {
		averageTempo: number;
		errorRate: number;
		qualityDistribution: Record<string, number>;
		improvementTrend: number;
	};
};

export type ValidatorConfig = {
	debounceFrames?: number; // frames required to confirm a phase change
	bestSide?: 'left' | 'right'; // PoseEngine2's detected best visible side
	
	// Tempo thresholds (in milliseconds)
	tempoThresholds?: {
		fast: number; // < 600ms
		slow: number; // > 2500ms
	};
	
	// Error detection thresholds
	errorThresholds?: {
		valgusTolerance: number; // % of hip width for knee valgus
		bodyLineTolerance: number; // degrees for body line errors
		errorDurationThresholds: {
			valgus: number; // ms
			chestDrop: number; // ms
			hipSag: number; // ms
		};
	};
	
	// Optional thresholds per exercise
	squat?: { 
		downDepth: number; 
		upDepth: number;
		minDepthPercentage?: number; // % of calibrated depth required
	};
	pushup?: { 
		bottomElbow: number; 
		topElbow: number;
		bodyLineThreshold?: number; // degrees
		bodyLinePercentage?: number; // % of rep required
	};
	plank?: { 
		minHipAngle: number;
		bodyLineThreshold?: number; // degrees
		hipSagThreshold?: number; // ms
	};
};

export type Validator = (result: PoseEstimateResult | null, ts: number, cfg?: ValidatorConfig) => ValidatorState | Promise<ValidatorState>; 