"use client";
import { useEffect, useRef, useState } from 'react';
import { initPose, PoseEngine, type SmoothedLandmark, type StatsListener } from '@/lib/pose';
import { createValidator } from '@/lib/validators';
import type { Exercise } from '@/lib/validators/types';
import { speak, setMuted } from '@/lib/voice/coachVoice';
import PoseOverlay from '@/components/PoseOverlay';
import HUD from '@/components/HUD';
import { enqueueWrite, flushWrites } from '@/lib/storage/offlineQueue';
import TutorialOverlay from '@/components/TutorialOverlay';
import CalibrationModal from '@/components/CalibrationModal';

export default function Coach() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [landmarks, setLandmarks] = useState<SmoothedLandmark[] | null>(null);
	const [exercise, setExercise] = useState<Exercise>('squat');
	const [running, setRunning] = useState(false);
	const [saving, setSaving] = useState(false);
	const [repCount, setRepCount] = useState(0);
	const repMetricsRef = useRef<{ idx: number; start_ms: number; end_ms: number; peak_depth?: number; rom_score?: number; cues?: string[] }[]>([]);
	const [cue, setCue] = useState('');
	const [spark, setSpark] = useState<number[]>([]);
	const engineRef = useRef<PoseEngine | null>(null);
	const [fps, setFps] = useState(0);
	const validatorRef = useRef(createValidator(exercise));
	const [startTs, setStartTs] = useState<number | null>(null);
	const [muted, updateMuted] = useState(false);
	const flushTimerRef = useRef<number | null>(null);
	const [countdown, setCountdown] = useState<number | null>(null);
	const wakeLockRef = useRef<{ release?: () => Promise<void> } | null>(null);
	const [quality, setQuality] = useState<'good' | 'warn' | 'bad'>('good');
	const lowQualityFramesRef = useRef(0);
	const [pausedByQuality, setPausedByQuality] = useState(false);
	const [largeText, setLargeText] = useState(false);
	const [highContrast, setHighContrast] = useState(false);
	// Goals
	const [goalType, setGoalType] = useState<'none' | 'reps' | 'time'>('none');
	const [goalValue, setGoalValue] = useState<number>(10);
	const [elapsedMs, setElapsedMs] = useState(0);
	const elapsedTimerRef = useRef<number | null>(null);
	// Rest timer
	const [restLeft, setRestLeft] = useState<number | null>(null);
	const restTimerRef = useRef<number | null>(null);
	const [showTutorial, setShowTutorial] = useState(false);
	const [showCalib, setShowCalib] = useState(false);

	function onGoalTypeChange(val: string) {
		if (val === 'none' || val === 'reps' || val === 'time') setGoalType(val);
	}

	useEffect(() => {
		validatorRef.current = createValidator(exercise);
	}, [exercise]);

	useEffect(() => { setMuted(muted); }, [muted]);

	useEffect(() => {
		try { if (!localStorage.getItem('afc_tutorial_seen')) setShowTutorial(true); } catch {}
	}, []);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.code === 'Space') { e.preventDefault(); handleStartPause(); }
			if (e.key === '1') setExercise('squat');
			if (e.key === '2') setExercise('pushup');
			if (e.key === '3') setExercise('plank');
			if (e.key.toLowerCase() === 'u') undoLastRep();
			if (e.key === '?') alert('Shortcuts: Space start/stop, U undo, 1/2/3 select, R rest 60s');
			if (e.key.toLowerCase() === 'r') startRest(60);
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, []);

	useEffect(() => {
		let active = true;
		let stream: MediaStream | null = null;
		(async () => {
			const cached = localStorage.getItem('afc_model') as ('lite'|'full'|null);
			await initPose(cached ?? 'lite');
			stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
			const video = videoRef.current; if (!video) return;
			if (video.srcObject !== stream) { video.srcObject = stream; }
			await new Promise<void>((resolve) => {
				if (!video) return resolve();
				if (video.readyState >= 2) return resolve();
				const handler = () => { video.removeEventListener('loadedmetadata', handler); resolve(); };
				video.addEventListener('loadedmetadata', handler);
			});
			if (!active || !video) return;
			try { await video.play(); } catch {}
			const engine = new PoseEngine(video);
			engineRef.current = engine;
			engine.subscribe(onPose);
			engine.subscribeStats(({ fps }) => setFps(fps));
		})();
		return () => {
			active = false;
			engineRef.current?.stop();
			if (stream) { for (const t of stream.getTracks()) t.stop(); }
			if (wakeLockRef.current) { try { wakeLockRef.current.release?.(); } catch {} }
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (running) {
			setStartTs(performance.now());
			engineRef.current?.start();
			const wlApi = (navigator as unknown as { wakeLock?: { request: (type: 'screen') => Promise<{ release?: () => Promise<void> }> } }).wakeLock;
			wlApi?.request('screen').then((s) => { wakeLockRef.current = s; }).catch(() => {});
			// elapsed timer
			elapsedTimerRef.current = window.setInterval(() => setElapsedMs((v) => v + 1000), 1000);
		} else {
			engineRef.current?.stop();
			if (wakeLockRef.current) { try { wakeLockRef.current.release?.(); } catch {} }
			if (elapsedTimerRef.current) { window.clearInterval(elapsedTimerRef.current); elapsedTimerRef.current = null; }
		}
	}, [running]);

	useEffect(() => {
		if (running) {
			flushTimerRef.current = window.setInterval(() => { flushWrites(); }, 10_000);
			return () => { if (flushTimerRef.current) window.clearInterval(flushTimerRef.current); flushTimerRef.current = null; };
		}
	}, [running]);

	function onPose(landmarks: SmoothedLandmark[] | null) {
		if (!landmarks) return;
		const ts = performance.now();
		const vis = landmarks.map(l => (l.visibility ?? 0));
		const avgVis = vis.reduce((a, b) => a + b, 0) / Math.max(1, vis.length);
		if (avgVis > 0.7) { setQuality('good'); lowQualityFramesRef.current = 0; setPausedByQuality(false); }
		else if (avgVis > 0.4) { setQuality('warn'); lowQualityFramesRef.current++; }
		else { setQuality('bad'); lowQualityFramesRef.current++; }
		if (lowQualityFramesRef.current > 45 && running) { setRunning(false); setPausedByQuality(true); return; }

		const s = validatorRef.current(landmarks, ts);
		setRepCount(s.repCount);
		if (s.metrics.length && repMetricsRef.current.length < s.metrics.length) {
			const m = s.metrics[s.metrics.length - 1];
			repMetricsRef.current.push({ idx: s.metrics.length, start_ms: Math.round(m.startTs), end_ms: Math.round(m.endTs), peak_depth: (m as unknown as { peakDepth?: number }).peakDepth });
		}
		const firstCue = s.cues[0] ?? '';
		if (firstCue && firstCue !== cue && !muted) speak(firstCue);
		setCue(firstCue);
		setSpark((prev) => (prev.concat([s.phase === 'down' ? 1 : 0]).slice(-100)));
		setLandmarks(landmarks);
	}

	function handleStartPause() {
		if (running) { setRunning(false); return; }
		setCountdown(3); let left = 3;
		const iv = setInterval(() => { left -= 1; setCountdown(left); if (left <= 0) { clearInterval(iv); setCountdown(null); setElapsedMs(0); setRunning(true); } }, 1000);
	}

	function undoLastRep() { if (repMetricsRef.current.length === 0 || repCount === 0) return; repMetricsRef.current.pop(); setRepCount((c) => Math.max(0, c - 1)); }

	function goalSubtext(): string | undefined {
		if (goalType === 'reps') return `${repCount}/${goalValue} reps`;
		if (goalType === 'time') return `${Math.floor(elapsedMs/1000)}s / ${goalValue}s`;
		return undefined;
	}

	function startRest(seconds: number) {
		setRunning(false);
		setRestLeft(seconds);
		if (restTimerRef.current) window.clearInterval(restTimerRef.current);
		restTimerRef.current = window.setInterval(() => {
			setRestLeft((v) => {
				const next = (v ?? 0) - 1;
				if (next <= 0) { window.clearInterval(restTimerRef.current!); restTimerRef.current = null; speak('Rest over'); return null; }
				return next;
			});
		}, 1000);
	}

	async function endSession() {
		setRunning(false); setSaving(true);
		const endTs = performance.now(); const start = startTs ?? endTs;
		const { getCurrentUserId } = await import('@/lib/supabase/client'); const userId = await getCurrentUserId();
		const sessionPayload = { user_id: userId, exercise, started_at: new Date(start).toISOString(), ended_at: new Date(endTs).toISOString(), total_reps: repMetricsRef.current.length, total_time_seconds: Math.round((endTs - start) / 1000), goal_type: goalType === 'none' ? null : goalType, goal_value: goalType === 'none' ? null : goalValue } as Record<string, unknown>;
		await enqueueWrite({ table: 'sessions', payload: sessionPayload });
		for (const r of repMetricsRef.current) { await enqueueWrite({ table: 'reps', payload: { ...r, session_id: 'PENDING' } }); }
		await flushWrites(); setSaving(false); alert('Session saved');
	}

	return (
		<div className={`min-h-screen grid grid-rows-[auto_1fr_auto] ${highContrast ? 'contrast-150' : ''}`}>
			<header className="p-4 flex items-center justify-between border-b">
				<div className="flex items-center gap-2">
					<select value={exercise} onChange={(e) => setExercise(e.target.value as Exercise)} className="border rounded-md px-2 py-1"><option value="squat">Squat</option><option value="pushup">Pushup</option><option value="plank">Plank</option></select>
					<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={muted} onChange={(e) => updateMuted(e.target.checked)} /> Mute</label>
					<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={largeText} onChange={(e) => setLargeText(e.target.checked)} /> Large HUD</label>
					<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} /> High contrast</label>
					<select onChange={(e) => { localStorage.setItem('afc_model', e.target.value); }} className="border rounded-md px-2 py-1"><option value="lite">Lite</option><option value="full">Full</option></select>
				</div>
				<div className="flex items-center gap-3 text-sm">
					<span className={`px-2 py-0.5 rounded ${quality==='good'?'bg-green-500/30 text-green-800':quality==='warn'?'bg-yellow-500/30 text-yellow-800':'bg-red-500/30 text-red-800'}`}>{quality}</span>
					<div className="opacity-70">Shortcuts: Space, U undo, R rest 60s, 1/2/3</div>
				</div>
			</header>

			<main className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4 items-start">
				<div className="relative rounded-xl overflow-hidden border bg-black">
					<video ref={videoRef} className="w-full h-full object-contain" playsInline muted />
					<canvas ref={canvasRef} className="absolute inset-0" />
					{videoRef.current && (<PoseOverlay landmarks={landmarks} video={videoRef.current} mirror />)}
					<HUD repCount={repCount} cue={pausedByQuality ? 'Step back into frame' : cue} spark={spark} subtext={`${goalSubtext() ?? ''}${goalSubtext() ? ' • ' : ''}${fps ? fps + ' FPS' : ''}`} large={largeText} />
					{countdown !== null && (<div className="absolute inset-0 bg-black/40 backdrop-blur grid place-items-center text-white"><div className="text-6xl font-bold">{countdown || 'Go!'}</div></div>)}
					{saving && (<div className="absolute inset-0 bg-black/40 backdrop-blur grid place-items-center text-white"><div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent" /><p className="mt-3">Saving your session…</p></div>)}
					{restLeft !== null && (<div className="absolute bottom-4 left-4 bg-white/80 rounded px-3 py-2 text-sm">Rest: {restLeft}s</div>)}
					<div className="absolute bottom-2 right-2 text-xs opacity-80 bg-white/70 rounded px-2 py-1">Camera stays on your device. We save only rep summaries.</div>
					{showCalib && <CalibrationModal exercise={exercise} landmarks={landmarks} onClose={() => setShowCalib(false)} onSaved={() => alert('Calibration saved')} />}
					{showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
				</div>
				<div className="space-y-4">
					<div className="rounded-lg border p-3 space-y-2">
						<div className="font-medium">Goal</div>
						<div className="flex items-center gap-2">
							<select value={goalType} onChange={(e) => onGoalTypeChange(e.target.value)} className="border rounded px-2 py-1"><option value="none">None</option><option value="reps">Target reps</option><option value="time">Target time (s)</option></select>
							<input type="number" min={1} value={goalValue} onChange={(e) => setGoalValue(parseInt(e.target.value || '0', 10))} className="border rounded px-2 py-1 w-24" />
							<button onClick={() => setShowCalib(true)} className="px-2 py-1 rounded bg-emerald-600 text-white">Calibrate</button>
						</div>
					</div>
					<button onClick={handleStartPause} className="w-full py-3 rounded-lg bg-black text-white">{running ? 'Pause' : 'Start'} Session</button>
					<div className="grid grid-cols-3 gap-2"><button onClick={() => startRest(30)} className="py-2 rounded bg-gray-200">Rest 30s</button><button onClick={() => startRest(60)} className="py-2 rounded bg-gray-200">Rest 60s</button><button onClick={() => startRest(90)} className="py-2 rounded bg-gray-200">Rest 90s</button></div>
					<button onClick={undoLastRep} className="w-full py-3 rounded-lg bg-gray-200">Undo last rep</button>
					<button onClick={endSession} className="w-full py-3 rounded-lg bg-gray-200">End & Save</button>
					<a href="/history" className="block text-center text-blue-600">History</a>
				</div>
			</main>
		</div>
	);
} 