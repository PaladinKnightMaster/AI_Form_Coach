import { clamp } from '../math/poseMath';
import type { Validator, ValidatorState, ValidatorConfig } from './types';
import type { PoseEstimateResult } from '../pose/engine';
import { calculateFormIQ, calculateSideBalance } from './formIQ';
import { getExerciseAngle } from '../pose/normalize';

export function createSquatValidator(): Validator {
	const state: ValidatorState = { repCount: 0, phase: 'idle', cues: [], metrics: [] };
	let currentRepStart: number | null = null;
	let peakDepth = 0;
	let stable = 0;

	return (result: PoseEstimateResult | null, ts: number, cfg?: ValidatorConfig) => {
		state.cues = [];
		if (!result || !result.landmarks || result.landmarks.length < 29) return state;
		
		// Use the robust angle calculation from the pose engine
		const kneeAngle = getExerciseAngle(result, 'squat');
		if (kneeAngle === null) return state;
		
		const k = kneeAngle;
		const depth = clamp(180 - k, 0, 120);

		const downDepth = cfg?.squat?.downDepth ?? 35;
		const upDepth = cfg?.squat?.upDepth ?? 10;
		const debounce = cfg?.debounceFrames ?? 3;

		let desiredPhase: ValidatorState['phase'] = state.phase;
		if (state.phase === 'idle' || state.phase === 'up') {
			if (depth > downDepth) desiredPhase = 'down';
		} else if (state.phase === 'down') {
			peakDepth = Math.max(peakDepth, depth);
			if (depth < 20) desiredPhase = 'up';
		}

		if (desiredPhase !== state.phase) {
			stable += 1;
			if (stable >= debounce) {
				state.phase = desiredPhase;
				stable = 0;
				if (desiredPhase === 'down') {
					currentRepStart = currentRepStart ?? ts;
					state.cues.push('Hips back, chest up');
				}
				if (desiredPhase === 'up') {
					state.cues.push('Drive up through heels');
				}
			}
		} else {
			stable = 0;
		}

		if (state.phase === 'up' && depth < upDepth && currentRepStart !== null) {
			// Calculate side balance for this rep
			const sideBalanceData = calculateSideBalance(result.landmarks, 'squat');
			
			// Create rep metric with enhanced data
			const repMetric = { 
				startTs: currentRepStart, 
				endTs: ts, 
				peakDepth,
				sideBalance: sideBalanceData?.balanceScore
			};
			
			state.repCount += 1;
			state.metrics.push(repMetric);
			
			// Calculate Form IQ for all reps so far
			const formIQMetrics = calculateFormIQ(state.metrics, 'squat', sideBalanceData || undefined);
			
			// Update the latest rep with Form IQ
			if (state.metrics.length > 0) {
				state.metrics[state.metrics.length - 1].formIQ = formIQMetrics.formIQ;
			}
			
			currentRepStart = null;
			peakDepth = 0;
			state.phase = 'idle';
		}
		return state;
	};
} 