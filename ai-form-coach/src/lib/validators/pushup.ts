import { clamp } from '../math/poseMath';
import type { Validator, ValidatorState, ValidatorConfig } from './types';
import type { PoseEstimateResult } from '../pose/engine';
import { calculateFormIQ, calculateSideBalance } from './formIQ';
import { getExerciseAngle } from '../pose/normalize';

export function createPushupValidator(): Validator {
	const state: ValidatorState = { repCount: 0, phase: 'idle', cues: [], metrics: [] };
	let currentRepStart: number | null = null;
	let peakAngle = 180;
	let stable = 0;

	return (result: PoseEstimateResult | null, ts: number, cfg?: ValidatorConfig) => {
		state.cues = [];
		if (!result || !result.landmarks || result.landmarks.length < 17) return state;
		
		// Use the robust angle calculation from the pose engine
		const elbowAngle = getExerciseAngle(result, 'pushup');
		if (elbowAngle === null) return state;
		
		const e = elbowAngle;
		const bend = clamp(180 - e, 0, 160);

		const bottomElbow = cfg?.pushup?.bottomElbow ?? 70; // elbow angle at bottom
		const topElbow = cfg?.pushup?.topElbow ?? 155;
		const debounce = cfg?.debounceFrames ?? 3;

		let desired: ValidatorState['phase'] = state.phase;
		if (state.phase === 'idle' || state.phase === 'up') {
			if (e < bottomElbow) desired = 'down';
		} else if (state.phase === 'down') {
			peakAngle = Math.min(peakAngle, e);
			if (e > topElbow) desired = 'up';
		}

		if (desired !== state.phase) {
			stable += 1;
			if (stable >= debounce) {
				state.phase = desired;
				stable = 0;
				if (desired === 'down') {
					currentRepStart = currentRepStart ?? ts;
					state.cues.push('Keep core tight');
				}
				if (desired === 'up') {
					state.cues.push('Press up strong');
				}
			}
		} else {
			stable = 0;
		}

		if (state.phase === 'up' && bend < 10 && currentRepStart !== null) {
			// Calculate side balance for this rep
			const sideBalanceData = calculateSideBalance(result.landmarks, 'pushup');
			
			// Create rep metric with enhanced data
			const repMetric = { 
				startTs: currentRepStart, 
				endTs: ts, 
				peakAngle,
				sideBalance: sideBalanceData?.balanceScore
			};
			
			state.repCount += 1;
			state.metrics.push(repMetric);
			
			// Calculate Form IQ for all reps so far
			const formIQMetrics = calculateFormIQ(state.metrics, 'pushup', sideBalanceData || undefined);
			
			// Update the latest rep with Form IQ
			if (state.metrics.length > 0) {
				state.metrics[state.metrics.length - 1].formIQ = formIQMetrics.formIQ;
			}
			
			currentRepStart = null;
			peakAngle = 180;
			state.phase = 'idle';
		}
		return state;
	};
} 