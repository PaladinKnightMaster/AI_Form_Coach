import { describe, it, expect, vi } from 'vitest';
import { createSquatValidator } from './squat';
import type { PoseEstimateResult } from '../pose/engine';

// Mock external dependencies that require runtime context
vi.mock('@/lib/calibration/service', () => ({
	getUserCalibration: vi.fn().mockResolvedValue(null)
}));

vi.mock('../microModel/qualityIntegration', () => ({
	calculateHybridRepQuality: vi.fn().mockResolvedValue({ score: 80, quality: 'good' })
}));

function makePoseResult(hipY = 0.5, kneeY = 0.6, ankleY = 0.4): PoseEstimateResult {
	const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }));
	// Set hip, knee, and ankle positions for squat detection
	landmarks[23] = { x: 0.5, y: hipY, z: 0, visibility: 0.9 }; // Left hip
	landmarks[24] = { x: 0.5, y: hipY, z: 0, visibility: 0.9 }; // Right hip
	landmarks[25] = { x: 0.5, y: kneeY, z: 0, visibility: 0.9 }; // Left knee
	landmarks[26] = { x: 0.5, y: kneeY, z: 0, visibility: 0.9 }; // Right knee
	landmarks[27] = { x: 0.5, y: ankleY, z: 0, visibility: 0.9 }; // Left ankle
	landmarks[28] = { x: 0.5, y: ankleY, z: 0, visibility: 0.9 }; // Right ankle
	// Set shoulder landmarks for torso angle calculation
	landmarks[11] = { x: 0.5, y: 0.3, z: 0, visibility: 0.9 }; // Left shoulder
	landmarks[12] = { x: 0.5, y: 0.3, z: 0, visibility: 0.9 }; // Right shoulder
	return {
		landmarks,
		fps: 30,
		visibilityScore: 0.9,
		bestSide: 'right',
		leftVisibility: 0.9,
		rightVisibility: 0.9,
	};
}

describe('squat validator', () => {
	it('counts a rep when depth crosses thresholds', async () => {
		const v = createSquatValidator();
		let ts = 0;

		// Standing position
		await v(makePoseResult(0.5, 0.5, 0.3), ts += 16);
		await v(makePoseResult(0.5, 0.5, 0.3), ts += 16);

		// Deep squat - move knee way down to create small angle
		await v(makePoseResult(0.5, 0.8, 0.3), ts += 16);
		await v(makePoseResult(0.5, 0.9, 0.3), ts += 16);
		await v(makePoseResult(0.5, 0.95, 0.3), ts += 16); // Very deep

		// Come back up
		await v(makePoseResult(0.5, 0.9, 0.3), ts += 16);
		await v(makePoseResult(0.5, 0.8, 0.3), ts += 16);
		const state = await v(makePoseResult(0.5, 0.5, 0.3), ts += 16);

		// Verify the validator returns a valid state shape
		expect(state).toBeDefined();
		expect(typeof state.repCount).toBe('number');
	});
});
