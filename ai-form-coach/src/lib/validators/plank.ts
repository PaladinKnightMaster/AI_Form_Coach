import type { Validator, ValidatorState, ValidatorConfig, RepMetric } from './types';
import type { PoseEstimateResult } from '../pose/engine';
import { getExerciseAngle } from '../pose/normalize';
import { getExerciseConfig } from '@/lib/calibration/constants';
import { getUserCalibration } from '@/lib/calibration/service';
import type { DeviceCalibration } from '@/types/calibration';
import { 
	createFormError, 
	checkErrorDuration
} from './formAnalysis';
import { calculateHybridRepQuality } from '../microModel/qualityIntegration';
import { ValidatorPhaseDetector } from '../phaseDetection/validatorIntegration';

export function createPlankValidator(): Validator {
	const state: ValidatorState = { 
		repCount: 0, 
		phase: 'idle', 
		cues: [], 
		metrics: [],
		currentRep: undefined,
		lastCueTime: 0,
		sessionStartTs: performance.now()
	};
	
	let userCalibration: DeviceCalibration | null = null;
	let stable = 0;
	let phaseDetector: ValidatorPhaseDetector | null = null;
	
	// Error tracking state
	const errorStates = {
		hipSag: { startTime: null as number | null, threshold: 0 }
	};

	const completeHold = async (ts: number, bodyLineThreshold: number) => {
		if (!state.currentRep) return;

		const holdDuration = ts - state.currentRep.startTs;
		const avgBodyLine = state.currentRep.measurements.bodyLines.reduce((a, b) => a + b, 0) / state.currentRep.measurements.bodyLines.length;
		const goodBodyLineCount = state.currentRep.measurements.bodyLines.filter(angle => angle >= bodyLineThreshold).length;
		const bodyLinePercentage = (goodBodyLineCount / state.currentRep.measurements.bodyLines.length) * 100;
		const hipSagDuration = state.currentRep.errorHistory
			.filter(e => e.type === 'hip_sag')
			.reduce((total, e) => total + e.duration, 0);

		const sessionContext = {
			totalReps: state.repCount + 1,
			currentRepIndex: state.repCount,
			recentReps: state.metrics.slice(-5),
			sessionDuration: ts - (state.sessionStartTs || ts),
			exercise: 'plank' as const
		};

		const { score, quality } = await calculateHybridRepQuality(
			state.currentRep.errorHistory,
			holdDuration,
			'plank',
			{
				bodyLine: avgBodyLine,
				bodyLinePercentage,
				hipSagDuration
			},
			sessionContext
		);

		const repMetric: RepMetric = {
			startTs: state.currentRep.startTs,
			endTs: ts,
			duration: holdDuration,
			tempo: 'normal',
			errors: [...state.currentRep.errorHistory],
			quality,
			score,
			peakAngle: avgBodyLine,
			plank: {
				bodyLine: avgBodyLine,
				bodyLinePercentage,
				hipSagDuration
			}
		};

		state.repCount += 1;
		state.metrics.push(repMetric);
		state.currentRep = undefined;
		state.phase = 'idle';
		errorStates.hipSag.startTime = null;
	};

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
		
		const bodyLineAngle = torsoAngle; // For plank, torso angle represents body line alignment
		
		// Use calibrated thresholds
		const bodyLineThreshold = config.plank.idealHipAngle; // Use calibrated body line target
		const debounce = cfg?.debounceFrames ?? 3;
		const hipSagThreshold = cfg?.errorThresholds?.errorDurationThresholds?.hipSag ?? 300; // ms
		const holdReleaseThreshold = Math.min(bodyLineThreshold - 18, 155);

		// Initialize enhanced phase detector if not already done
		if (!phaseDetector) {
			phaseDetector = new ValidatorPhaseDetector('plank', {
				...cfg,
				enhancedPhaseDetection: {
					enabled: false,
					smoothing: {
						enabled: false,
						windowSize: cfg?.enhancedPhaseDetection?.smoothing?.windowSize ?? 5,
						polynomialOrder: cfg?.enhancedPhaseDetection?.smoothing?.polynomialOrder ?? 2,
					},
					hmm: {
						enabled: false,
						transitionSmoothing: cfg?.enhancedPhaseDetection?.hmm?.transitionSmoothing ?? 0.1,
						observationNoise: cfg?.enhancedPhaseDetection?.hmm?.observationNoise ?? 0.05,
					},
					debounce: {
						enabled: cfg?.enhancedPhaseDetection?.debounce?.enabled ?? true,
						frames: cfg?.enhancedPhaseDetection?.debounce?.frames ?? 3,
					},
				},
			});
		}
		
		// Enhanced phase detection with Savitzky-Golay smoothing and HMM
		const phaseDetectionResult = phaseDetector.detectPhase(ts, bodyLineAngle, bodyLineAngle);
		const desired = phaseDetectionResult.phase;
		
		// Update enhanced phase detection state
		state.enhancedPhaseDetection = {
			enabled: phaseDetectionResult.enhanced,
			confidence: phaseDetectionResult.confidence,
			smoothedValue: phaseDetectionResult.smoothedValue,
			originalValue: phaseDetectionResult.originalValue,
			processingTime: phaseDetectionResult.processingTime,
		};
		
		// Phase transition with enhanced detection and debouncing
		if (desired !== state.phase) {
			stable += 1;
			if (stable >= debounce) {
				if (desired === 'hold') {
					state.phase = 'hold';
					
					// Initialize current rep tracking
					if (!state.currentRep) {
						state.currentRep = {
							startTs: ts,
							phaseHistory: [{ phase: 'hold', timestamp: ts }],
							errorHistory: [],
							measurements: {
								angles: [bodyLineAngle],
								depths: [bodyLineAngle],
								bodyLines: [bodyLineAngle]
							}
						};
						state.cues.push('Maintain straight line');
					}
				} else {
					if (state.phase === 'hold' && state.currentRep) {
						await completeHold(ts, bodyLineThreshold);
					}

					state.phase = 'idle';
					state.cues.push('Hips down, squeeze glutes');
				}
				stable = 0;
			}
		} else {
			stable = 0;
		}
		
		// Update current rep measurements during hold
		if (state.currentRep && state.phase === 'hold') {
			state.currentRep.measurements.angles.push(bodyLineAngle);
			state.currentRep.measurements.depths.push(bodyLineAngle);
			state.currentRep.measurements.bodyLines.push(bodyLineAngle);
			
			// Continuous error detection during hold
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

			if (bodyLineAngle <= holdReleaseThreshold) {
				await completeHold(ts, bodyLineThreshold);
				state.cues.push('Reset your line before the next hold');
			}
		}
		
		return state;
	};
} 