import { FilesetResolver, PoseLandmarker, type PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { exponentialMovingAverage, type Point3 } from '../math/poseMath';

// MediaPipe WasmFileset interface (not exported from the library)
interface WasmFileset {
  wasmLoaderPath: string;
  wasmBinaryPath: string;
  assetLoaderPath?: string;
  assetBinaryPath?: string;
}

export type PoseModel = 'lite' | 'full';

let landmarker: PoseLandmarker | null = null;
let filesetReady: Promise<unknown> | null = null;

export async function initPose(model: PoseModel = 'lite') {
	if (!filesetReady) {
		filesetReady = FilesetResolver.forVisionTasks(
			process.env.NEXT_PUBLIC_MEDIAPIPE_WASM_URL || 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
		);
	}
	const fileset = await filesetReady;
	landmarker = await PoseLandmarker.createFromOptions(fileset as WasmFileset, {
		baseOptions: {
			modelAssetPath:
				model === 'full'
					? 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task'
					: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
		},
		runningMode: 'VIDEO',
		numPoses: 1,
	});
	return landmarker;
}

export async function estimate(video: HTMLVideoElement): Promise<PoseLandmarkerResult | null> {
	if (!landmarker) {
		try {
			await initPose('lite');
		} catch (err) {
			console.error('Failed to initialize pose detection:', err);
			return null;
		}
	}
	if (!landmarker) return null;
	if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return null;
	const ts = performance.now();
	let res: PoseLandmarkerResult | null = null;
	// Suppress Mediapipe XNNPACK INFO without breaking console in SSR
	const ci = typeof console !== 'undefined' ? console.info : undefined;
	const cw = typeof console !== 'undefined' ? console.warn : undefined;
	const ce = typeof console !== 'undefined' ? console.error : undefined;
	try {
		if (ci && cw && ce) {
			console.info = () => {};
			console.warn = (msg?: unknown, ...rest: unknown[]) => { if (typeof msg === 'string' && msg.includes('TensorFlow Lite XNNPACK delegate')) return; cw.call(console, String(msg), ...rest.map((a) => String(a))); };
			console.error = (msg?: unknown, ...rest: unknown[]) => { if (typeof msg === 'string' && msg.includes('TensorFlow Lite XNNPACK delegate')) return; ce.call(console, String(msg), ...rest.map((a) => String(a))); };
		}
		res = landmarker.detectForVideo(video, ts);
	} catch {
		res = null;
	} finally {
		if (ci) console.info = ci; if (cw) console.warn = cw; if (ce) console.error = ce;
	}
	return res;
}

export type SmoothedLandmark = Point3 & { visibility?: number };
export type PoseListener = (landmarks: SmoothedLandmark[] | null) => void;
export type StatsListener = (stats: { fps: number }) => void;

export class PoseEngine {
	private video: HTMLVideoElement;
	private alpha: number;
	private timerId: number | null = null;
	private last: SmoothedLandmark[] | null = null;
	private listeners = new Set<PoseListener>();
	private statsListeners = new Set<StatsListener>();
	private lastTickTs = 0;
	private fps = 0;
	private intervalMs = 1000 / 30;

	constructor(video: HTMLVideoElement, alpha = 0.5) {
		this.video = video;
		this.alpha = alpha;
	}

	subscribe(listener: PoseListener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
	subscribeStats(listener: StatsListener) { this.statsListeners.add(listener); return () => this.statsListeners.delete(listener); }
	private emit(data: SmoothedLandmark[] | null) { this.listeners.forEach((l) => l(data)); }
	private emitStats() { this.statsListeners.forEach((l) => l({ fps: this.fps })); }

	start() {
		const tick = async () => {
			const now = performance.now();
			if (this.lastTickTs) {
				const dt = now - this.lastTickTs; this.fps = Math.round(1000 / dt); this.emitStats();
				if (this.fps < 15) this.intervalMs = 1000 / 20; else if (this.fps > 25) this.intervalMs = 1000 / 30;
			}
			this.lastTickTs = now;
			const result = await estimate(this.video);
			let output: SmoothedLandmark[] | null = null;
			if (result && result.landmarks && result.landmarks[0]) {
				const curr = result.landmarks[0].map((p) => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility }));
				if (!this.last) { this.last = curr; output = curr; }
				else { output = curr.map((p, i) => ({ x: exponentialMovingAverage(this.last![i].x, p.x, this.alpha), y: exponentialMovingAverage(this.last![i].y, p.y, this.alpha), z: exponentialMovingAverage(this.last![i].z ?? 0, p.z ?? 0, this.alpha), visibility: p.visibility })); this.last = output; }
			}
			this.emit(output);
			this.timerId = window.setTimeout(tick, this.intervalMs);
		};
		if (this.timerId == null) tick();
	}

	stop() { if (this.timerId != null) { clearTimeout(this.timerId); this.timerId = null; } }
}

export { PoseEngine2, createPoseEngine, isLandmarkVisible, getBestSideLandmarks } from './engine';
export type { RunningMode, BestSide, Landmark3D, PoseEstimateResult, PoseEngineOptions, JitterMetrics } from './engine';
export { getFrameTimingTracker, resetFrameTimingTracker, requestVideoFrameSync, cancelVideoFrameSync, FrameDropDetector } from './frameSync';
export type { FrameTimingData, FrameSyncMetrics, AdaptiveQualityConfig } from './frameSync';
export { getWorkerFilteringPool, terminateWorkerFilteringPool } from './workerFilteringPool';
export type { FilterRequest, FilterResult, WorkerMessage } from './workerFilteringPool';
export { detectDeviceCapabilities, getOptimalDepthConfig, getCurrentDepthConfig, getDeviceCapabilities, getDepthMetricsTracker, validateDepthRendering, getDepthDebugColor, logDepthStatus } from './depthOptimization';
export type { DeviceCapabilities, DepthRenderingConfig, DepthMetrics, DepthValidation } from './depthOptimization';
export { MetricsCollector, analyzeMetricsHealth, generateBenchmark, getGlobalMetricsCollector, getCurrentSessionMetrics, recordMetricsSnapshot, resetMetricsCollector, exportMetricsJSON, exportMetricsCSV, logMetricsSummary } from './metricsUtils';
export type { MetricsSnapshot, MetricsSession, HealthStatus, BenchmarkResult } from './metricsUtils';
export { AnalyticsLogger, getGlobalAnalyticsLogger, logAnalyticsMetric, logAnalyticsSessionCompletion, flushAnalytics, getSessionStats, getDeviceBenchmark, getRecentSessions, getHealthTrend } from './analyticsLogger';
export type { PoseQualityMetric, SessionAnalytics, DevicePerformanceBenchmark } from './analyticsLogger';
export { AdaptiveFrameDropping, getGlobalFrameDropping, shouldProcessFrame, recordFrameDropFps, getFrameDropMetrics, getFrameDropConfig, resetFrameDropping, validateFrameDropping, logFrameDropStatus } from './adaptiveFrameDropping';
export type { FrameDropConfig, FrameDropMetrics, FrameDropValidation } from './adaptiveFrameDropping'; 