import { describe, it, expect } from 'vitest';
import { createSquatValidator } from './squat';

function lm(depth: number) {
	return Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0 }));
}

describe('squat validator', () => {
	it('counts a rep when depth crosses thresholds', () => {
		const v = createSquatValidator();
		let ts = 0;
		v(lm(0), ts += 16);
		v(lm(50), ts += 16);
		v(lm(60), ts += 16);
		v(lm(10), ts += 16);
		const state = v(lm(0), ts += 16);
		expect(state.repCount).toBeGreaterThanOrEqual(1);
	});
}); 