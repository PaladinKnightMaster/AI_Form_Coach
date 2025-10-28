/**
 * Pose Filtering Worker
 * 
 * Phase C: Web Worker Implementation
 * Runs on background thread to process landmark filtering
 * Offloads smoothing pipeline from main thread
 */

import type { FilterRequest, FilterResult, WorkerMessage } from './workerFilteringPool';
import { MedianFilter, OutlierDetector } from './filters';

// ============================================
// Worker State
// ============================================

let medianFilter: MedianFilter | null = null;
let outlierDetector: OutlierDetector | null = null;

// ============================================
// Worker Message Handler
// ============================================

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  try {
    if (event.data.type === 'filter') {
      const request = event.data.payload as FilterRequest;
      await handleFilterRequest(request);
    }
  } catch (error) {
    const errorMessage: WorkerMessage = {
      type: 'error',
      payload: {
        id: (event.data.payload as FilterRequest)?.id || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
    self.postMessage(errorMessage);
  }
};

// ============================================
// Filter Processing
// ============================================

/**
 * Process landmark filtering request
 */
async function handleFilterRequest(request: FilterRequest): Promise<void> {
  const startTime = performance.now();

  // Initialize filters if needed
  if (!medianFilter || !outlierDetector) {
    medianFilter = new MedianFilter(request.config.medianWindowSize);
    outlierDetector = new OutlierDetector({
      maxSpeed: 0.15,
      maxAcceleration: 0.08,
      minVisibility: 0.3
    });
  }

  let filtered = request.landmarks;

  // Stage 1: Outlier Detection
  if (request.config.enableOutlierDetection) {
    filtered = outlierDetector.detect(filtered);
  }

  // Stage 2: Median Filtering
  if (request.config.enableMedianFilter) {
    filtered = medianFilter.filter(filtered);
  }

  const processingTimeMs = performance.now() - startTime;

  // Send result back to main thread
  const result: FilterResult = {
    id: request.id,
    landmarks: filtered,
    processingTimeMs,
    timestamp: performance.now()
  };

  const message: WorkerMessage = {
    type: 'result',
    payload: result
  };

  self.postMessage(message);
}

// ============================================
// Lifecycle
// ============================================

// Log worker initialization
console.log('[PoseFilteringWorker] Initialized and ready');

// Export for type checking (not used in worker context)
export {};
