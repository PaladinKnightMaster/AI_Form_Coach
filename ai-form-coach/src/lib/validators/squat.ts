import { clamp } from '../math/poseMath';
import type { Validator, ValidatorState, ValidatorConfig, RepMetric } from './types';
import type { PoseEstimateResult } from '../pose/engine';
import { calculateFormIQ, calculateSideBalance } from './formIQ';
import { getExerciseAngle } from '../pose/normalize';
import { getExerciseConfig } from '@/lib/calibration/constants';
import { getUserCalibration } from '@/lib/calibration/service';
import type { DeviceCalibration } from '@/types/calibration';
import { 
	calculateKneeValgus, 
	calculateTorsoAngle, 
	calculateTempo, 
	calculateRepQuality, 
	createFormError, 
	checkErrorDuration
} from './formAnalysis';

export function createSquatValidator(): Validator {
	const state: ValidatorState = { 
		repCount: 0, 
		phase: 'idle', 
		cues: [], 
		metrics: [],
		currentRep: undefined
	};
	
	let userCalibration: DeviceCalibration | null = null;
	let stable = 0;
	
	// Error tracking state
	let errorStates = {
		depthLow: { startTime: null as number | null, threshold: 0 },
		kneeValgus: { startTime: null as number | null, threshold: 0 },
		chestDrop: { startTime: null as number | null, threshold: 0 }
	};

	return async (result: PoseEstimateResult | null, ts: number, cfg?: ValidatorConfig) => {
		state.cues = [];
		if (!result || !result.landmarks || result.landmarks.length < 29) return state;
		
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
		const kneeAngle = getExerciseAngle(result, 'squat');
		if (kneeAngle === null) return state;
		
		const k = kneeAngle;
		const depth = clamp(180 - k, 0, 120);
		
		// Get best side landmarks for analysis
		const bestSide = cfg?.bestSide || 'right';
		
		// Calculate advanced metrics
		const valgusData = calculateKneeValgus(result.landmarks);
		const torsoAngle = calculateTorsoAngle(result.landmarks, bestSide);
		
		// Use calibrated thresholds
		const calibratedDepth = 180 - config.squat.idealDepthAngle;
		const minDepthThreshold = calibratedDepth * 0.9; // 90% of calibrated depth
		const repDepthThreshold = calibratedDepth - 5; // 5° tolerance for rep counting
		const upDepth = cfg?.squat?.upDepth ?? 10;
		const debounce = cfg?.debounceFrames ?? 3;
		
		// Error detection thresholds
		const valgusThreshold = cfg?.errorThresholds?.valgusTolerance ?? 6; // 6% of hip width
		const chestDropThreshold = 150; // degrees
		const valgusDurationThreshold = cfg?.errorThresholds?.errorDurationThresholds?.valgus ?? 150; // ms
		const chestDropDurationThreshold = cfg?.errorThresholds?.errorDurationThresholds?.chestDrop ?? 100; // ms

		// Phase detection with enhanced logic
		let desiredPhase: ValidatorState['phase'] = state.phase;
		if (state.phase === 'idle' || state.phase === 'up') {
			if (depth > repDepthThreshold) desiredPhase = 'down';
		} else if (state.phase === 'down') {
			if (depth < upDepth) desiredPhase = 'up';
		}

		// Phase transition with debouncing
		if (desiredPhase !== state.phase) {
			stable += 1;
			if (stable >= debounce) {
				state.phase = desiredPhase;
				stable = 0;
				
				// Initialize current rep tracking
				if (desiredPhase === 'down' && !state.currentRep) {
					state.currentRep = {
						startTs: ts,
						phaseHistory: [{ phase: 'down', timestamp: ts }],
						errorHistory: [],
						measurements: {
							angles: [k],
							depths: [depth],
							bodyLines: [torsoAngle]
						}
					};
					state.cues.push('Hips back, chest up');
				}
				
				// Update phase history
				if (state.currentRep) {
					state.currentRep.phaseHistory.push({ phase: desiredPhase, timestamp: ts });
				}
				
				if (desiredPhase === 'up') {
					state.cues.push('Drive up through heels');
				}
			}
		} else {
			stable = 0;
		}
		
		// Update current rep measurements
		if (state.currentRep) {
			state.currentRep.measurements.angles.push(k);
			state.currentRep.measurements.depths.push(depth);
			state.currentRep.measurements.bodyLines.push(torsoAngle);
		}

		// Error detection during down phase
		if (state.phase === 'down') {
			// Depth check
			if (depth < minDepthThreshold) {
				if (!errorStates.depthLow.startTime) {
					errorStates.depthLow.startTime = ts;
					errorStates.depthLow.threshold = minDepthThreshold;
				}
			} else {
				if (errorStates.depthLow.startTime) {
					const errorDuration = ts - errorStates.depthLow.startTime;
					if (errorDuration >= 100) { // Minimum 100ms to register error
						const error = createFormError(
							'depth_low',
							'high',
							errorDuration,
							`Not deep enough - need ${Math.round(minDepthThreshold)}° (got ${Math.round(depth)}°)`,
							ts,
							depth,
							minDepthThreshold
						);
						state.currentRep?.errorHistory.push(error);
						state.cues.push('Go deeper!');
					}
					errorStates.depthLow.startTime = null;
				}
			}
			
			// Knee valgus check
			if (valgusData.valgus > valgusThreshold) {
				if (!errorStates.kneeValgus.startTime) {
					errorStates.kneeValgus.startTime = ts;
					errorStates.kneeValgus.threshold = valgusThreshold;
				} else if (checkErrorDuration(errorStates.kneeValgus.startTime, ts, valgusDurationThreshold)) {
					const error = createFormError(
						'knee_valgus',
						'medium',
						ts - errorStates.kneeValgus.startTime,
						`Knee collapse detected - keep knees over toes`,
						ts,
						valgusData.valgus,
						valgusThreshold
					);
					state.currentRep?.errorHistory.push(error);
					state.cues.push('Knees out!');
					errorStates.kneeValgus.startTime = null; // Reset to avoid duplicate errors
				}
			} else {
				errorStates.kneeValgus.startTime = null;
			}
			
			// Chest drop check
			if (torsoAngle < chestDropThreshold) {
				if (!errorStates.chestDrop.startTime) {
					errorStates.chestDrop.startTime = ts;
					errorStates.chestDrop.threshold = chestDropThreshold;
				} else if (checkErrorDuration(errorStates.chestDrop.startTime, ts, chestDropDurationThreshold)) {
					const error = createFormError(
						'chest_drop',
						'medium',
						ts - errorStates.chestDrop.startTime,
						`Chest dropping - keep chest up`,
						ts,
						torsoAngle,
						chestDropThreshold
					);
					state.currentRep?.errorHistory.push(error);
					state.cues.push('Chest up!');
					errorStates.chestDrop.startTime = null; // Reset to avoid duplicate errors
				}
			} else {
				errorStates.chestDrop.startTime = null;
			}
		}

		// Complete rep when returning to idle
		if (state.phase === 'up' && depth < upDepth && state.currentRep) {
			const repDuration = ts - state.currentRep.startTs;
			const tempo = calculateTempo(repDuration);
			
			// Check for tempo errors
			if (tempo === 'fast') {
				const error = createFormError(
					'tempo_fast',
					'low',
					repDuration,
					'Too fast - slow down for better control',
					ts,
					repDuration,
					600
				);
				state.currentRep.errorHistory.push(error);
			} else if (tempo === 'slow') {
				const error = createFormError(
					'tempo_slow',
					'low',
					repDuration,
					'Too slow - try to maintain steady rhythm',
					ts,
					repDuration,
					2500
				);
				state.currentRep.errorHistory.push(error);
			}
			
			// Calculate rep metrics
			const peakDepth = Math.max(...state.currentRep.measurements.depths);
			const avgTorsoAngle = state.currentRep.measurements.bodyLines.reduce((a, b) => a + b, 0) / state.currentRep.measurements.bodyLines.length;
			const avgValgus = valgusData.valgus; // Use current valgus as approximation
			
			// Calculate side balance for this rep
			const sideBalanceData = calculateSideBalance(result.landmarks, 'squat');
			
			// Calculate rep quality
			const { score, quality } = calculateRepQuality(
				state.currentRep.errorHistory,
				repDuration,
				'squat',
				{
					depth: peakDepth,
					torsoAngle: avgTorsoAngle,
					kneeValgus: avgValgus
				}
			);
			
			// Create enhanced rep metric
			const repMetric: RepMetric = { 
				startTs: state.currentRep.startTs, 
				endTs: ts,
				duration: repDuration,
				tempo,
				errors: [...state.currentRep.errorHistory],
				quality,
				score,
				peakDepth,
				sideBalance: sideBalanceData?.balanceScore,
				squat: {
					depth: peakDepth,
					torsoAngle: avgTorsoAngle,
					kneeValgus: avgValgus
				}
			};
			
			state.repCount += 1;
			state.metrics.push(repMetric);
			
			// Calculate Form IQ for all reps so far
			const formIQMetrics = calculateFormIQ(state.metrics, 'squat', sideBalanceData || undefined);
			
			// Update the latest rep with Form IQ
			if (state.metrics.length > 0) {
				state.metrics[state.metrics.length - 1].formIQ = formIQMetrics.formIQ;
			}
			
			// Reset for next rep
			state.currentRep = undefined;
			state.phase = 'idle';
			
			// Reset error states
			errorStates = {
				depthLow: { startTime: null, threshold: 0 },
				kneeValgus: { startTime: null, threshold: 0 },
				chestDrop: { startTime: null, threshold: 0 }
			};
		}
		
		return state;
	};
} 