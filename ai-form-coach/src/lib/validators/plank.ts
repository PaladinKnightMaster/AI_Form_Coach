import type { Validator, ValidatorState, ValidatorConfig } from './types';
import type { PoseEstimateResult } from '../pose/engine';
import { getExerciseAngle } from '../pose/normalize';
import { getExerciseConfig } from '@/lib/calibration/constants';
import { getUserCalibration } from '@/lib/calibration/service';
import type { DeviceCalibration } from '@/types/calibration';

export function createPlankValidator(): Validator {
	const state: ValidatorState = { repCount: 0, phase: 'idle', cues: [], metrics: [] };
	let holdStart: number | null = null;
	let stable = 0;
	let userCalibration: DeviceCalibration | null = null;

	return async (result: PoseEstimateResult | null, ts: number, cfg?: ValidatorConfig) => {
		state.cues = [];
		if (!result || !result.landmarks || result.landmarks.length < 27) return state;
		
		// Load user calibration if not already loaded
		if (!userCalibration) {
			userCalibration = await getUserCalibration();
		}
		
		// Get personalized configuration
		const config = getExerciseConfig(userCalibration ? {
			squat_full_depth_angle: userCalibration.squat_full_depth_angle,
			pushup_elbow_bottom_angle: userCalibration.pushup_elbow_bottom_angle,
			bodyline_target: userCalibration.bodyline_target,
		} : undefined);
		
		// Use the robust angle calculation from the pose engine
		const torsoAngle = getExerciseAngle(result, 'plank');
		if (torsoAngle === null) return state;
		
		const hipAngle = torsoAngle; // For plank, torso angle represents hip alignment

		// Use calibrated thresholds or fallback to config/defaults
		const minHipAngle = cfg?.plank?.minHipAngle ?? config.plank.minHipAngle;
		const debounce = cfg?.debounceFrames ?? 3;

		const desired: ValidatorState['phase'] = Math.abs(hipAngle - 180) < (180 - minHipAngle) ? 'hold' : 'idle';
		if (desired !== state.phase) {
			stable += 1;
			if (stable >= debounce) {
				if (desired === 'hold') {
					state.phase = 'hold';
					holdStart = ts;
					state.cues.push('Maintain straight line');
				} else {
					if (state.phase === 'hold' && holdStart) {
						state.repCount += 1;
						state.metrics.push({ startTs: holdStart, endTs: ts, peakAngle: hipAngle });
						holdStart = null;
					}
					state.phase = 'idle';
					state.cues.push('Hips down, squeeze glutes');
				}
				stable = 0;
			}
		} else {
			stable = 0;
		}
		return state;
	};
} 