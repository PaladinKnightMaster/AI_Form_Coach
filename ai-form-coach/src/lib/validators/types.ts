import type { SmoothedLandmark } from '../pose';

export type Exercise = 'squat' | 'pushup' | 'plank';
export type Phase = 'idle' | 'down' | 'up' | 'hold';

export type RepMetric = {
	startTs: number;
	endTs: number;
	peakAngle?: number;
	peakDepth?: number;
	speed?: number;
	romFlags?: string[];
};

export type ValidatorState = {
	repCount: number;
	phase: Phase;
	cues: string[];
	metrics: RepMetric[];
};

export type ValidatorConfig = {
	debounceFrames?: number; // frames required to confirm a phase change
	// Optional thresholds per exercise
	squat?: { downDepth: number; upDepth: number };
	pushup?: { bottomElbow: number; topElbow: number };
	plank?: { minHipAngle: number };
};

export type Validator = (landmarks: SmoothedLandmark[] | null, ts: number, cfg?: ValidatorConfig) => ValidatorState; 