import { angleBetween, clamp } from '../math/poseMath';
import type { Validator, ValidatorState } from './types';
import type { SmoothedLandmark } from '../pose';

const LEFT_HIP = 23, LEFT_KNEE = 25, LEFT_ANKLE = 27;
const RIGHT_HIP = 24, RIGHT_KNEE = 26, RIGHT_ANKLE = 28;

export function createSquatValidator(): Validator {
	const state: ValidatorState = { repCount: 0, phase: 'idle', cues: [], metrics: [] };
	let currentRepStart: number | null = null;
	let peakDepth = 0;

	return (lm: SmoothedLandmark[] | null, ts: number) => {
		state.cues = [];
		if (!lm) return state;
		const lk = angleBetween(lm[LEFT_HIP], lm[LEFT_KNEE], lm[LEFT_ANKLE]);
		const rk = angleBetween(lm[RIGHT_HIP], lm[RIGHT_KNEE], lm[RIGHT_ANKLE]);
		const kneeAngle = (lk + rk) / 2;
		const depth = clamp(180 - kneeAngle, 0, 120);

		switch (state.phase) {
			case 'idle':
			case 'up':
				if (depth > 35) {
					state.phase = 'down';
					currentRepStart = currentRepStart ?? ts;
					state.cues.push('Hips back, chest up');
				}
				break;
			case 'down':
				peakDepth = Math.max(peakDepth, depth);
				if (depth < 20) {
					state.phase = 'up';
					state.cues.push('Drive up through heels');
				}
				break;
		}

		if (state.phase === 'up' && depth < 10 && currentRepStart !== null) {
			state.repCount += 1;
			state.metrics.push({ startTs: currentRepStart, endTs: ts, peakDepth });
			currentRepStart = null;
			peakDepth = 0;
			state.phase = 'idle';
		}
		return state;
	};
} 