import type { PoseEstimateResult } from '../pose/engine';

export type Exercise = 'squat' | 'pushup' | 'plank';
export type Phase = 'idle' | 'down' | 'up' | 'hold';

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
};

export type ValidatorState = {
	repCount: number;
	phase: Phase;
	cues: string[];
	metrics: RepMetric[];
};

export type ValidatorConfig = {
	debounceFrames?: number; // frames required to confirm a phase change
	bestSide?: 'left' | 'right'; // PoseEngine2's detected best visible side
	// Optional thresholds per exercise
	squat?: { downDepth: number; upDepth: number };
	pushup?: { bottomElbow: number; topElbow: number };
	plank?: { minHipAngle: number };
};

export type Validator = (result: PoseEstimateResult | null, ts: number, cfg?: ValidatorConfig) => ValidatorState | Promise<ValidatorState>; 