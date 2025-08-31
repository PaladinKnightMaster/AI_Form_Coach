import { describe, it, expect } from 'vitest';
import { angleBetween, exponentialMovingAverage } from './poseMath';

describe('poseMath', () => {
	it('angleBetween returns ~180 for straight line', () => {
		const angle = angleBetween({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 });
		expect(Math.abs(angle - 180)).toBeLessThan(1e-6);
	});
	it('ema smooths toward next value', () => {
		expect(exponentialMovingAverage(0, 10, 0.5)).toBe(5);
	});
}); 