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

/**
 * Create a PoseEstimateResult with geometrically valid landmark positions.
 *
 * kneeAngle = angleBetween(hip, knee, ankle) — the angle at the knee vertex.
 * For a straight leg (standing), hip and ankle must be on opposite sides of the
 * knee in y-space → angle ≈ 180°.  For a deep squat, the hip drops down and
 * the knee pushes forward → angle ≈ 80-100°.
 *
 * Positions below are in MediaPipe normalized coords (y increases downward).
 */
function makePoseResult(pose: 'standing' | 'deep' = 'standing'): PoseEstimateResult {
	const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }));

	// Shoulder landmarks (for torso angle)
	landmarks[11] = { x: 0.48, y: 0.25, z: 0, visibility: 0.9 }; // Left shoulder
	landmarks[12] = { x: 0.52, y: 0.25, z: 0, visibility: 0.9 }; // Right shoulder

	if (pose === 'standing') {
		// Straight leg: hip above knee above ankle on a vertical line → ~180°
		landmarks[23] = { x: 0.48, y: 0.45, z: 0, visibility: 0.9 }; // Left hip
		landmarks[24] = { x: 0.52, y: 0.45, z: 0, visibility: 0.9 }; // Right hip
		landmarks[25] = { x: 0.48, y: 0.65, z: 0, visibility: 0.9 }; // Left knee
		landmarks[26] = { x: 0.52, y: 0.65, z: 0, visibility: 0.9 }; // Right knee
		landmarks[27] = { x: 0.48, y: 0.85, z: 0, visibility: 0.9 }; // Left ankle
		landmarks[28] = { x: 0.52, y: 0.85, z: 0, visibility: 0.9 }; // Right ankle
	} else {
		// Deep squat: hip drops, knee pushes forward → ~85° knee angle
		landmarks[23] = { x: 0.43, y: 0.60, z: 0, visibility: 0.9 }; // Left hip
		landmarks[24] = { x: 0.47, y: 0.60, z: 0, visibility: 0.9 }; // Right hip
		landmarks[25] = { x: 0.58, y: 0.68, z: 0, visibility: 0.9 }; // Left knee
		landmarks[26] = { x: 0.62, y: 0.68, z: 0, visibility: 0.9 }; // Right knee
		landmarks[27] = { x: 0.48, y: 0.85, z: 0, visibility: 0.9 }; // Left ankle
		landmarks[28] = { x: 0.52, y: 0.85, z: 0, visibility: 0.9 }; // Right ankle
	}

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
	it('processes frames and returns valid state shape', async () => {
		const v = createSquatValidator();
		let ts = 0;

		// Standing position — straight leg geometry
		for (let i = 0; i < 5; i++) {
			await v(makePoseResult('standing'), ts += 33);
		}

		// Deep squat — bent knee geometry (~85°)
		for (let i = 0; i < 8; i++) {
			await v(makePoseResult('deep'), ts += 33);
		}

		// Return to standing
		for (let i = 0; i < 5; i++) {
			const state = await v(makePoseResult('standing'), ts += 33);

			// Verify the validator returns a valid state shape throughout
			expect(state).toBeDefined();
			expect(state.repCount).toBeGreaterThanOrEqual(0);
			expect(['idle', 'up', 'down']).toContain(state.phase);
		}
	});
});
