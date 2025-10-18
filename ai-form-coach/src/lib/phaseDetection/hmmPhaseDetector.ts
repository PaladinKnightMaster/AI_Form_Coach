/**
 * Hidden Markov Model (HMM) Phase Detector
 * 
 * Implements a 3-state HMM for robust phase detection in exercise movements.
 * Uses the Viterbi algorithm for optimal state sequence estimation.
 */

import type { 
  Phase, 
  Exercise, 
  HMMConfig, 
  HMMState, 
  PhaseTransition, 
  PhaseDetectionResult,
  PhaseDetectorConfig 
} from './types';
import { RealTimeSavitzkyGolay } from './savitzkyGolay';

/**
 * Hidden Markov Model for phase detection
 */
export class HMMPhaseDetector {
  private config: HMMConfig;
  private currentState: Phase = 'idle';
  private stateHistory: HMMState[] = [];
  private transitionHistory: PhaseTransition[] = [];
  private smoothingFilter: RealTimeSavitzkyGolay;
  private debounceCounter = 0;
  private lastTransitionTime = 0;
  
  constructor(
    private exercise: Exercise,
    private detectorConfig: PhaseDetectorConfig
  ) {
    this.config = this.createHMMConfig();
    this.smoothingFilter = new RealTimeSavitzkyGolay(
      detectorConfig.smoothing.windowSize,
      detectorConfig.smoothing.polynomialOrder
    );
  }
  
  /**
   * Create HMM configuration based on exercise type
   */
  private createHMMConfig(): HMMConfig {
    const baseConfig: HMMConfig = {
      transitionMatrix: {
        idle: { idle: 0.7, up: 0.2, down: 0.1, hold: 0.0 },
        up: { idle: 0.1, up: 0.6, down: 0.3, hold: 0.0 },
        down: { idle: 0.0, up: 0.4, down: 0.6, hold: 0.0 },
        hold: { idle: 0.2, up: 0.0, down: 0.0, hold: 0.8 },
      },
      observationMatrix: {
        idle: { mean: 0.05, variance: 0.01 },
        up: { mean: 0.4, variance: 0.1 },
        down: { mean: 0.8, variance: 0.1 },
        hold: { mean: 0.5, variance: 0.05 },
      },
      initialProbabilities: {
        idle: 0.8,
        up: 0.1,
        down: 0.1,
        hold: 0.0,
      },
      smoothing: {
        windowSize: this.detectorConfig.smoothing.windowSize,
        polynomialOrder: this.detectorConfig.smoothing.polynomialOrder,
      },
      thresholds: {
        squat: {
          idle: { min: -Infinity, max: 0.1 },
          up: { min: 0.1, max: 0.6 },
          down: { min: 0.6, max: 1.0 },
          hold: { min: 0.3, max: 0.7 },
        },
        pushup: {
          idle: { min: -Infinity, max: 0.1 },
          up: { min: 0.1, max: 0.5 },
          down: { min: 0.5, max: 1.0 },
          hold: { min: 0.3, max: 0.7 },
        },
        plank: {
          idle: { min: -Infinity, max: 0.2 },
          up: { min: 0.2, max: 0.4 },
          down: { min: 0.4, max: 0.6 },
          hold: { min: 0.6, max: 1.0 },
        },
      },
    };
    
    // Adjust transition probabilities based on exercise type
    if (this.exercise === 'plank') {
      baseConfig.transitionMatrix = {
        idle: { idle: 0.6, up: 0.0, down: 0.0, hold: 0.4 },
        up: { idle: 0.2, up: 0.0, down: 0.0, hold: 0.8 },
        down: { idle: 0.2, up: 0.0, down: 0.0, hold: 0.8 },
        hold: { idle: 0.1, up: 0.0, down: 0.0, hold: 0.9 },
      };
    }
    
    return baseConfig;
  }
  
  /**
   * Calculate observation probability for a given state and observation
   */
  private calculateObservationProbability(
    state: Phase,
    observation: number
  ): number {
    const obsConfig = this.config.observationMatrix[state];
    const mean = obsConfig.mean;
    const variance = obsConfig.variance;
    
    // Gaussian probability density function
    const exponent = -Math.pow(observation - mean, 2) / (2 * variance);
    const probability = Math.exp(exponent) / Math.sqrt(2 * Math.PI * variance);
    
    return Math.max(probability, 1e-10); // Avoid zero probabilities
  }
  
  /**
   * Apply Viterbi algorithm for optimal state sequence
   */
  private viterbiAlgorithm(
    observations: number[]
  ): { state: Phase; probability: number } {
    const states: Phase[] = ['idle', 'up', 'down', 'hold'];
    const numStates = states.length;
    const numObservations = observations.length;
    
    if (numObservations === 0) {
      return { state: this.currentState, probability: 1.0 };
    }
    
    // Initialize Viterbi table
    const viterbi: number[][] = [];
    const backpointer: number[][] = [];
    
    for (let i = 0; i < numStates; i++) {
      viterbi[i] = [];
      backpointer[i] = [];
    }
    
    // Initialization step
    for (let i = 0; i < numStates; i++) {
      const state = states[i];
      const initialProb = this.config.initialProbabilities[state];
      const obsProb = this.calculateObservationProbability(state, observations[0]);
      viterbi[i][0] = Math.log(initialProb) + Math.log(obsProb);
      backpointer[i][0] = 0;
    }
    
    // Recursion step
    for (let t = 1; t < numObservations; t++) {
      for (let i = 0; i < numStates; i++) {
        const currentState = states[i];
        const obsProb = this.calculateObservationProbability(currentState, observations[t]);
        
        let maxProb = -Infinity;
        let maxState = 0;
        
        for (let j = 0; j < numStates; j++) {
          const prevState = states[j];
          const transitionProb = this.config.transitionMatrix[prevState][currentState];
          const prob = viterbi[j][t - 1] + Math.log(transitionProb) + Math.log(obsProb);
          
          if (prob > maxProb) {
            maxProb = prob;
            maxState = j;
          }
        }
        
        viterbi[i][t] = maxProb;
        backpointer[i][t] = maxState;
      }
    }
    
    // Termination step - find the most likely final state
    let maxProb = -Infinity;
    let maxState = 0;
    
    for (let i = 0; i < numStates; i++) {
      if (viterbi[i][numObservations - 1] > maxProb) {
        maxProb = viterbi[i][numObservations - 1];
        maxState = i;
      }
    }
    
    // Backtrack to find the optimal state sequence
    const optimalState = states[maxState];
    const probability = Math.exp(maxProb);
    
    return { state: optimalState, probability };
  }
  
  /**
   * Detect phase using HMM with smoothed observations
   */
  detectPhase(
    timestamp: number,
    rawValue: number,
    originalValue: number
  ): PhaseDetectionResult {
    const startTime = performance.now();
    
    // Apply smoothing if enabled
    let smoothedValue = rawValue;
    if (this.detectorConfig.smoothing.enabled) {
      smoothedValue = this.smoothingFilter.addPoint(timestamp, rawValue);
    }
    
    // Create observation sequence for HMM
    const observations = [smoothedValue];
    
    // Apply HMM if enabled
    let detectedPhase = this.currentState;
    let confidence = 0.5;
    const hmmProbabilities: { [phase in Phase]: number } = {
      idle: 0.25,
      up: 0.25,
      down: 0.25,
      hold: 0.25,
    };
    
    if (this.detectorConfig.hmm.enabled) {
      const hmmResult = this.viterbiAlgorithm(observations);
      detectedPhase = hmmResult.state;
      confidence = Math.min(hmmResult.probability, 1.0);
      
      // Calculate probabilities for all states
      const states: Phase[] = ['idle', 'up', 'down', 'hold'];
      for (const state of states) {
        hmmProbabilities[state] = this.calculateObservationProbability(state, smoothedValue);
      }
      
      // Normalize probabilities
      const totalProb = Object.values(hmmProbabilities).reduce((sum, prob) => sum + prob, 0);
      for (const state of states) {
        hmmProbabilities[state] /= totalProb;
      }
    } else {
      // Fallback to threshold-based detection
      detectedPhase = this.detectPhaseByThresholds(smoothedValue);
      confidence = 0.8; // High confidence for threshold-based detection
    }
    
    // Apply debouncing if enabled
    if (this.detectorConfig.debounce.enabled) {
      if (detectedPhase !== this.currentState) {
        this.debounceCounter++;
        if (this.debounceCounter < this.detectorConfig.debounce.frames) {
          detectedPhase = this.currentState; // Keep current state
          confidence *= 0.5; // Reduce confidence
        } else {
          // Transition confirmed
          this.debounceCounter = 0;
          this.recordPhaseTransition(detectedPhase, timestamp, smoothedValue, originalValue);
        }
      } else {
        this.debounceCounter = 0;
      }
    } else {
      // No debouncing, record transition immediately
      if (detectedPhase !== this.currentState) {
        this.recordPhaseTransition(detectedPhase, timestamp, smoothedValue, originalValue);
      }
    }
    
    // Update current state
    this.currentState = detectedPhase;
    
    // Create state history entry
    const stateEntry: HMMState = {
      phase: detectedPhase,
      probability: confidence,
      timestamp,
    };
    
    this.stateHistory.push(stateEntry);
    
    // Keep only recent history (last 100 entries)
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift();
    }
    
    const processingTime = performance.now() - startTime;
    
    return {
      currentPhase: detectedPhase,
      confidence,
      smoothedValue,
      originalValue,
      phaseHistory: [...this.stateHistory],
      transitions: [...this.transitionHistory],
      hmmProbabilities,
      processingTime,
    };
  }
  
  /**
   * Fallback phase detection using thresholds
   */
  private detectPhaseByThresholds(value: number): Phase {
    const thresholds = this.config.thresholds[this.exercise];
    
    if (value <= thresholds.idle.max) return 'idle';
    if (value <= thresholds.up.max) return 'up';
    if (value <= thresholds.down.max) return 'down';
    return 'hold';
  }
  
  /**
   * Record a phase transition
   */
  private recordPhaseTransition(
    newPhase: Phase,
    timestamp: number,
    smoothedValue: number,
    originalValue: number
  ): void {
    const transition: PhaseTransition = {
      from: this.currentState,
      to: newPhase,
      timestamp,
      confidence: 0.8, // Default confidence for transitions
      smoothedValue,
      originalValue,
    };
    
    this.transitionHistory.push(transition);
    this.lastTransitionTime = timestamp;
    
    // Keep only recent transitions (last 50 entries)
    if (this.transitionHistory.length > 50) {
      this.transitionHistory.shift();
    }
  }
  
  /**
   * Get current state
   */
  getCurrentState(): Phase {
    return this.currentState;
  }
  
  /**
   * Get state history
   */
  getStateHistory(): HMMState[] {
    return [...this.stateHistory];
  }
  
  /**
   * Get transition history
   */
  getTransitionHistory(): PhaseTransition[] {
    return [...this.transitionHistory];
  }
  
  /**
   * Reset the detector
   */
  reset(): void {
    this.currentState = 'idle';
    this.stateHistory = [];
    this.transitionHistory = [];
    this.debounceCounter = 0;
    this.lastTransitionTime = 0;
    this.smoothingFilter.clear();
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PhaseDetectorConfig>): void {
    this.detectorConfig = { ...this.detectorConfig, ...newConfig };
    
    // Recreate smoothing filter if parameters changed
    if (newConfig.smoothing) {
      this.smoothingFilter = new RealTimeSavitzkyGolay(
        this.detectorConfig.smoothing.windowSize,
        this.detectorConfig.smoothing.polynomialOrder
      );
    }
    
    // Update HMM config
    this.config = this.createHMMConfig();
  }
}
