/**
 * Depth Rendering Optimization & Verification
 * 
 * Phase D: Depth Rendering Verification
 * Provides depth rendering with device-aware optimization
 * Ensures 3D occlusion handling doesn't impact frame timing
 */

// ============================================
// Device Capability Detection
// ============================================

export interface DeviceCapabilities {
  hasWebGL: boolean;
  hasWebGL2: boolean;
  gpu: string;
  maxTextureSize: number;
  deviceType: 'desktop' | 'mobile' | 'low-end' | 'unknown';
  estimatedFPS: number; // Estimated max FPS capability
}

/**
 * Detect device capabilities for depth rendering
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  let hasWebGL = false;
  let hasWebGL2 = false;
  let gpu = 'unknown';
  let maxTextureSize = 512;

  try {
    const canvas = document.createElement('canvas');
    
    // Check WebGL 2.0
    try {
      const gl2 = canvas.getContext('webgl2');
      if (gl2) {
        hasWebGL2 = true;
        hasWebGL = true;
        gpu = gl2.getParameter(gl2.RENDERER) || 'unknown';
        maxTextureSize = gl2.getParameter(gl2.MAX_TEXTURE_SIZE);
      }
    } catch {
      // WebGL 2 not available
    }

    // Check WebGL 1.0
    if (!hasWebGL) {
      try {
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          hasWebGL = true;
          const glExt = gl as {
            getParameter(name: number): string | number;
            RENDERER: number;
            MAX_TEXTURE_SIZE: number;
          };
          gpu = glExt.getParameter(glExt.RENDERER as unknown as number) as string || 'unknown';
          maxTextureSize = glExt.getParameter(glExt.MAX_TEXTURE_SIZE as unknown as number) as number;
        }
      } catch {
        // WebGL not available
      }
    }
  } catch (error) {
    console.warn('[DepthOptimization] Error detecting device capabilities:', error);
  }

  // Detect device type
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|iphone|ipad|ipod|webos|blackberry|windows phone/.test(userAgent);
  
  let deviceType: 'desktop' | 'mobile' | 'low-end' | 'unknown' = 'unknown';
  let estimatedFPS = 30;

  if (isMobile) {
    deviceType = 'mobile';
    estimatedFPS = 30;
    
    // Check for low-end indicators
    if (/android 5|android 6|iphone 5|iphone 6|nexus 4/.test(userAgent)) {
      deviceType = 'low-end';
      estimatedFPS = 25;
    }
  } else {
    deviceType = 'desktop';
    estimatedFPS = 60;
  }

  return {
    hasWebGL,
    hasWebGL2,
    gpu,
    maxTextureSize,
    deviceType,
    estimatedFPS
  };
}

// ============================================
// Depth Rendering Configuration
// ============================================

export interface DepthRenderingConfig {
  enableDepthSorting: boolean;      // Enable Z-axis sorting
  enableOcclusion: boolean;         // Enable occlusion rendering
  sortThreshold: number;            // Threshold for re-sorting (normalized coords)
  cacheSize: number;                // Max Z-values to cache
  debugVisualization: boolean;      // Show depth debug overlay
  adaptiveQuality: boolean;         // Auto-disable on low-end devices
}

/**
 * Get optimal depth rendering configuration based on device
 */
export function getOptimalDepthConfig(capabilities: DeviceCapabilities): DepthRenderingConfig {
  const baseConfig: DepthRenderingConfig = {
    enableDepthSorting: true,
    enableOcclusion: true,
    sortThreshold: 0.05,
    cacheSize: 100,
    debugVisualization: false,
    adaptiveQuality: true
  };

  // Adjust for low-end devices
  if (capabilities.deviceType === 'low-end' || capabilities.estimatedFPS < 30) {
    return {
      ...baseConfig,
      enableDepthSorting: false,  // Disable to save CPU
      enableOcclusion: false,     // Skip occlusion
      adaptiveQuality: true
    };
  }

  // Adjust for mobile
  if (capabilities.deviceType === 'mobile') {
    return {
      ...baseConfig,
      sortThreshold: 0.1,  // Less frequent re-sorting
      cacheSize: 50,       // Smaller cache
      enableOcclusion: true  // But keep occlusion
    };
  }

  // Desktop: Full features
  return baseConfig;
}

// ============================================
// Z-Sort Performance Metrics
// ============================================

export interface DepthMetrics {
  sortCount: number;        // Number of times re-sorted
  cacheHits: number;        // Times cache was used
  cacheMisses: number;      // Times cache miss occurred
  avgSortTimeMs: number;    // Average sort duration
  maxSortTimeMs: number;    // Max sort duration
  cacheHitRate: number;     // Percentage of cache hits
}

/**
 * Track depth rendering performance
 */
export class DepthMetricsTracker {
  private sortCount: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private sortTimes: number[] = [];
  private maxSortTimes: number = 30;

  /**
   * Record a sort operation
   */
  recordSort(durationMs: number): void {
    this.sortCount++;
    this.sortTimes.push(durationMs);
    
    if (this.sortTimes.length > this.maxSortTimes) {
      this.sortTimes.shift();
    }
  }

  /**
   * Record cache hit
   */
  recordCacheHit(): void {
    this.cacheHits++;
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  /**
   * Get current metrics
   */
  getMetrics(): DepthMetrics {
    const avgSort = this.sortTimes.length > 0
      ? this.sortTimes.reduce((a, b) => a + b, 0) / this.sortTimes.length
      : 0;
    const maxSort = this.sortTimes.length > 0
      ? Math.max(...this.sortTimes)
      : 0;
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? (this.cacheHits / total) * 100 : 0;

    return {
      sortCount: this.sortCount,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      avgSortTimeMs: avgSort,
      maxSortTimeMs: maxSort,
      cacheHitRate: hitRate
    };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.sortCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.sortTimes = [];
  }
}

// ============================================
// Depth Rendering Quality Validation
// ============================================

export interface DepthValidation {
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
}

/**
 * Validate depth rendering performance
 */
export function validateDepthRendering(
  metrics: DepthMetrics,
  config: DepthRenderingConfig,
  fps: number
): DepthValidation {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check if depth sorting is impacting performance
  if (metrics.maxSortTimeMs > 5) {
    issues.push(`High sort time: ${metrics.maxSortTimeMs.toFixed(2)}ms (target: <5ms)`);
    recommendations.push('Consider increasing sortThreshold to reduce sort frequency');
  }

  // Check cache effectiveness
  if (config.enableDepthSorting && metrics.cacheHitRate < 50) {
    issues.push(`Low cache hit rate: ${metrics.cacheHitRate.toFixed(1)}%`);
    recommendations.push('Increase cacheSize or reduce sortThreshold');
  }

  // Check FPS impact
  if (fps < 25 && config.enableDepthSorting) {
    issues.push(`Low FPS with depth enabled: ${fps} (target: 30+)`);
    recommendations.push('Consider disabling depth sorting on this device');
  }

  return {
    isHealthy: issues.length === 0,
    issues,
    recommendations
  };
}

// ============================================
// Global Depth Optimization Instance
// ============================================

let globalCapabilities: DeviceCapabilities | null = null;
let globalMetrics: DepthMetricsTracker | null = null;

/**
 * Get or create device capabilities
 */
export function getDeviceCapabilities(): DeviceCapabilities {
  if (!globalCapabilities) {
    globalCapabilities = detectDeviceCapabilities();
  }
  return globalCapabilities;
}

/**
 * Get or create depth metrics tracker
 */
export function getDepthMetricsTracker(): DepthMetricsTracker {
  if (!globalMetrics) {
    globalMetrics = new DepthMetricsTracker();
  }
  return globalMetrics;
}

/**
 * Get optimal configuration for current device
 */
export function getCurrentDepthConfig(): DepthRenderingConfig {
  const capabilities = getDeviceCapabilities();
  return getOptimalDepthConfig(capabilities);
}

// ============================================
// Debug Visualization Helpers
// ============================================

/**
 * Generate debug color based on Z-depth
 * Blue (far) → Green (medium) → Red (near)
 */
export function getDepthDebugColor(zValue: number): string {
  // Normalize z to 0-1 range (assuming typical pose Z range)
  const normalized = Math.max(0, Math.min(1, zValue + 0.5));
  
  if (normalized < 0.5) {
    // Blue to Green
    const green = Math.round(255 * (normalized / 0.5));
    return `rgb(0, ${green}, 255)`;
  } else {
    // Green to Red
    const red = Math.round(255 * ((normalized - 0.5) / 0.5));
    const green = Math.round(255 * (1 - (normalized - 0.5) / 0.5));
    return `rgb(${red}, ${green}, 0)`;
  }
}

/**
 * Log depth rendering status
 */
export function logDepthStatus(): void {
  const capabilities = getDeviceCapabilities();
  const config = getCurrentDepthConfig();
  const metrics = getDepthMetricsTracker().getMetrics();
  
  console.group('[Depth Rendering Status]');
  console.log('Device:', capabilities.deviceType, `(${capabilities.gpu})`);
  console.log('Depth Sorting:', config.enableDepthSorting ? 'Enabled' : 'Disabled');
  console.log('Occlusion:', config.enableOcclusion ? 'Enabled' : 'Disabled');
  console.log('Cache Hit Rate:', `${metrics.cacheHitRate.toFixed(1)}%`);
  console.log('Avg Sort Time:', `${metrics.avgSortTimeMs.toFixed(2)}ms`);
  console.log('Max Sort Time:', `${metrics.maxSortTimeMs.toFixed(2)}ms`);
  console.groupEnd();
}
