import { angleBetween, clamp } from '../math/poseMath';
import type { Validator, ValidatorState } from './types';
import type { SmoothedLandmark } from '../pose';

const LEFT_SHOULDER = 11, LEFT_ELBOW = 13, LEFT_WRIST = 15;
const RIGHT_SHOULDER = 12, RIGHT_ELBOW = 14, RIGHT_WRIST = 16;

export function createPushupValidator(): Validator {
	const state: ValidatorState = { repCount: 0, phase: 'idle', cues: [], metrics: [] };
	let currentRepStart: number | null = null;
	let peakAngle = 180;

	return (lm: SmoothedLandmark[] | null, ts: number) => {
		state.cues = [];
		if (!lm) return state;
		const le = angleBetween(lm[LEFT_SHOULDER], lm[LEFT_ELBOW], lm[LEFT_WRIST]);
		const re = angleBetween(lm[RIGHT_SHOULDER], lm[RIGHT_ELBOW], lm[RIGHT_WRIST]);
		const elbowAngle = (le + re) / 2;
		const bend = clamp(180 - elbowAngle, 0, 160);

		switch (state.phase) {
			case 'idle':
			case 'up':
				if (bend > 40) {
					state.phase = 'down';
					currentRepStart = currentRepStart ?? ts;
					state.cues.push('Keep core tight');
				}
				break;
			case 'down':
				peakAngle = Math.min(peakAngle, elbowAngle);
				if (bend < 15) {
					state.phase = 'up';
					state.cues.push('Press up strong');
				}
				break;
		}

		if (state.phase === 'up' && bend < 10 && currentRepStart !== null) {
			state.repCount += 1;
			state.metrics.push({ startTs: currentRepStart, endTs: ts, peakAngle });
			currentRepStart = null;
			peakAngle = 180;
			state.phase = 'idle';
		}
		return state;
	};
} 