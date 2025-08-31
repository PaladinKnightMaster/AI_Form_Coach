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

export type Validator = (landmarks: SmoothedLandmark[] | null, ts: number) => ValidatorState; 