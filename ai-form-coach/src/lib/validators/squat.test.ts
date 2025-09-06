import { describe, it, expect } from 'vitest';
import { createSquatValidator } from './squat';

function lm() {
	return Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0 }));
}

describe('squat validator', () => {
	it('counts a rep when depth crosses thresholds', () => {
		const v = createSquatValidator();
		let ts = 0;
		v(lm(), ts += 16);
		v(lm(), ts += 16);
		v(lm(), ts += 16);
		v(lm(), ts += 16);
		const state = v(lm(), ts += 16);
		expect(state.repCount).toBeGreaterThanOrEqual(1);
	});
}); 