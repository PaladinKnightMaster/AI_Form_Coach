/**
 * Web Worker Filtering Pool Manager
 * 
 * Phase C: Web Worker Integration & Off-Thread Processing
 * Manages a pool of workers for distributed landmark filtering
 * Falls back to main thread if workers unavailable
 */

import type { Landmark3D } from './engine';

// ============================================
// Worker Message Types
// ============================================

export interface FilterRequest {
  id: string;
  landmarks: Landmark3D[];
  config: {
    enableMedianFilter: boolean;
    enableOutlierDetection: boolean;
    medianWindowSize: number;
  };
  timestamp: number;
}

export interface FilterResult {
  id: string;
  landmarks: Landmark3D[];
  processingTimeMs: number;
  timestamp: number;
}

export interface WorkerMessage {
  type: 'filter' | 'result' | 'error';
  payload: FilterRequest | FilterResult | { id: string; error: string };
}

// ============================================
// Worker Pool
// ============================================

export class WorkerFilteringPool {
  private workers: Worker[] = [];
  private poolSize: number;
  private currentWorkerIndex: number = 0;
  private pendingRequests: Map<string, {
    resolve: (result: FilterResult) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }> = new Map();
  private requestTimeout: number = 16; // 16ms timeout (one frame @ 60fps)
  private enabled: boolean = true;

  constructor(poolSize: number = 2) {
    this.poolSize = poolSize;
    
    // Try to initialize workers
    if (typeof Worker !== 'undefined') {
      try {
        this.initializeWorkers();
      } catch (error) {
        console.warn('[WorkerFilteringPool] Failed to initialize workers:', error);
        this.enabled = false;
      }
    } else {
      console.warn('[WorkerFilteringPool] Web Workers not available');
      this.enabled = false;
    }
  }

  /**
   * Initialize worker pool
   */
  private initializeWorkers(): void {
    try {
      for (let i = 0; i < this.poolSize; i++) {
        const worker = new Worker(
          new URL('./poseFilteringWorker.ts', import.meta.url),
          { type: 'module' }
        );

        worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
          this.handleWorkerMessage(event.data);
        };

        worker.onerror = (error: ErrorEvent) => {
          console.error(`[WorkerFilteringPool] Worker ${i} error:`, error);
          this.handleWorkerError(error);
        };

        this.workers.push(worker);
      }

      console.log(`[WorkerFilteringPool] Initialized ${this.poolSize} workers`);
    } catch (error) {
      console.error('[WorkerFilteringPool] Worker initialization failed:', error);
      this.enabled = false;
    }
  }

  /**
   * Request landmark filtering from worker pool
   */
  async filterLandmarks(landmarks: Landmark3D[], config: FilterRequest['config']): Promise<Landmark3D[] | null> {
    if (!this.enabled || this.workers.length === 0) {
      return null; // Fallback to main thread processing
    }

    const requestId = `filter_${Date.now()}_${Math.random()}`;
    
    try {
      return await new Promise<Landmark3D[]>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          this.pendingRequests.delete(requestId);
          reject(new Error('Worker filtering timeout'));
        }, this.requestTimeout);

        this.pendingRequests.set(requestId, {
          resolve: (result: FilterResult) => {
            clearTimeout(timeoutId);
            resolve(result.landmarks);
          },
          reject: (error: Error) => {
            clearTimeout(timeoutId);
            reject(error);
          },
          timeout: timeoutId
        });

        // Send to next available worker (round-robin)
        const worker = this.workers[this.currentWorkerIndex];
        this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length;

        const request: FilterRequest = {
          id: requestId,
          landmarks,
          config,
          timestamp: performance.now()
        };

        worker.postMessage({ type: 'filter', payload: request } as WorkerMessage);
      });
    } catch (error) {
      console.warn('[WorkerFilteringPool] Filtering request failed:', error);
      this.pendingRequests.delete(requestId);
      return null; // Return null to signal main thread should handle
    }
  }

  /**
   * Handle worker result
   */
  private handleWorkerMessage(message: WorkerMessage): void {
    if (message.type === 'result') {
      const result = message.payload as FilterResult;
      const pending = this.pendingRequests.get(result.id);

      if (pending) {
        this.pendingRequests.delete(result.id);
        pending.resolve(result);
      }
    } else if (message.type === 'error') {
      const error = message.payload as { id: string; error: string };
      const pending = this.pendingRequests.get(error.id);

      if (pending) {
        this.pendingRequests.delete(error.id);
        pending.reject(new Error(error.error));
      }
    }
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(error: ErrorEvent): void {
    console.error('[WorkerFilteringPool] Worker encountered error:', error.message);
    // Disable worker pool on error
    this.enabled = false;
  }

  /**
   * Check if workers are available
   */
  isAvailable(): boolean {
    return this.enabled && this.workers.length > 0;
  }

  /**
   * Terminate all workers
   */
  terminate(): void {
    this.workers.forEach(worker => {
      try {
        worker.terminate();
      } catch (error) {
        console.warn('[WorkerFilteringPool] Error terminating worker:', error);
      }
    });
    this.workers = [];
    this.enabled = false;
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    workerCount: number;
    pendingRequests: number;
    isEnabled: boolean;
  } {
    return {
      workerCount: this.workers.length,
      pendingRequests: this.pendingRequests.size,
      isEnabled: this.enabled
    };
  }
}

// ============================================
// Global Worker Pool Instance
// ============================================

let globalPool: WorkerFilteringPool | null = null;

/**
 * Get or create global worker pool
 */
export function getWorkerFilteringPool(): WorkerFilteringPool {
  if (!globalPool) {
    globalPool = new WorkerFilteringPool(2); // 2 workers by default
  }
  return globalPool;
}

/**
 * Terminate global worker pool
 */
export function terminateWorkerFilteringPool(): void {
  if (globalPool) {
    globalPool.terminate();
    globalPool = null;
  }
}
