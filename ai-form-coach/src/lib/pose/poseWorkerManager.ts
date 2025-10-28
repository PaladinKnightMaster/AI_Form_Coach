/**
 * 🏥 PHASE 2.5: Pose Worker Manager
 * 
 * Manages communication with the pose processing worker
 * Provides a clean API for offloading pose computation
 * 
 * Usage:
 * ```typescript
 * const manager = new PoseWorkerManager();
 * await manager.init({ model: 'lite' });
 * const result = await manager.estimate(videoElement);
 * ```
 */

import type { PoseEngineOptions, PoseEstimateResult } from './engine';

// ============================================
// Types
// ============================================

interface PendingRequest {
  resolve: (result: PoseEstimateResult | null) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export interface WorkerPerformanceMetrics {
  averageProcessingTime: number;
  maxProcessingTime: number;
  minProcessingTime: number;
  totalRequests: number;
  failedRequests: number;
  successRate: number;
}

// ============================================
// Pose Worker Manager
// ============================================

export class PoseWorkerManager {
  private worker: Worker | null = null;
  private isReady = false;
  private initPromise: Promise<void> | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private requestCounter = 0;

  // Performance tracking
  private processingTimes: number[] = [];
  private maxTrackedSamples = 100;
  private totalRequests = 0;
  private failedRequests = 0;

  constructor() {
    // Worker will be created on init()
  }

  /**
   * Initialize the worker
   */
  async init(options: PoseEngineOptions = {}): Promise<void> {
    if (this.initPromise) {
      return this.initPromise; // Already initializing
    }

    if (this.isReady) {
      return; // Already ready
    }

    this.initPromise = new Promise<void>((resolve, reject) => {
      try {
        // Create worker
        // Note: In Next.js, we need to use a different approach for worker creation
        // This is a simplified version - in production, use next-worker or similar
        
        // Log configuration options for debugging
        console.log('[PoseWorkerManager] Initializing with options:', {
          model: options.model || 'lite',
          smoothingAlpha: options.smoothingAlpha || 0.65,
          enableWorkerFiltering: options.enableWorkerFiltering || false
        });
        
        // For now, we'll mark this as "unsupported" and fall back to main thread
        console.warn('[PoseWorkerManager] Web Workers for pose processing not yet fully supported');
        console.warn('[PoseWorkerManager] Falling back to main thread processing');
        
        // Set ready flag (will use main thread fallback)
        this.isReady = true;
        resolve();
        
        /* Future implementation:
        this.worker = new Worker(
          new URL('./pose.worker.ts', import.meta.url),
          { type: 'module' }
        );

        // Set up message listener
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        this.worker.onerror = this.handleWorkerError.bind(this);

        // Send init message
        this.worker.postMessage({
          type: 'init',
          payload: options
        });

        // Wait for ready signal
        const readyListener = (event: MessageEvent) => {
          if (event.data.type === 'ready') {
            this.isReady = true;
            this.worker?.removeEventListener('message', readyListener);
            resolve();
          }
        };
        this.worker.addEventListener('message', readyListener);

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.isReady) {
            reject(new Error('Worker initialization timeout'));
          }
        }, 10000);
        */
        
      } catch (error) {
        reject(error);
      }
    });

    return this.initPromise;
  }

  /**
   * Check if worker is ready
   */
  get ready(): boolean {
    return this.isReady;
  }

  /**
   * Estimate pose (currently falls back to main thread)
   * 
   * Note: Full worker implementation requires OffscreenCanvas support
   * which has limitations with MediaPipe's requirement for HTMLVideoElement
   */
  async estimate(videoElement: HTMLVideoElement): Promise<PoseEstimateResult | null> {
    if (!this.isReady) {
      throw new Error('PoseWorkerManager not initialized');
    }

    this.totalRequests++;

    // Validate video element
    if (!videoElement || videoElement.readyState < 2) {
      console.warn('[PoseWorkerManager] Video element not ready, skipping frame');
      return null;
    }

    // FALLBACK: Process on main thread
    // In practice, the PoseEngine2 is already optimized
    // The worker would mainly help with filtering/smoothing
    
    console.log('[PoseWorkerManager] Using main thread (worker not implemented)');
    return null; // Caller should handle fallback
  }

  /**
   * Get performance metrics
   */
  getMetrics(): WorkerPerformanceMetrics {
    if (this.processingTimes.length === 0) {
      return {
        averageProcessingTime: 0,
        maxProcessingTime: 0,
        minProcessingTime: 0,
        totalRequests: this.totalRequests,
        failedRequests: this.failedRequests,
        successRate: 0
      };
    }

    const avg = this.processingTimes.reduce((sum, t) => sum + t, 0) / this.processingTimes.length;
    const max = Math.max(...this.processingTimes);
    const min = Math.min(...this.processingTimes);
    const successRate = ((this.totalRequests - this.failedRequests) / this.totalRequests) * 100;

    return {
      averageProcessingTime: avg,
      maxProcessingTime: max,
      minProcessingTime: min,
      totalRequests: this.totalRequests,
      failedRequests: this.failedRequests,
      successRate
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.processingTimes = [];
    this.totalRequests = 0;
    this.failedRequests = 0;
  }

  /**
   * Dispose of worker and clean up
   */
  dispose(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'dispose' });
      this.worker.terminate();
      this.worker = null;
    }

    // Reject all pending requests
    for (const pending of this.pendingRequests.values()) {
      pending.reject(new Error('Worker disposed'));
    }
    this.pendingRequests.clear();

    this.isReady = false;
    this.initPromise = null;

    console.log('[PoseWorkerManager] Disposed');
  }

  // ============================================
  // Private Methods
  // ============================================

  private handleWorkerMessage(event: MessageEvent): void {
    const { type, id, payload } = event.data;

    switch (type) {
      case 'result':
        this.handleResult(id, payload);
        break;

      case 'error':
        this.handleError(id, payload);
        break;

      default:
        console.warn('[PoseWorkerManager] Unknown message type:', type);
    }
  }

  private handleResult(id: string, payload: { result: PoseEstimateResult | null; processingTime: number }): void {
    const pending = this.pendingRequests.get(id);
    if (!pending) {
      console.warn('[PoseWorkerManager] No pending request for ID:', id);
      return;
    }

    // Track performance
    this.processingTimes.push(payload.processingTime);
    if (this.processingTimes.length > this.maxTrackedSamples) {
      this.processingTimes.shift();
    }

    // Resolve promise
    pending.resolve(payload.result);
    this.pendingRequests.delete(id);
  }

  private handleError(id: string, payload: { message: string; error: Error }): void {
    this.failedRequests++;

    if (id) {
      const pending = this.pendingRequests.get(id);
      if (pending) {
        pending.reject(new Error(payload.message));
        this.pendingRequests.delete(id);
      }
    }

    console.error('[PoseWorkerManager] Worker error:', payload.message, payload.error);
  }

  private handleWorkerError(error: ErrorEvent): void {
    console.error('[PoseWorkerManager] Worker error event:', error);
    this.failedRequests++;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${this.requestCounter++}`;
  }
}

/**
 * Singleton instance for easy access
 * (optional - you can also create your own instances)
 */
let globalInstance: PoseWorkerManager | null = null;

export function getPoseWorkerManager(): PoseWorkerManager {
  if (!globalInstance) {
    globalInstance = new PoseWorkerManager();
  }
  return globalInstance;
}


