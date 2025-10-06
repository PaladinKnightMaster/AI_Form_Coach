import type { Validator, ValidatorState, ValidatorConfig } from './types';
import type { PoseEstimateResult } from '../pose/engine';
import { getExerciseAngle } from '../pose/normalize';

export function createPlankValidator(): Validator {
	const state: ValidatorState = { repCount: 0, phase: 'idle', cues: [], metrics: [] };
	let holdStart: number | null = null;
	let stable = 0;

	return (result: PoseEstimateResult | null, ts: number, cfg?: ValidatorConfig) => {
		state.cues = [];
		if (!result || !result.landmarks || result.landmarks.length < 27) return state;
		
		// Use the robust angle calculation from the pose engine
		const torsoAngle = getExerciseAngle(result, 'plank');
		if (torsoAngle === null) return state;
		
		const hipAngle = torsoAngle; // For plank, torso angle represents hip alignment

		const minHipAngle = cfg?.plank?.minHipAngle ?? 170;
		const debounce = cfg?.debounceFrames ?? 3;

		const desired: ValidatorState['phase'] = Math.abs(hipAngle - 180) < (180 - minHipAngle) ? 'hold' : 'idle';
		if (desired !== state.phase) {
			stable += 1;
			if (stable >= debounce) {
				if (desired === 'hold') {
					state.phase = 'hold';
					holdStart = ts;
					state.cues.push('Maintain straight line');
				} else {
					if (state.phase === 'hold' && holdStart) {
						state.repCount += 1;
						state.metrics.push({ startTs: holdStart, endTs: ts, peakAngle: hipAngle });
						holdStart = null;
					}
					state.phase = 'idle';
					state.cues.push('Hips down, squeeze glutes');
				}
				stable = 0;
			}
		} else {
			stable = 0;
		}
		return state;
	};
} 