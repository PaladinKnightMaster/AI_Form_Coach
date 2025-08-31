import { angleBetween } from '../math/poseMath';
import type { Validator, ValidatorState } from './types';
import type { SmoothedLandmark } from '../pose';

const LEFT_SHOULDER = 11, LEFT_HIP = 23, LEFT_KNEE = 25;
const RIGHT_SHOULDER = 12, RIGHT_HIP = 24, RIGHT_KNEE = 26;

export function createPlankValidator(): Validator {
	const state: ValidatorState = { repCount: 0, phase: 'idle', cues: [], metrics: [] };
	let holdStart: number | null = null;

	return (lm: SmoothedLandmark[] | null, ts: number) => {
		state.cues = [];
		if (!lm) return state;
		const lh = angleBetween(lm[LEFT_SHOULDER], lm[LEFT_HIP], lm[LEFT_KNEE]);
		const rh = angleBetween(lm[RIGHT_SHOULDER], lm[RIGHT_HIP], lm[RIGHT_KNEE]);
		const hipAngle = (lh + rh) / 2;

		if (Math.abs(hipAngle - 180) < 20) {
			if (state.phase !== 'hold') {
				state.phase = 'hold';
				holdStart = ts;
				state.cues.push('Maintain straight line');
			}
		} else {
			if (state.phase === 'hold' && holdStart) {
				state.repCount += 1;
				state.metrics.push({ startTs: holdStart, endTs: ts, peakAngle: hipAngle });
				holdStart = null;
			}
			state.phase = 'idle';
			state.cues.push('Hips down, squeeze glutes');
		}
		return state;
	};
} 