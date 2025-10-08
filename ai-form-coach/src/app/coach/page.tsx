"use client";
import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PoseEngine2, type PoseEstimateResult, type Landmark3D } from '@/lib/pose/engine';
import { createValidator } from '@/lib/validators';
import type { Exercise, RepMetric, ValidatorConfig } from '@/lib/validators/types';
import { speak, setMuted, ensureSpeechReady } from '@/lib/voice/coachVoice';
import PoseOverlay from '@/components/PoseOverlay';
import HUD from '@/components/HUD';
import { enqueueWrite, flushWrites, getPendingCount } from '@/lib/storage/offlineQueue';
import TutorialOverlay from '@/components/TutorialOverlay';
import CalibrationModal from '@/components/CalibrationModal';
import { loadExerciseThresholds } from '@/lib/calibration';
import SafetyChecklist from '@/components/SafetyChecklist';
import Link from 'next/link';
import { Button, Icon, Card } from '@/ui/DS';
import WelcomeToast from '@/components/WelcomeToast';
import FirstRunTutorial from '@/components/FirstRunTutorial';
import ProgressionIntegration from '@/components/progression/ProgressionIntegration';
import HealthStatusWidget from '@/components/health/HealthStatusWidget';
import PlanAdjustmentBanner from '@/components/plans/PlanAdjustmentBanner';
import type { WorkoutTarget, ReadinessAssessment } from '@/lib/progression/engine';
import { type FormIQMetrics } from '@/lib/validators/formIQ';
import type { UserPlan } from '@/types/plans';

function CoachContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [landmarks, setLandmarks] = useState<Landmark3D[] | null>(null);
	const [exercise, setExercise] = useState<Exercise>('squat');
	const [currentPlan, setCurrentPlan] = useState<{ id: string; name: string } | null>(null);
	const [activePlan, setActivePlan] = useState<UserPlan | null>(null);
	const [, setProgressionTarget] = useState<WorkoutTarget | null>(null);
	const [readinessAssessment, setReadinessAssessment] = useState<ReadinessAssessment | null>(null);
	const [running, setRunning] = useState(false);
	const [saving, setSaving] = useState(false);
	const [repCount, setRepCount] = useState(0);
	const repMetricsRef = useRef<RepMetric[]>([]);
	const [cue, setCue] = useState('');
	const [spark, setSpark] = useState<number[]>([]);
	const engineRef = useRef<PoseEngine2 | null>(null);
	const validatorRef = useRef(createValidator(exercise));
	
	// New PoseEngine2 state
	const [visibilityScore, setVisibilityScore] = useState<number>(1);
	const [, setBestSide] = useState<'left' | 'right'>('right'); // bestSide tracked for future use
	const poseLoopRef = useRef<number | null>(null);
	const [startTs, setStartTs] = useState<number | null>(null);
	const [muted, updateMuted] = useState(false);
	const flushTimerRef = useRef<number | null>(null);
	const [countdown, setCountdown] = useState<number | null>(null);
	const wakeLockRef = useRef<{ release?: () => Promise<void> } | null>(null);
	const [quality, setQuality] = useState<'good' | 'warn' | 'bad'>('good');
	
	// Welcome and first-run tutorial states
	const [showWelcome, setShowWelcome] = useState(false);
	const [showFirstRun, setShowFirstRun] = useState(false);
	const lowQualityFramesRef = useRef(0);
	const [pausedByQuality, setPausedByQuality] = useState(false);
	const [largeText, setLargeText] = useState(false);
	const [highContrast, setHighContrast] = useState(false);
	const [goalType, setGoalType] = useState<'none' | 'reps' | 'time'>('none');
	const [goalValue, setGoalValue] = useState<number>(10);
	const [elapsedMs, setElapsedMs] = useState(0);
	const elapsedTimerRef = useRef<number | null>(null);
	const [restLeft, setRestLeft] = useState<number | null>(null);
	const restTimerRef = useRef<number | null>(null);
	const [showTutorial, setShowTutorial] = useState(false);
	const [showCalib, setShowCalib] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const repsAtGoalRef = useRef<number>(0);
	const [fps, setFps] = useState(0);
	const [thrCfg, setThrCfg] = useState<ValidatorConfig>({ debounceFrames: 3 });
	const [pillCues, setPillCues] = useState<string[]>([]);
	const lastCueAtRef = useRef(0);
	// AMRAP/EMOM presets (currently not used)
	// const [template, setTemplate] = useState<'custom'|'amrap_2'|'emom_5'|'tabata'>('custom');
	const [offline, setOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
	const [pending, setPending] = useState(0);
	// const [cameraError, setCameraError] = useState<string | null>(null);
	const [showSafety, setShowSafety] = useState(false);
	const [formIQMetrics, setFormIQMetrics] = useState<FormIQMetrics | null>(null);
	// Track average pose visibility for quality
	const visSumRef = useRef(0);
	const visCountRef = useRef(0);
	// One-time safety bypass after agreeing in the modal (without persisting)
	const safetyBypassRef = useRef(false);

	function onGoalTypeChange(val: string) { if (val === 'none' || val === 'reps' || val === 'time') setGoalType(val); }

	const rateLimitedCue = useCallback((newCue: string) => {
		const now = performance.now();
		if (now - lastCueAtRef.current < 1500) return; // 1.5s throttle
		lastCueAtRef.current = now; setCue(newCue);
		if (!muted) speak(newCue);
	}, [muted]);

	function updatePillsFrom(s: { cues: string[] }) {
		setPillCues(s.cues.slice(1, 3));
	}

	// useEffect(() => { setTemplate(template); }, [template]);

	useEffect(() => { setMuted(muted); }, [muted]);

	// Load plan data function
	const loadPlanData = useCallback(async (planId: string) => {
		try {
			const response = await fetch(`/api/plans/user?id=${planId}`);
			if (response.ok) {
				const plan = await response.json();
				setActivePlan(plan);
			}
		} catch (error) {
			console.error('Error loading plan data:', error);
		}
	}, []);

	// Handle welcome message and first-run tutorial
	useEffect(() => {
		// Show welcome toast if coming from auth
		const welcome = searchParams.get('welcome');
		if (welcome === 'true') {
			setShowWelcome(true);
			// Remove the query param from URL without reload
			window.history.replaceState({}, '', '/coach');
		}

		// Handle plan parameters
		const planId = searchParams.get('planId');
		const planName = searchParams.get('planName');
		if (planId && planName) {
			setCurrentPlan({ id: planId, name: decodeURIComponent(planName) });
			loadPlanData(planId);
			// Remove the query params from URL without reload
			const url = new URL(window.location.href);
			url.searchParams.delete('planId');
			url.searchParams.delete('planName');
			window.history.replaceState({}, '', url.toString());
		}
		
		// Show first-run tutorial if not seen before
		try { 
			if (!localStorage.getItem('afc_first_run_seen')) {
				// Delay tutorial to show after welcome toast
				setTimeout(() => setShowFirstRun(true), welcome === 'true' ? 2000 : 500);
			}
		} catch {} 
		
		// Original tutorial logic
		try { if (!localStorage.getItem('afc_tutorial_seen')) setShowTutorial(true); } catch {		}
	}, [searchParams, loadPlanData]);

	// Progression handlers
	const handleProgressionTargetUpdate = (target: WorkoutTarget) => {
		setProgressionTarget(target);
		// Auto-set goals based on progression target
		if (target.targetReps) {
			setGoalType('reps');
			setGoalValue(target.targetReps);
		} else if (target.targetTimeSeconds) {
			setGoalType('time');
			setGoalValue(target.targetTimeSeconds);
		}
	};

	const handleReadinessUpdate = (readiness: ReadinessAssessment | null) => {
		setReadinessAssessment(readiness);
	};

	const handlePlanUpdate = useCallback((updatedPlan: UserPlan) => {
		setActivePlan(updatedPlan);
	}, []);

	// Keyboard help opener
	const onHelpKey = useCallback((e: KeyboardEvent) => { if (e.key === '?') setShowHelp(true); }, []);
	useEffect(() => { window.addEventListener('keydown', onHelpKey); return () => window.removeEventListener('keydown', onHelpKey); }, [onHelpKey]);
	useEffect(() => { const update = () => setOffline(!navigator.onLine); window.addEventListener('online', update); window.addEventListener('offline', update); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); }; }, []);
	useEffect(() => { getPendingCount().then(setPending).catch(() => setPending(0)); }, [saving, running]);

	// Load thresholds (all exercises) once, and reload after calibration
	async function reloadThresholds() {
		const [sq, pu, pl] = await Promise.all([
			loadExerciseThresholds('squat'),
			loadExerciseThresholds('pushup'),
			loadExerciseThresholds('plank'),
		]);
		setThrCfg({ debounceFrames: 3, squat: sq?.squat, pushup: pu?.pushup, plank: pl?.plank });
	}
	useEffect(() => { reloadThresholds(); }, []);

	// memoized handlers and key listener
	const handleStartPause = useCallback(() => {
		if (running) { setRunning(false); return; }
		try {
			if (!localStorage.getItem('afc_safety_ok') && !safetyBypassRef.current) { setShowSafety(true); return; }
		} catch {
			if (!safetyBypassRef.current) { setShowSafety(true); return; }
		}
		setCountdown(3); 
		vibrate(30); 
		let left = 3; 
		const iv = setInterval(() => { 
			left -= 1; 
			setCountdown(left); 
			if (left <= 0) { 
				clearInterval(iv); 
				setCountdown(null); 
				setElapsedMs(0); 
				ensureSpeechReady(); 
				setRunning(true); 
				safetyBypassRef.current = false; 
				vibrate(60); 
				import('@/lib/observability/events')
					.then(m => m.logEvent('session_started', { exercise }))
					.catch(err => console.warn('Failed to log session start:', err)); 
			} 
		}, 1000);
	}, [running, exercise]);
	const undoLastRep = useCallback(() => { if (repMetricsRef.current.length === 0 || repCount === 0) return; const last = repMetricsRef.current[repMetricsRef.current.length - 1]; if (last) last.valid = false; setRepCount((c) => Math.max(0, c - 1)); import('@/lib/observability/events').then(m => m.logEvent('undo_used', { exercise })).catch(()=>{}); }, [repCount, exercise]);
	const startRest = useCallback((seconds: number) => { setRunning(false); setRestLeft(seconds); import('@/lib/observability/events').then(m => m.logEvent('rest_started', { seconds, exercise })).catch(()=>{}); if (restTimerRef.current) window.clearInterval(restTimerRef.current); restTimerRef.current = window.setInterval(() => { setRestLeft((v) => { const next = (v ?? 0) - 1; if (next <= 0) { window.clearInterval(restTimerRef.current!); restTimerRef.current = null; speak('Rest over'); return null; } return next; }); }, 1000); }, [exercise]);
	const onKey = useCallback((e: KeyboardEvent) => {
		if (e.code === 'Space') { e.preventDefault(); handleStartPause(); }
		if (e.key === '1') setExercise('squat');
		if (e.key === '2') setExercise('pushup');
		if (e.key === '3') setExercise('plank');
		if (e.key.toLowerCase() === 'u') undoLastRep();
		if (e.key === '?') setShowHelp(true);
		if (e.key.toLowerCase() === 'r') startRest(60);
	}, [handleStartPause, undoLastRep, startRest]);
	useEffect(() => { window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onKey]);

	// onPose function wrapped in useCallback
	const onPose = useCallback(async (lms: Landmark3D[], result: PoseEstimateResult) => {
		const ts = performance.now();
		const avgVis = result.visibilityScore;
		
		// Track average visibility for session stats
		if (running) { 
			visSumRef.current += avgVis; 
			visCountRef.current += 1; 
		}
		
		// Update quality indicator based on visibility
		if (avgVis > 0.7) { 
			setQuality('good'); 
		}
		else if (avgVis > 0.55) { 
			setQuality('warn'); 
		}
		else { 
			setQuality('bad'); 
		}
		
		// Log low visibility event
		if (lowQualityFramesRef.current === 45 && running) { 
			import('@/lib/observability/events').then(m => m.logEvent('pose_quality_low', { avgVis })).catch(()=>{}); 
		}
		
		// Pass pose result to validator (handle async validators)
		const validatorResult = validatorRef.current(result, ts, { ...thrCfg, bestSide: result.bestSide });
		const s = validatorResult instanceof Promise ? await validatorResult : validatorResult;
		if (s.metrics.length > repMetricsRef.current.length) vibrate(20);
		// goal met haptic
		if (goalType === 'reps' && repCount >= goalValue && repsAtGoalRef.current === 0) { vibrate(120); repsAtGoalRef.current = repCount; import('@/lib/observability/events').then(m => m.logEvent('goal_met', { goalType, goalValue, repCount })).catch(()=>{}); }
		setRepCount(s.repCount);
		if (s.metrics.length && repMetricsRef.current.length < s.metrics.length) {
			const latest = s.metrics[s.metrics.length - 1];
			repMetricsRef.current = s.metrics; setLandmarks(lms);
			rateLimitedCue(s.cues[0] || ''); updatePillsFrom(s);
			import('@/lib/observability/events').then(m => m.logEvent('rep_completed', { exercise, repCount: s.repCount, peakDepth: latest.peakDepth, peakAngle: latest.peakAngle })).catch(()=>{});
		}
		if (s.cues.length > 0) { setSpark(s.cues.map((_c, i) => performance.now() + i * 10)); }
		
		// Update FormIQ metrics if available
		if (s.metrics.length > 0) {
			const latestMetric = s.metrics[s.metrics.length - 1];
			if (latestMetric.formIQ !== undefined) {
				setFormIQMetrics({
					formIQ: latestMetric.formIQ,
					sideBalance: latestMetric.sideBalance ?? 0.5,
					rangeOfMotion: 0.85, // Placeholder until ROM calculation is added
					tempo: 0.90, // Placeholder until tempo calculation is added
					stability: 0.88 // Placeholder until stability calculation is added
				});
			}
		}
	}, [running, goalType, goalValue, repCount, exercise, thrCfg, rateLimitedCue]);

	// Async pose estimation loop for PoseEngine2
	const startPoseLoop = useCallback(async () => {
		const loop = async () => {
			const video = videoRef.current;
			const engine = engineRef.current;
			
			if (!video || !engine || !running) {
				return;
			}
			
			try {
				const result = await engine.estimate(video);
				
				if (result) {
					// Update visibility and side info
					setVisibilityScore(result.visibilityScore);
					setBestSide(result.bestSide);
					setFps(result.fps);
					
					// Visibility gating - only process frames with good visibility
					if (result.visibilityScore >= 0.55) {
						// Process pose with good visibility
						await onPose(result.landmarks, result);
						
						// Reset low quality counter on good frames
						if (result.visibilityScore > 0.7) {
							lowQualityFramesRef.current = 0;
							setPausedByQuality(false);
						}
					} else {
						// Low visibility - don't process frame for FSM
						lowQualityFramesRef.current++;
						
						// Auto-pause after sustained low visibility
						if (lowQualityFramesRef.current > 45 && running) {
							setRunning(false);
							setPausedByQuality(true);
							return;
						}
					}
				}
			} catch (error) {
				console.error('Pose estimation error:', error);
			}
			
			// Continue loop if still running
			if (running) {
				poseLoopRef.current = requestAnimationFrame(loop);
			}
		};
		
		// Start the loop
		poseLoopRef.current = requestAnimationFrame(loop);
	}, [running, onPose]);

	useEffect(() => {
		let active = true; let stream: MediaStream | null = null;
		(async () => {
			const cached = localStorage.getItem('afc_model') as ('lite'|'full'|null);
			
			// Initialize PoseEngine2
			const engine = new PoseEngine2({
				model: (cached as 'lite' | 'full') ?? 'lite',
				smoothingAlpha: 0.4,
				visibilityThreshold: 0.55,
				debounceFrames: 3
			});
			
			try {
				await engine.init();
			} catch (err) {
				console.error('Failed to initialize PoseEngine2:', err);
				import('@/lib/observability/sentry').then(({ Sentry }) => { try { Sentry.captureException(err); } catch {} }).catch(() => {});
			}
			
			// Get camera stream
			try {
				stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
			} catch (err) {
				import('@/lib/observability/sentry').then(({ Sentry }) => { try { Sentry.captureException(err); } catch {} }).catch(() => {});
				// setCameraError('Camera permission blocked or no camera found. Enable camera in your browser settings.');
				return;
			}
			
			const video = videoRef.current;
			if (!video) return;
			
			// Set video source and wait for ready
			if (video.srcObject !== stream) { 
				video.srcObject = stream; 
			}
			
			await new Promise<void>((resolve) => { 
				if (!video) return resolve(); 
				if (video.readyState >= 2) return resolve(); 
				const handler = () => { 
					video.removeEventListener('loadedmetadata', handler); 
					resolve(); 
				}; 
				video.addEventListener('loadedmetadata', handler); 
			});
			
			if (!active || !video) return;
			
			try { 
				await video.play(); 
			} catch (err) { 
				import('@/lib/observability/sentry').then(({ Sentry }) => { try { Sentry.captureException(err); } catch {} }).catch(() => {}); 
			}
			
			// Store engine reference
			engineRef.current = engine;
		})();
		
		return () => { 
			active = false; 
			
			// Stop pose loop
			if (poseLoopRef.current) {
				cancelAnimationFrame(poseLoopRef.current);
				poseLoopRef.current = null;
			}
			
			// Dispose engine
			if (engineRef.current) {
				engineRef.current.dispose();
				engineRef.current = null;
			}
			
			// Stop camera stream
			if (stream) { 
				for (const t of stream.getTracks()) t.stop(); 
			}
			
			// Release wake lock
			if (wakeLockRef.current) { 
				try { wakeLockRef.current.release?.(); } catch {} 
			} 
		};
	}, []);

	useEffect(() => {
		if (running) {
			setStartTs(performance.now());
			visSumRef.current = 0;
			visCountRef.current = 0;
			
			// Start pose loop
			(async () => {
				await startPoseLoop();
			})();
			
			// Request wake lock
			const wlApi = (navigator as unknown as { wakeLock?: { request: (type: 'screen') => Promise<{ release?: () => Promise<void> }> } }).wakeLock;
			wlApi?.request('screen').then((s) => { wakeLockRef.current = s; }).catch(() => {});
			
			// Start elapsed timer
			elapsedTimerRef.current = window.setInterval(() => setElapsedMs((v) => v + 1000), 1000);
		} else {
			// Stop pose loop
			if (poseLoopRef.current) {
				cancelAnimationFrame(poseLoopRef.current);
				poseLoopRef.current = null;
			}
			
			// Release wake lock
			if (wakeLockRef.current) {
				try { wakeLockRef.current.release?.(); } catch {}
			}
			
			// Stop elapsed timer
			if (elapsedTimerRef.current) {
				window.clearInterval(elapsedTimerRef.current);
				elapsedTimerRef.current = null;
			}
		}
	}, [running, startPoseLoop]);

	useEffect(() => { if (running) { flushTimerRef.current = window.setInterval(() => { flushWrites(); }, 10_000); return () => { if (flushTimerRef.current) window.clearInterval(flushTimerRef.current); flushTimerRef.current = null; }; } }, [running]);

	function vibrate(ms: number) { try { navigator.vibrate?.(ms); } catch {} }
	function goalSubtext(): string | undefined { if (goalType === 'reps') return `${repCount}/${goalValue} reps`; if (goalType === 'time') return `${Math.floor(elapsedMs/1000)}s / ${goalValue}s`; return undefined; }
	async function endSession() {
		setRunning(false); setSaving(true);
		const endTs = performance.now(); const start = startTs ?? endTs;
		const { getCurrentUserId } = await import('@/lib/supabase/client');
		const userId = await getCurrentUserId();
		let rpe: number | null = null;
		try {
			const val = prompt('How hard was that? RPE 1-10 (optional)');
			if (val) { const n = Math.max(1, Math.min(10, parseInt(val, 10))); if (!Number.isNaN(n)) rpe = n; }
		} catch {}
		const model = (() => { try { return localStorage.getItem('afc_model') ?? 'lite'; } catch { return 'lite'; } })();
		const device_info = { ua: navigator.userAgent, viewport: { w: window.innerWidth, h: window.innerHeight }, model };
		const avg_pose_quality = visCountRef.current ? (visSumRef.current / visCountRef.current) : null;
		const total_valid_reps = repMetricsRef.current.filter(r => r.valid !== false).length;
		
		// Calculate enhanced session metrics
		const { calculateSessionMetrics } = await import('@/lib/validators/sessionAnalysis');
		const { sessionSummaryToDatabase, repMetricsToDatabase } = await import('@/lib/validators/databaseUtils');
		
		const sessionSummary = calculateSessionMetrics(repMetricsRef.current);
		const enhancedSessionData = sessionSummaryToDatabase(sessionSummary, {
			user_id: userId || '',
			exercise,
			started_at: new Date(start).toISOString(),
			ended_at: new Date(endTs).toISOString(),
			goal_type: goalType === 'none' ? undefined : goalType,
			goal_value: goalType === 'none' ? undefined : goalValue,
			rpe: rpe || undefined,
			device_info,
			avg_pose_quality: avg_pose_quality || undefined
		});
		
		// Save enhanced session data
		await enqueueWrite({ table: 'sessions', payload: enhancedSessionData as unknown as Record<string, unknown> });
		
		// Save enhanced rep data
		const enhancedRepData = repMetricsToDatabase(repMetricsRef.current, 'PENDING');
		for (const r of enhancedRepData) { 
			await enqueueWrite({ table: 'reps', payload: r as unknown as Record<string, unknown> }); 
		}
		
		await flushWrites(); 
		setSaving(false); 
		
		// Show enhanced session summary
		const { getImprovementRecommendations } = await import('@/lib/validators/sessionAnalysis');
		const recommendations = getImprovementRecommendations(sessionSummary);
		const summaryMessage = `Session completed!\n\nQuality: ${sessionSummary.averageQuality.toFixed(1)}/100\nConsistency: ${sessionSummary.consistencyScore.toFixed(1)}/100\nErrors: ${sessionSummary.totalErrors}\n\n${recommendations.length > 0 ? 'Recommendations:\n' + recommendations.join('\n') : 'Great job!'}`;
		alert(summaryMessage);
		
		import('@/lib/observability/events').then(m => m.logEvent('session_ended', { 
			exercise, 
			total_valid_reps, 
			duration_s: Math.round((endTs - start)/1000),
			avg_quality: sessionSummary.averageQuality,
			consistency_score: sessionSummary.consistencyScore,
			total_errors: sessionSummary.totalErrors
		})).catch(()=>{});
	}

	return (
		<div className={`min-h-screen grid grid-rows-[auto_1fr_auto] bg-white dark:bg-gray-900 ${highContrast ? 'contrast-150' : ''}`}>
			<header className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
				<div className="flex items-center gap-2">
					<select value={exercise} onChange={(e) => setExercise(e.target.value as Exercise)} className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"><option value="squat">Squat</option><option value="pushup">Pushup</option><option value="plank">Plank</option></select>
					{currentPlan && (
						<div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
							📋 {currentPlan.name}
						</div>
					)}
					<label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={muted} onChange={(e) => updateMuted(e.target.checked)} className="rounded border-gray-300 dark:border-gray-600" /> Mute</label>
					<label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={largeText} onChange={(e) => setLargeText(e.target.checked)} className="rounded border-gray-300 dark:border-gray-600" /> Large HUD</label>
					<label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} className="rounded border-gray-300 dark:border-gray-600" /> High contrast</label>
					<select onChange={(e) => { localStorage.setItem('afc_model', e.target.value); }} className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"><option value="lite">Lite</option><option value="full">Full</option></select>
				</div>
				<div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
					<span className={`${quality==='good'?'bg-sky-500/30 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300':quality==='warn'?'bg-amber-500/30 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300':'bg-rose-500/30 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'} px-2 py-0.5 rounded`}>{quality}</span>
					<div className="opacity-70">Shortcuts: Space, U undo, R rest 60s, 1/2/3, ? help</div>
				</div>
			</header>

			<main className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4 items-start bg-gray-50 dark:bg-gray-800">
				<div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
					<video ref={videoRef} className="w-full h-full object-contain" playsInline muted />
					<canvas ref={canvasRef} className="absolute inset-0" />
					{videoRef.current && (<PoseOverlay landmarks={landmarks} video={videoRef.current} mirror />)}
					<HUD repCount={repCount} cue={pausedByQuality ? 'Step back into frame' : cue} spark={spark} subtext={`${goalSubtext() ?? ''}${goalSubtext() ? ' • ' : ''}${fps ? fps + ' FPS' : ''}`} large={largeText} pills={pillCues} formIQMetrics={formIQMetrics || undefined} />
					
					{/* Visibility Warning */}
					{running && visibilityScore < 0.55 && (
						<div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500/95 dark:bg-amber-600/95 text-white px-6 py-3 rounded-xl shadow-2xl border-2 border-amber-300 dark:border-amber-400 animate-pulse">
							<div className="flex items-center gap-3">
								<Icon name="alert-triangle" className="w-6 h-6 flex-shrink-0" />
								<div>
									<div className="font-bold text-lg">Low Visibility</div>
									<div className="text-sm opacity-90">Step back or improve lighting</div>
								</div>
								<div className="text-right ml-2">
									<div className="font-mono text-2xl font-bold">{Math.round(visibilityScore * 100)}%</div>
									<div className="text-xs">visibility</div>
								</div>
							</div>
						</div>
					)}
					
					{countdown !== null && (<div className="absolute inset-0 bg-black/40 backdrop-blur grid place-items-center text-white"><div className="text-6xl font-bold">{countdown || 'Go!'}</div></div>)}
					{saving && (<div className="absolute inset-0 bg-black/40 backdrop-blur grid place-items-center text-white"><div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent" /><p className="mt-3">Saving your session…</p></div>)}
					{restLeft !== null && (<div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm border border-gray-200 dark:border-gray-700">Rest: {restLeft}s</div>)}
					{offline && (<div className="absolute bottom-2 left-2 text-xs bg-amber-500/20 dark:bg-amber-500/30 text-amber-800 dark:text-amber-200 rounded px-2 py-1 border border-amber-200 dark:border-amber-800">Offline • {pending} pending <button className="underline ml-1" onClick={() => flushWrites().then(()=>getPendingCount().then(setPending))}>Retry now</button></div>)}
					<div className="absolute bottom-2 right-2 text-xs opacity-80 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 rounded px-2 py-1 border border-gray-200 dark:border-gray-700">Camera stays on your device. We save only rep summaries.</div>
					{showCalib && <CalibrationModal exercise={exercise} landmarks={landmarks} onClose={() => setShowCalib(false)} onSaved={() => { reloadThresholds(); alert('Calibration saved'); }} />}
					{showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
		{showWelcome && (
			<WelcomeToast 
				message="Ready to start your first session? Check out the quick tutorial below!"
				onClose={() => setShowWelcome(false)}
			/>
		)}
		{showFirstRun && (
			<FirstRunTutorial
				open={showFirstRun}
				onClose={() => setShowFirstRun(false)}
				onComplete={() => {
					try {
						localStorage.setItem('afc_first_run_seen', 'true');
					} catch {}
				}}
			/>
		)}
					{showHelp && (
						<div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/60">
							<div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-xl p-4 max-w-md w-full border border-gray-200 dark:border-gray-700">
								<div className="flex items-center justify-between mb-2"><h2 className="text-lg font-semibold">Keyboard shortcuts</h2><button aria-label="Close help" onClick={() => setShowHelp(false)}>×</button></div>
								<ul className="text-sm space-y-1">
									<li><kbd>Space</kbd> start/pause</li>
									<li><kbd>U</kbd> undo last rep</li>
									<li><kbd>R</kbd> rest 60s</li>
									<li><kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd> select exercise</li>
									<li><kbd>?</kbd> this help</li>
								</ul>
							</div>
						</div>
					)}
					{showSafety && <SafetyChecklist open={showSafety} onAgree={() => { safetyBypassRef.current = true; setShowSafety(false); handleStartPause(); }} onClose={() => setShowSafety(false)} />}
				</div>
				<div className="space-y-4 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
					{/* Plan Adjustment Banner */}
					{activePlan && readinessAssessment && (
						<PlanAdjustmentBanner
							plan={activePlan}
							readiness={readinessAssessment}
							currentDay={activePlan.current_day || 1}
							onPlanUpdate={handlePlanUpdate}
						/>
					)}

					{/* Health Status Widget */}
					<HealthStatusWidget
						onOpenHealthDashboard={() => router.push('/health')}
					/>
					
					{/* Progressive Overload Integration */}
					<ProgressionIntegration
						exercise={exercise}
						onTargetUpdate={handleProgressionTargetUpdate}
						onReadinessUpdate={handleReadinessUpdate}
					/>
					
					<Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800" padding="default">
						<div className="flex items-center gap-3 mb-6">
							<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
								<Icon name="target" className="w-5 h-5 text-white" />
							</div>
							<div>
								<h3 className="font-bold text-gray-900 dark:text-white text-lg">Workout Goal</h3>
								<p className="text-sm text-gray-600 dark:text-gray-400">Set your target for this session</p>
							</div>
						</div>
						
						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px]">Type:</label>
								<select 
									value={goalType} 
									onChange={(e) => onGoalTypeChange(e.target.value)} 
									className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
								>
									<option value="none">🎯 Free Form</option>
									<option value="reps">🔢 Target Reps</option>
									<option value="time">⏱️ Target Time</option>
								</select>
							</div>
							
							{goalType !== 'none' && (
								<div className="flex items-center gap-3">
									<label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px]">
										{goalType === 'reps' ? 'Reps:' : 'Seconds:'}
									</label>
									<input 
										aria-label="Goal value" 
										type="number" 
										min={1} 
										value={goalValue} 
										onChange={(e) => setGoalValue(parseInt(e.target.value || '0', 10))} 
										className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
										placeholder={goalType==='time' ? '60' : '20'} 
									/>
								</div>
							)}
							
							<div className="flex items-center gap-3">
								<label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px]">Calibration:</label>
								<Button 
									onClick={() => setShowCalib(true)} 
									className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md"
								>
									<Icon name="settings" className="w-4 h-4" />
									<span>Calibrate Form</span>
								</Button>
							</div>
						</div>
						
						{goalType !== 'none' && (
							<div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
								<div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 mb-2">
									<Icon name="lightbulb" className="w-4 h-4" />
									<span className="font-semibold">Smart Tip:</span>
								</div>
								<p className="text-sm text-blue-600 dark:text-blue-400">
									{goalType === 'reps' 
										? `Aim for ${goalValue} quality reps with perfect form. Quality over quantity!`
										: `Complete ${goalValue} seconds of focused exercise. Maintain steady pace!`
									}
								</p>
							</div>
						)}
					</Card>
					{/* Main Action Button */}
					<Button 
						onClick={handleStartPause} 
						variant={running ? 'destructive' : 'primary'}
						size="xl"
						className="w-full transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
					>
						<Icon name={running ? 'stop' : 'play'} className="w-6 h-6" />
						{running ? 'Pause Session' : 'Start Session'}
					</Button>
					
					{/* Rest Timer Buttons */}
					<div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
						<div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
							<Icon name="clock" className="w-4 h-4" />
							Quick Rest
						</div>
						<div className="grid grid-cols-3 gap-2">
							<Button 
								onClick={() => startRest(30)} 
								className="py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg font-medium transition-all"
							>
								⏱️ 30s
							</Button>
							<Button 
								onClick={() => startRest(60)} 
								className="py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg font-medium transition-all"
							>
								⏱️ 60s
							</Button>
							<Button 
								onClick={() => startRest(90)} 
								className="py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg font-medium transition-all"
							>
								⏱️ 90s
							</Button>
						</div>
					</div>
					
					{/* Secondary Actions */}
					<div className="grid grid-cols-2 gap-3">
						<Button 
							onClick={undoLastRep} 
							className="py-3 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800 text-orange-700 dark:text-orange-300 rounded-lg font-medium transition-all"
						>
							<Icon name="refresh" className="w-4 h-4" />
							Undo Rep
						</Button>
						<Button 
							onClick={endSession} 
							className="py-3 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-lg font-medium transition-all"
						>
							<Icon name="save" className="w-4 h-4" />
							Save & End
						</Button>
					</div>
					{/* Navigation Links */}
					<div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl p-3">
						<div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
							<Icon name="home" className="w-4 h-4" />
							Quick Navigation
						</div>
						<div className="grid grid-cols-2 gap-2">
							<Link 
								href="/health" 
								className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 transition-all transform hover:scale-105"
							>
								<Icon name="activity" className="w-4 h-4" />
								<span className="text-sm font-medium">Health</span>
							</Link>
							<Link 
								href="/history" 
								className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-all transform hover:scale-105"
							>
								<Icon name="bar-chart-2" className="w-4 h-4" />
								<span className="text-sm font-medium">History</span>
							</Link>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

export default function Coach() {
	return (
		<Suspense fallback={
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center space-y-4">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
					<p className="text-sm opacity-70">Loading...</p>
				</div>
			</div>
		}>
			<CoachContent />
		</Suspense>
	);
} 