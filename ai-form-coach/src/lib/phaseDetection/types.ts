/**
 * Phase Detection Types
 * 
 * Defines types for the enhanced phase detection system using
 * Savitzky-Golay smoothing and Hidden Markov Models (HMM).
 */

export type Phase = 'idle' | 'up' | 'down' | 'hold';

export type Exercise = 'squat' | 'pushup' | 'plank';

export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
}

export interface SmoothedTimeSeries {
  original: TimeSeriesPoint[];
  smoothed: TimeSeriesPoint[];
  windowSize: number;
  polynomialOrder: number;
}

export interface PhaseTransition {
  from: Phase;
  to: Phase;
  timestamp: number;
  confidence: number;
  smoothedValue: number;
  originalValue: number;
}

export interface HMMState {
  phase: Phase;
  probability: number;
  timestamp: number;
}

export interface HMMConfig {
  // Transition probabilities between phases
  transitionMatrix: {
    [from in Phase]: {
      [to in Phase]: number;
    };
  };
  
  // Observation probabilities (emission probabilities)
  observationMatrix: {
    [phase in Phase]: {
      mean: number;
      variance: number;
    };
  };
  
  // Initial state probabilities
  initialProbabilities: {
    [phase in Phase]: number;
  };
  
  // Smoothing parameters
  smoothing: {
    windowSize: number;
    polynomialOrder: number;
  };
  
  // Phase detection thresholds
  thresholds: {
    [exercise in Exercise]: {
      [phase in Phase]: {
        min: number;
        max: number;
      };
    };
  };
}

export interface PhaseDetectionResult {
  currentPhase: Phase;
  confidence: number;
  smoothedValue: number;
  originalValue: number;
  phaseHistory: HMMState[];
  transitions: PhaseTransition[];
  hmmProbabilities: {
    [phase in Phase]: number;
  };
  processingTime: number;
}

export interface PhaseDetectorConfig {
  exercise: Exercise;
  smoothing: {
    enabled: boolean;
    windowSize: number;
    polynomialOrder: number;
  };
  hmm: {
    enabled: boolean;
    transitionSmoothing: number;
    observationNoise: number;
  };
  debounce: {
    enabled: boolean;
    frames: number;
  };
  thresholds: {
    [phase in Phase]: {
      min: number;
      max: number;
    };
  };
}

export interface SavitzkyGolayConfig {
  windowSize: number;
  polynomialOrder: number;
  derivative: number; // 0 for smoothing, 1 for first derivative, etc.
}

export interface PhaseDetectorStats {
  totalFrames: number;
  phaseTransitions: number;
  smoothingApplied: number;
  hmmCorrections: number;
  debounceBlocks: number;
  averageProcessingTime: number;
  confidenceDistribution: {
    high: number; // > 0.8
    medium: number; // 0.5 - 0.8
    low: number; // < 0.5
  };
}

export const DEFAULT_PHASE_DETECTOR_CONFIG: PhaseDetectorConfig = {
  exercise: 'squat',
  smoothing: {
    enabled: true,
    windowSize: 5, // 5-frame window for smoothing
    polynomialOrder: 2, // Quadratic polynomial
  },
  hmm: {
    enabled: true,
    transitionSmoothing: 0.1, // Smoothing factor for transitions
    observationNoise: 0.05, // Observation noise variance
  },
  debounce: {
    enabled: true,
    frames: 3, // 3-frame debounce
  },
  thresholds: {
    idle: { min: -Infinity, max: 0.1 },
    up: { min: 0.1, max: 0.7 },
    down: { min: 0.7, max: 1.0 },
    hold: { min: 0.3, max: 0.7 }, // For plank holds
  },
};

export const EXERCISE_SPECIFIC_CONFIGS: Record<Exercise, Partial<PhaseDetectorConfig>> = {
  squat: {
    thresholds: {
      idle: { min: -Infinity, max: 0.1 },
      up: { min: 0.1, max: 0.6 },
      down: { min: 0.6, max: 1.0 },
      hold: { min: 0.3, max: 0.7 },
    },
  },
  pushup: {
    thresholds: {
      idle: { min: -Infinity, max: 0.1 },
      up: { min: 0.1, max: 0.5 },
      down: { min: 0.5, max: 1.0 },
      hold: { min: 0.3, max: 0.7 },
    },
  },
  plank: {
    thresholds: {
      idle: { min: -Infinity, max: 0.2 },
      up: { min: 0.2, max: 0.4 },
      down: { min: 0.4, max: 0.6 },
      hold: { min: 0.6, max: 1.0 },
    },
  },
};
