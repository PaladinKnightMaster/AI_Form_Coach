import { angleBetween, clamp } from '../math/poseMath';
import type { Validator, ValidatorState, ValidatorConfig } from './types';
import type { SmoothedLandmark } from '../pose';

const L = { SHOULDER: 11, ELBOW: 13, WRIST: 15 } as const;
const R = { SHOULDER: 12, ELBOW: 14, WRIST: 16 } as const;

export function createPushupValidator(): Validator {
	const state: ValidatorState = { repCount: 0, phase: 'idle', cues: [], metrics: [] };
	let currentRepStart: number | null = null;
	let peakAngle = 180;
	let stable = 0;

	return (lm: SmoothedLandmark[] | null, ts: number, cfg?: ValidatorConfig) => {
		state.cues = [];
		if (!lm) return state;
		const lv = (lm[L.SHOULDER]?.visibility ?? 0) + (lm[L.ELBOW]?.visibility ?? 0) + (lm[L.WRIST]?.visibility ?? 0);
		const rv = (lm[R.SHOULDER]?.visibility ?? 0) + (lm[R.ELBOW]?.visibility ?? 0) + (lm[R.WRIST]?.visibility ?? 0);
		const side = rv > lv ? R : L;
		const e = angleBetween(lm[side.SHOULDER], lm[side.ELBOW], lm[side.WRIST]);
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
			state.repCount += 1;
			state.metrics.push({ startTs: currentRepStart, endTs: ts, peakAngle });
			currentRepStart = null;
			peakAngle = 180;
			state.phase = 'idle';
		}
		return state;
	};
} 