/**
 * Savitzky-Golay Smoothing Implementation
 * 
 * Implements the Savitzky-Golay filter for smoothing time-series data
 * to reduce noise while preserving important features like peaks and valleys.
 */

import type { TimeSeriesPoint, SmoothedTimeSeries, SavitzkyGolayConfig } from './types';

// Binomial coefficient calculation removed as it's not used in current implementation

/**
 * Generate Savitzky-Golay coefficients for a given window size and polynomial order
 */
function generateSavitzkyGolayCoefficients(
  windowSize: number,
  polynomialOrder: number,
  derivative: number = 0
): number[] {
  const halfWindow = Math.floor(windowSize / 2);
  const coefficients: number[] = [];
  
  // Generate the design matrix for polynomial fitting
  const designMatrix: number[][] = [];
  for (let i = -halfWindow; i <= halfWindow; i++) {
    const row: number[] = [];
    for (let j = 0; j <= polynomialOrder; j++) {
      row.push(Math.pow(i, j));
    }
    designMatrix.push(row);
  }
  
  // Calculate the pseudo-inverse of the design matrix
  const pseudoInverse = calculatePseudoInverse(designMatrix);
  
  // Extract coefficients for the specified derivative
  for (let i = 0; i < windowSize; i++) {
    let coeff = 0;
    for (let j = 0; j <= polynomialOrder; j++) {
      if (j >= derivative) {
        const factorialValue = calculateFactorial(j) / calculateFactorial(j - derivative);
        coeff += pseudoInverse[derivative][i] * factorialValue;
      }
    }
    coefficients.push(coeff);
  }
  
  return coefficients;
}

/**
 * Calculate the pseudo-inverse of a matrix using SVD
 */
function calculatePseudoInverse(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  // For small matrices, use the normal equation method
  if (rows <= 3 && cols <= 3) {
    return calculateNormalEquationInverse(matrix);
  }
  
  // For larger matrices, use a simplified approach
  return calculateSimplifiedInverse(matrix);
}

/**
 * Calculate inverse using normal equation (for small matrices)
 */
function calculateNormalEquationInverse(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  // Calculate A^T * A
  const ata: number[][] = [];
  for (let i = 0; i < cols; i++) {
    ata[i] = [];
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let k = 0; k < rows; k++) {
        sum += matrix[k][i] * matrix[k][j];
      }
      ata[i][j] = sum;
    }
  }
  
  // Calculate (A^T * A)^-1
  const ataInverse = invertMatrix(ata);
  
  // Calculate (A^T * A)^-1 * A^T
  const result: number[][] = [];
  for (let i = 0; i < cols; i++) {
    result[i] = [];
    for (let j = 0; j < rows; j++) {
      let sum = 0;
      for (let k = 0; k < cols; k++) {
        sum += ataInverse[i][k] * matrix[j][k];
      }
      result[i][j] = sum;
    }
  }
  
  return result;
}

/**
 * Simplified inverse calculation for larger matrices
 */
function calculateSimplifiedInverse(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  // Use a simplified approach: (A^T * A + λI)^-1 * A^T
  const lambda = 0.01; // Regularization parameter
  
  const result: number[][] = [];
  for (let i = 0; i < cols; i++) {
    result[i] = [];
    for (let j = 0; j < rows; j++) {
      let sum = 0;
      for (let k = 0; k < cols; k++) {
        let ata = 0;
        for (let l = 0; l < rows; l++) {
          ata += matrix[l][i] * matrix[l][k];
        }
        if (i === k) ata += lambda; // Add regularization
        sum += (1 / (ata + 1e-10)) * matrix[j][k];
      }
      result[i][j] = sum;
    }
  }
  
  return result;
}

/**
 * Invert a small matrix using Gaussian elimination
 */
function invertMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  const identity: number[][] = [];
  
  // Create identity matrix
  for (let i = 0; i < n; i++) {
    identity[i] = [];
    for (let j = 0; j < n; j++) {
      identity[i][j] = i === j ? 1 : 0;
    }
  }
  
  // Create augmented matrix
  const augmented: number[][] = [];
  for (let i = 0; i < n; i++) {
    augmented[i] = [...matrix[i], ...identity[i]];
  }
  
  // Gaussian elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    
    // Swap rows
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    
    // Make diagonal element 1
    const pivot = augmented[i][i];
    if (Math.abs(pivot) < 1e-10) {
      throw new Error('Matrix is singular');
    }
    
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivot;
    }
    
    // Eliminate column
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmented[k][i];
        for (let j = 0; j < 2 * n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
  }
  
  // Extract inverse matrix
  const inverse: number[][] = [];
  for (let i = 0; i < n; i++) {
    inverse[i] = augmented[i].slice(n);
  }
  
  return inverse;
}

/**
 * Calculate factorial
 */
function calculateFactorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Apply Savitzky-Golay smoothing to a time series
 *
 * @deprecated Math is broken. See war-room concern #1 in
 *   `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`. The coefficient extractor
 *   sums when it should pick (overshoots by ~(polynomialOrder + 1)×), the
 *   post-convolution `/= validPoints` normalization is incorrect, and
 *   `calculateSimplifiedInverse` for windowSize > 3 is element-wise reciprocal
 *   instead of pseudo-inverse. Constant input does NOT round-trip.
 *
 *   Production uses `enabled: false` in the config (default since this PR).
 *   Do not re-enable without fixing the math; see `sgDefaultDisabled.test.ts`
 *   for the bug-existence pinning test that fails on a future correct
 *   implementation.
 */
export function applySavitzkyGolaySmoothing(
  timeSeries: TimeSeriesPoint[],
  config: SavitzkyGolayConfig
): SmoothedTimeSeries {
  const { windowSize, polynomialOrder, derivative } = config;
  
  if (timeSeries.length < windowSize) {
    // Not enough data points, return original
    return {
      original: timeSeries,
      smoothed: timeSeries,
      windowSize,
      polynomialOrder,
    };
  }
  
  // Generate coefficients
  const coefficients = generateSavitzkyGolayCoefficients(
    windowSize,
    polynomialOrder,
    derivative
  );
  
  const halfWindow = Math.floor(windowSize / 2);
  const smoothed: TimeSeriesPoint[] = [];
  
  // Apply smoothing to each point
  for (let i = 0; i < timeSeries.length; i++) {
    let smoothedValue = 0;
    let validPoints = 0;
    
    // Apply convolution with coefficients
    for (let j = 0; j < windowSize; j++) {
      const dataIndex = i - halfWindow + j;
      
      if (dataIndex >= 0 && dataIndex < timeSeries.length) {
        smoothedValue += timeSeries[dataIndex].value * coefficients[j];
        validPoints++;
      }
    }
    
    // Normalize by the number of valid points
    if (validPoints > 0) {
      smoothedValue /= validPoints;
    }
    
    smoothed.push({
      timestamp: timeSeries[i].timestamp,
      value: smoothedValue,
    });
  }
  
  return {
    original: timeSeries,
    smoothed,
    windowSize,
    polynomialOrder,
  };
}

/**
 * Apply real-time Savitzky-Golay smoothing with a sliding window
 *
 * @deprecated Math is broken. See war-room concern #1 in
 *   `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`. The coefficient extractor
 *   sums when it should pick (overshoots by ~(polynomialOrder + 1)×) and
 *   `calculateSimplifiedInverse` for windowSize > 3 is element-wise reciprocal
 *   instead of pseudo-inverse. Constant input does NOT round-trip — `addPoint`
 *   fed a constant 0.5 returns values like 27000000002.1875 for the production
 *   config (windowSize=5, polynomialOrder=2).
 *
 *   Production uses `smoothing.enabled = false` in the config (default since
 *   this PR). Do not re-instantiate this class without fixing the math; see
 *   `sgDefaultDisabled.test.ts` for the bug-existence pinning test that fails
 *   on a future correct implementation.
 */
export class RealTimeSavitzkyGolay {
  private buffer: TimeSeriesPoint[] = [];
  private coefficients: number[];
  private halfWindow: number;
  
  constructor(
    private windowSize: number,
    private polynomialOrder: number,
    private derivative: number = 0
  ) {
    this.coefficients = generateSavitzkyGolayCoefficients(
      windowSize,
      polynomialOrder,
      derivative
    );
    this.halfWindow = Math.floor(windowSize / 2);
  }
  
  /**
   * Add a new data point and get the smoothed value
   */
  addPoint(timestamp: number, value: number): number {
    // Add new point to buffer
    this.buffer.push({ timestamp, value });
    
    // Keep only the necessary buffer size
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }
    
    // Not enough data points yet
    if (this.buffer.length < this.windowSize) {
      return value;
    }
    
    // Apply smoothing
    let smoothedValue = 0;
    for (let i = 0; i < this.windowSize; i++) {
      smoothedValue += this.buffer[i].value * this.coefficients[i];
    }
    
    return smoothedValue;
  }
  
  /**
   * Get the current buffer size
   */
  getBufferSize(): number {
    return this.buffer.length;
  }
  
  /**
   * Clear the buffer
   */
  clear(): void {
    this.buffer = [];
  }
  
  /**
   * Get the smoothed value for the most recent point
   */
  getLatestSmoothedValue(): number | null {
    if (this.buffer.length < this.windowSize) {
      return null;
    }
    
    let smoothedValue = 0;
    for (let i = 0; i < this.windowSize; i++) {
      smoothedValue += this.buffer[i].value * this.coefficients[i];
    }
    
    return smoothedValue;
  }
}
