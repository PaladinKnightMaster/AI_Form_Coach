import { clamp } from '../math/poseMath';
import type { Validator, ValidatorState, ValidatorConfig, RepMetric } from './types';
import type { PoseEstimateResult } from '../pose/engine';
import { calculateFormIQ, calculateSideBalance } from './formIQ';
import { getExerciseAngle } from '../pose/normalize';
import { getExerciseConfig } from '@/lib/calibration/constants';
import { getUserCalibration } from '@/lib/calibration/service';
import type { DeviceCalibration } from '@/types/calibration';
import { 
	calculateBodyLine, 
	calculateTempo, 
	calculateRepQuality, 
	createFormError, 
	checkErrorDuration
} from './formAnalysis';

export function createPushupValidator(): Validator {
	const state: ValidatorState = { 
		repCount: 0, 
		phase: 'idle', 
		cues: [], 
		metrics: [],
		currentRep: undefined,
		lastCueTime: 0
	};
	
	let userCalibration: DeviceCalibration | null = null;
	let stable = 0;
	
	// Error tracking state
	let errorStates = {
		hipSag: { startTime: null as number | null, threshold: 0 },
		bodyLinePoor: { startTime: null as number | null, threshold: 0 }
	};

	return async (result: PoseEstimateResult | null, ts: number, cfg?: ValidatorConfig) => {
		state.cues = [];
		if (!result || !result.landmarks || result.landmarks.length < 17) return state;
		
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
		const elbowAngle = getExerciseAngle(result, 'pushup');
		if (elbowAngle === null) return state;
		
		const e = elbowAngle;
		const bend = clamp(180 - e, 0, 160);
		
		// Get best side landmarks for analysis
		const bestSide = cfg?.bestSide || 'right';
		
		// Calculate body line angle
		const bodyLineAngle = calculateBodyLine(result.landmarks, bestSide);
		
		// Use calibrated thresholds
		const calibratedBottom = config.pushup.idealElbowAngle;
		const bottomElbow = calibratedBottom + 5; // 5° tolerance for true bottom
		const topElbow = cfg?.pushup?.topElbow ?? 155;
		const debounce = cfg?.debounceFrames ?? 3;
		
		// Body line thresholds
		const bodyLineThreshold = cfg?.pushup?.bodyLineThreshold ?? 165; // degrees
		const hipSagThreshold = cfg?.errorThresholds?.errorDurationThresholds?.hipSag ?? 200; // ms

		// Phase detection with enhanced logic
		let desired: ValidatorState['phase'] = state.phase;
		if (state.phase === 'idle' || state.phase === 'up') {
			if (e < bottomElbow) desired = 'down';
		} else if (state.phase === 'down') {
			if (e > topElbow) desired = 'up';
		}

		// Phase transition with debouncing
		if (desired !== state.phase) {
			stable += 1;
			if (stable >= debounce) {
				state.phase = desired;
				stable = 0;
				
				// Initialize current rep tracking
				if (desired === 'down' && !state.currentRep) {
					state.currentRep = {
						startTs: ts,
						phaseHistory: [{ phase: 'down', timestamp: ts }],
						errorHistory: [],
						measurements: {
							angles: [e],
							depths: [bend],
							bodyLines: [bodyLineAngle]
						}
					};
					state.cues.push('Keep core tight');
				}
				
				// Update phase history
				if (state.currentRep) {
					state.currentRep.phaseHistory.push({ phase: desired, timestamp: ts });
				}
				
				if (desired === 'up') {
					state.cues.push('Press up strong');
				}
			}
		} else {
			stable = 0;
		}
		
		// Update current rep measurements
		if (state.currentRep) {
			state.currentRep.measurements.angles.push(e);
			state.currentRep.measurements.depths.push(bend);
			state.currentRep.measurements.bodyLines.push(bodyLineAngle);
		}

		// Error detection during rep
		if (state.currentRep) {
			// Body line check (hip sag)
			if (bodyLineAngle < bodyLineThreshold) {
				if (!errorStates.hipSag.startTime) {
					errorStates.hipSag.startTime = ts;
					errorStates.hipSag.threshold = bodyLineThreshold;
				} else if (checkErrorDuration(errorStates.hipSag.startTime, ts, hipSagThreshold)) {
					const error = createFormError(
						'hip_sag',
						'medium',
						ts - errorStates.hipSag.startTime,
						`Hip sagging - maintain straight body line`,
						ts,
						bodyLineAngle,
						bodyLineThreshold
					);
					state.currentRep.errorHistory.push(error);
					state.cues.push('Straight line!');
					errorStates.hipSag.startTime = null; // Reset to avoid duplicate errors
				}
			} else {
				errorStates.hipSag.startTime = null;
			}
			
			// Poor body line percentage check
			const goodBodyLineCount = state.currentRep.measurements.bodyLines.filter(angle => angle >= bodyLineThreshold).length;
			const totalMeasurements = state.currentRep.measurements.bodyLines.length;
			const bodyLinePercentage = totalMeasurements > 0 ? (goodBodyLineCount / totalMeasurements) * 100 : 100;
			const requiredBodyLinePercentage = cfg?.pushup?.bodyLinePercentage ?? 80;
			
			if (bodyLinePercentage < requiredBodyLinePercentage) {
				if (!errorStates.bodyLinePoor.startTime) {
					errorStates.bodyLinePoor.startTime = ts;
					errorStates.bodyLinePoor.threshold = requiredBodyLinePercentage;
				}
			} else {
				errorStates.bodyLinePoor.startTime = null;
			}
		}

		// Complete rep when returning to idle
		if (state.phase === 'up' && bend < 10 && state.currentRep) {
			const repDuration = ts - state.currentRep.startTs;
			const tempo = calculateTempo(repDuration);
			
			// P3: Enforce strict tempo windows (0.6-2.5s)
			if (tempo === 'fast') {
				const error = createFormError(
					'tempo_fast',
					'high', // P3: Make tempo errors high severity
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
					'high', // P3: Make tempo errors high severity
					repDuration,
					'Too slow - try to maintain steady rhythm',
					ts,
					repDuration,
					2500
				);
				state.currentRep.errorHistory.push(error);
			}
			
			// Calculate rep metrics
			const peakElbowAngle = Math.min(...state.currentRep.measurements.angles);
			const avgBodyLine = state.currentRep.measurements.bodyLines.reduce((a, b) => a + b, 0) / state.currentRep.measurements.bodyLines.length;
			const goodBodyLineCount = state.currentRep.measurements.bodyLines.filter(angle => angle >= bodyLineThreshold).length;
			const bodyLinePercentage = (goodBodyLineCount / state.currentRep.measurements.bodyLines.length) * 100;
			
			// Add body line percentage error if below threshold
			const requiredBodyLinePercentage = cfg?.pushup?.bodyLinePercentage ?? 80;
			if (bodyLinePercentage < requiredBodyLinePercentage) {
				const error = createFormError(
					'bodyline_poor',
					'high',
					repDuration,
					`Poor body line - only ${Math.round(bodyLinePercentage)}% of rep had good alignment`,
					ts,
					bodyLinePercentage,
					requiredBodyLinePercentage
				);
				state.currentRep.errorHistory.push(error);
			}
			
			// Calculate side balance for this rep
			const sideBalanceData = calculateSideBalance(result.landmarks, 'pushup');
			
			// Calculate rep quality
			const { score, quality } = calculateRepQuality(
				state.currentRep.errorHistory,
				repDuration,
				'pushup',
				{
					elbowAngle: peakElbowAngle,
					bodyLine: avgBodyLine,
					bodyLinePercentage
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
				peakAngle: peakElbowAngle,
				sideBalance: sideBalanceData?.balanceScore,
				pushup: {
					elbowAngle: peakElbowAngle,
					bodyLine: avgBodyLine,
					bodyLinePercentage
				}
			};
			
			state.repCount += 1;
			state.metrics.push(repMetric);
			
			// Calculate Form IQ for all reps so far
			const formIQMetrics = calculateFormIQ(state.metrics, 'pushup', sideBalanceData || undefined);
			
			// Update the latest rep with Form IQ
			if (state.metrics.length > 0) {
				state.metrics[state.metrics.length - 1].formIQ = formIQMetrics.formIQ;
			}
			
			// Reset for next rep
			state.currentRep = undefined;
			state.phase = 'idle';
			
			// Reset error states
			errorStates = {
				hipSag: { startTime: null, threshold: 0 },
				bodyLinePoor: { startTime: null, threshold: 0 }
			};
		}
		
		return state;
	};
} 