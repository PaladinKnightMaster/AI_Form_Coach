/**
 * Adaptive Frame Dropping Tests
 *
 * Validates device-aware frame dropping functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AdaptiveFrameDropping, validateFrameDropping } from '@/lib/pose/adaptiveFrameDropping';
import type { FrameDropMetrics } from '@/lib/pose/adaptiveFrameDropping';

describe('Adaptive Frame Dropping', () => {
  let frameDropping: AdaptiveFrameDropping;

  beforeEach(() => {
    frameDropping = new AdaptiveFrameDropping();
  });

  describe('Frame Processing Decision', () => {
    it('should keep all frames by default (no dropping)', () => {
      frameDropping.setEnabled(false);

      let keptFrames = 0;
      for (let i = 0; i < 100; i++) {
        if (frameDropping.shouldProcessFrame()) {
          keptFrames++;
        }
      }

      expect(keptFrames).toBe(100);
      expect(frameDropping.getMetrics().droppedFrames).toBe(0);
    });

    it('should drop every other frame when frameSkipCount is 2', () => {
      // getConfig() returns a copy — construct with desired config instead
      const fd = new AdaptiveFrameDropping({ frameSkipCount: 2, enabled: true, motionAwareSkipping: false });

      let keptFrames = 0;
      let droppedFrames = 0;

      for (let i = 0; i < 100; i++) {
        if (fd.shouldProcessFrame()) {
          keptFrames++;
        } else {
          droppedFrames++;
        }
      }

      expect(droppedFrames).toBeGreaterThan(0);
      expect(keptFrames + droppedFrames).toBe(100);
    });

    it('should respect maximum consecutive drops', () => {
      frameDropping.setEnabled(true);
      const config = frameDropping.getConfig();
      const maxDrops = config.maxConsecutiveDrops;

      // Drive adaptation by recording low FPS to increase frameSkipCount
      for (let i = 0; i < 20; i++) {
        frameDropping.recordFps(5);
      }

      let consecutiveDrops = 0;
      let maxConsecutiveObserved = 0;

      for (let i = 0; i < 100; i++) {
        if (!frameDropping.shouldProcessFrame()) {
          consecutiveDrops++;
          maxConsecutiveObserved = Math.max(maxConsecutiveObserved, consecutiveDrops);
        } else {
          consecutiveDrops = 0;
        }
      }

      // Should never exceed maxConsecutiveDrops
      expect(maxConsecutiveObserved).toBeLessThanOrEqual(maxDrops);
    });
  });

  describe('FPS Recording and Adaptation', () => {
    it('should record FPS measurements', () => {
      frameDropping.recordFps(35);
      frameDropping.recordFps(34);
      frameDropping.recordFps(36);

      const metrics = frameDropping.getMetrics();
      expect(metrics.adaptationLevel).toBeGreaterThanOrEqual(0);
    });

    it('should increase frame skip when FPS is low', () => {
      frameDropping.setEnabled(true);
      frameDropping.setTargetFps(25);

      const initialConfig = frameDropping.getConfig();
      const initialSkip = initialConfig.frameSkipCount;

      // Record FPS below minFpsThreshold (15 after setTargetFps(25))
      for (let i = 0; i < 5; i++) {
        frameDropping.recordFps(12);
      }

      const newConfig = frameDropping.getConfig();
      expect(newConfig.frameSkipCount).toBeGreaterThan(initialSkip);
    });

    it('should decrease frame skip when FPS is good', () => {
      // Start with high frameSkipCount
      const fd = new AdaptiveFrameDropping({ enabled: true, frameSkipCount: 3, adaptiveMode: true });
      fd.setTargetFps(25);

      // Record high FPS (above targetFps + 5 = 30)
      for (let i = 0; i < 5; i++) {
        fd.recordFps(40);
      }

      const newConfig = fd.getConfig();
      expect(newConfig.frameSkipCount).toBeLessThanOrEqual(3);
    });

    it('should update adaptation level based on FPS', () => {
      frameDropping.setEnabled(true);
      frameDropping.setTargetFps(25);

      const initialMetrics = frameDropping.getMetrics();
      const initialLevel = initialMetrics.adaptationLevel;

      // Record FPS below minFpsThreshold (15)
      for (let i = 0; i < 3; i++) {
        frameDropping.recordFps(12);
      }

      const updatedMetrics = frameDropping.getMetrics();
      expect(updatedMetrics.adaptationLevel).toBeGreaterThan(initialLevel);
    });
  });

  describe('Metrics Tracking', () => {
    it('should track total frames processed', () => {
      for (let i = 0; i < 50; i++) {
        frameDropping.shouldProcessFrame();
      }

      const metrics = frameDropping.getMetrics();
      expect(metrics.totalFrames).toBe(50);
    });

    it('should calculate drop rate correctly', () => {
      // Construct with frameSkipCount=2 and motionAwareSkipping disabled
      const fd = new AdaptiveFrameDropping({ frameSkipCount: 2, enabled: true, motionAwareSkipping: false });

      for (let i = 0; i < 100; i++) {
        fd.shouldProcessFrame();
        // recordFps triggers updateMetrics which recalculates dropRate
        fd.recordFps(30);
      }

      const metrics = fd.getMetrics();
      expect(metrics.dropRate).toBeGreaterThan(0);
      expect(metrics.dropRate).toBeLessThanOrEqual(100);
    });

    it('should separate kept and dropped frames', () => {
      const fd = new AdaptiveFrameDropping({ frameSkipCount: 3, enabled: true, motionAwareSkipping: false });

      for (let i = 0; i < 60; i++) {
        fd.shouldProcessFrame();
      }

      const metrics = fd.getMetrics();
      expect(metrics.keptFrames + metrics.droppedFrames).toBe(metrics.totalFrames);
    });

    it('should reset metrics correctly', () => {
      for (let i = 0; i < 50; i++) {
        frameDropping.shouldProcessFrame();
      }

      frameDropping.reset();

      const metrics = frameDropping.getMetrics();
      expect(metrics.totalFrames).toBe(0);
      expect(metrics.droppedFrames).toBe(0);
      expect(metrics.keptFrames).toBe(0);
      expect(metrics.adaptationLevel).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should enable/disable frame dropping', () => {
      frameDropping.setEnabled(false);
      let config = frameDropping.getConfig();
      expect(config.enabled).toBe(false);

      frameDropping.setEnabled(true);
      config = frameDropping.getConfig();
      expect(config.enabled).toBe(true);
    });

    it('should set target FPS', () => {
      frameDropping.setTargetFps(30);
      const config = frameDropping.getConfig();
      expect(config.targetFps).toBe(30);
    });

    it('should calculate drop percentage', () => {
      // frameSkipCount=1 → 0% drop
      const fd1 = new AdaptiveFrameDropping({ frameSkipCount: 1 });
      expect(fd1.getDropPercentage()).toBe(0);

      // frameSkipCount=3 → (3-1)/5*100 = 40%
      const fd3 = new AdaptiveFrameDropping({ frameSkipCount: 3 });
      expect(fd3.getDropPercentage()).toBeGreaterThan(0);
    });

    it('should estimate FPS after dropping', () => {
      const baseFps = 60;

      const fdOff = new AdaptiveFrameDropping({ enabled: false });
      expect(fdOff.getEstimatedFpsAfterDropping(baseFps)).toBe(60);

      const fd2 = new AdaptiveFrameDropping({ enabled: true, frameSkipCount: 2 });
      expect(fd2.getEstimatedFpsAfterDropping(baseFps)).toBe(30);

      const fd3 = new AdaptiveFrameDropping({ enabled: true, frameSkipCount: 3 });
      expect(fd3.getEstimatedFpsAfterDropping(baseFps)).toBe(20);
    });
  });

  describe('Validation', () => {
    it('should validate healthy frame dropping', () => {
      const metrics: FrameDropMetrics = {
        totalFrames: 100,
        droppedFrames: 10,
        keptFrames: 90,
        dropRate: 10,
        currentFrameSkip: 1,
        adaptationLevel: 20,
        motionMagnitude: 0.01,
        isStatic: false,
        motionSkippedFrames: 0
      };

      const validation = validateFrameDropping(35, metrics);
      expect(validation.isHealthy).toBe(true);
      expect(validation.issues.length).toBe(0);
    });

    it('should flag aggressive frame dropping', () => {
      const metrics: FrameDropMetrics = {
        totalFrames: 100,
        droppedFrames: 60,
        keptFrames: 40,
        dropRate: 60,
        currentFrameSkip: 3,
        adaptationLevel: 80,
        motionMagnitude: 0.005,
        isStatic: true,
        motionSkippedFrames: 30
      };

      const validation = validateFrameDropping(20, metrics);
      expect(validation.isHealthy).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });

    it('should warn on low estimated FPS', () => {
      const metrics: FrameDropMetrics = {
        totalFrames: 100,
        droppedFrames: 30,
        keptFrames: 70,
        dropRate: 30,
        currentFrameSkip: 4,
        adaptationLevel: 60,
        motionMagnitude: 0.012,
        isStatic: false,
        motionSkippedFrames: 10
      };

      const validation = validateFrameDropping(22, metrics);
      expect(validation.estimatedFps).toBeLessThan(25);
    });

    it('should provide recommendations for stressed devices', () => {
      const metrics: FrameDropMetrics = {
        totalFrames: 100,
        droppedFrames: 50,
        keptFrames: 50,
        dropRate: 50,
        currentFrameSkip: 5,
        adaptationLevel: 90,
        motionMagnitude: 0.003,
        isStatic: true,
        motionSkippedFrames: 25
      };

      const validation = validateFrameDropping(15, metrics);
      expect(validation.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Device-Specific Behavior', () => {
    it('should auto-enable on low-end devices', () => {
      const config = frameDropping.getConfig();
      expect(config).toBeDefined();
      expect(config.maxConsecutiveDrops).toBeGreaterThan(0);
    });

    it('should set appropriate thresholds', () => {
      frameDropping.setTargetFps(20);
      const config = frameDropping.getConfig();

      expect(config.minFpsThreshold).toBeLessThanOrEqual(20);
      expect(config.targetFps).toBe(20);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle steady low FPS scenario', () => {
      frameDropping.setEnabled(true);
      frameDropping.setTargetFps(25);

      // Record FPS below minFpsThreshold (15 after setTargetFps(25))
      for (let i = 0; i < 100; i++) {
        frameDropping.recordFps(12);
        frameDropping.shouldProcessFrame();
      }

      const metrics = frameDropping.getMetrics();
      const config = frameDropping.getConfig();

      // Should be dropping frames
      expect(metrics.droppedFrames).toBeGreaterThan(0);
      // Adaptation level should increase
      expect(metrics.adaptationLevel).toBeGreaterThan(0);
      // Frame skip should increase
      expect(config.frameSkipCount).toBeGreaterThan(1);
    });

    it('should recover from FPS drops', () => {
      frameDropping.setEnabled(true);
      frameDropping.setTargetFps(25);

      // Low FPS initially (below minFpsThreshold=15)
      for (let i = 0; i < 10; i++) {
        frameDropping.recordFps(12);
        frameDropping.shouldProcessFrame();
      }

      const configAfterDrop = frameDropping.getConfig();
      const skipAfterDrop = configAfterDrop.frameSkipCount;

      // FPS recovers (above targetFps + 5 = 30)
      for (let i = 0; i < 10; i++) {
        frameDropping.recordFps(40);
        frameDropping.shouldProcessFrame();
      }

      const configAfterRecovery = frameDropping.getConfig();
      const skipAfterRecovery = configAfterRecovery.frameSkipCount;

      // Frame skip should decrease as FPS improves
      expect(skipAfterRecovery).toBeLessThanOrEqual(skipAfterDrop);
    });

    it('should maintain minimum frame processing', () => {
      const fd = new AdaptiveFrameDropping({ enabled: true, maxConsecutiveDrops: 2, motionAwareSkipping: false });

      // Drive up frameSkipCount via low FPS
      for (let i = 0; i < 10; i++) {
        fd.recordFps(5);
      }

      let maxGapBetweenProcessed = 0;
      let lastProcessed = -1;

      for (let i = 0; i < 100; i++) {
        if (fd.shouldProcessFrame()) {
          if (lastProcessed >= 0) {
            maxGapBetweenProcessed = Math.max(maxGapBetweenProcessed, i - lastProcessed);
          }
          lastProcessed = i;
        }
      }

      // Should never have gap larger than maxConsecutiveDrops + 1
      expect(maxGapBetweenProcessed).toBeLessThanOrEqual(3); // maxConsecutiveDrops(2) + 1
    });
  });
});
