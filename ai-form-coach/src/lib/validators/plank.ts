import { angleBetween } from '../math/poseMath';
import type { Validator, ValidatorState, ValidatorConfig } from './types';
import type { SmoothedLandmark } from '../pose';

const LEFT_SHOULDER = 11, LEFT_HIP = 23, LEFT_KNEE = 25;
const RIGHT_SHOULDER = 12, RIGHT_HIP = 24, RIGHT_KNEE = 26;

export function createPlankValidator(): Validator {
	const state: ValidatorState = { repCount: 0, phase: 'idle', cues: [], metrics: [] };
	let holdStart: number | null = null;
	let stable = 0;

	return (lm: SmoothedLandmark[] | null, ts: number, cfg?: ValidatorConfig) => {
		state.cues = [];
		if (!lm) return state;
		const lh = angleBetween(lm[LEFT_SHOULDER], lm[LEFT_HIP], lm[LEFT_KNEE]);
		const rh = angleBetween(lm[RIGHT_SHOULDER], lm[RIGHT_HIP], lm[RIGHT_KNEE]);
		const hipAngle = (lh + rh) / 2;

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