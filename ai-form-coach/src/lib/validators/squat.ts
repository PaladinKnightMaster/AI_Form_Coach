import { angleBetween, clamp } from '../math/poseMath';
import type { Validator, ValidatorState, ValidatorConfig } from './types';
import type { SmoothedLandmark } from '../pose';

const L = { HIP: 23, KNEE: 25, ANKLE: 27 } as const;
const R = { HIP: 24, KNEE: 26, ANKLE: 28 } as const;

export function createSquatValidator(): Validator {
	const state: ValidatorState = { repCount: 0, phase: 'idle', cues: [], metrics: [] };
	let currentRepStart: number | null = null;
	let peakDepth = 0;
	let stable = 0;

	return (lm: SmoothedLandmark[] | null, ts: number, cfg?: ValidatorConfig) => {
		state.cues = [];
		if (!lm) return state;
		// Pick side with higher visibility
		const lv = (lm[L.KNEE]?.visibility ?? 0) + (lm[L.HIP]?.visibility ?? 0) + (lm[L.ANKLE]?.visibility ?? 0);
		const rv = (lm[R.KNEE]?.visibility ?? 0) + (lm[R.HIP]?.visibility ?? 0) + (lm[R.ANKLE]?.visibility ?? 0);
		const side = rv > lv ? R : L;
		const k = angleBetween(lm[side.HIP], lm[side.KNEE], lm[side.ANKLE]);
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
			state.repCount += 1;
			state.metrics.push({ startTs: currentRepStart, endTs: ts, peakDepth });
			currentRepStart = null;
			peakDepth = 0;
			state.phase = 'idle';
		}
		return state;
	};
} 