"use client";
import { useEffect, useRef, useState } from 'react';
import { initPose, PoseEngine, type SmoothedLandmark } from '@/lib/pose';
import { createValidator } from '@/lib/validators';
import type { Exercise } from '@/lib/validators/types';
import { speak, setMuted } from '@/lib/voice/coachVoice';
import PoseOverlay from '@/components/PoseOverlay';
import HUD from '@/components/HUD';
import { enqueueWrite, flushWrites } from '@/lib/storage/offlineQueue';

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
	const validatorRef = useRef(createValidator(exercise));
	const [startTs, setStartTs] = useState<number | null>(null);
	const [muted, updateMuted] = useState(false);
	const flushTimerRef = useRef<number | null>(null);

	useEffect(() => {
		validatorRef.current = createValidator(exercise);
	}, [exercise]);

	useEffect(() => {
		setMuted(muted);
	}, [muted]);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.code === 'Space') {
				e.preventDefault();
				setRunning((r) => !r);
			}
			if (e.key === '1') setExercise('squat');
			if (e.key === '2') setExercise('pushup');
			if (e.key === '3') setExercise('plank');
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, []);

	useEffect(() => {
		let active = true;
		let stream: MediaStream | null = null;
		(async () => {
			await initPose('lite');
			stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
			const video = videoRef.current;
			if (!video) return;
			if (video.srcObject !== stream) {
				video.srcObject = stream;
			}
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
			if (running) engine.start();
		})();
		return () => {
			active = false;
			engineRef.current?.stop();
			if (stream) { for (const t of stream.getTracks()) t.stop(); }
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (!engineRef.current) return;
		if (running) {
			setStartTs(performance.now());
			engineRef.current.start();
		} else {
			engineRef.current.stop();
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

	async function endSession() {
		setRunning(false);
		setSaving(true);
		const endTs = performance.now();
		const start = startTs ?? endTs;
		const { getCurrentUserId } = await import('@/lib/supabase/client');
		const userId = await getCurrentUserId();
		const sessionPayload = {
			user_id: userId,
			exercise,
			started_at: new Date(start).toISOString(),
			ended_at: new Date(endTs).toISOString(),
			total_reps: repMetricsRef.current.length,
			total_time_seconds: Math.round((endTs - start) / 1000),
		};
		await enqueueWrite({ table: 'sessions', payload: sessionPayload });
		for (const r of repMetricsRef.current) {
			await enqueueWrite({ table: 'reps', payload: { ...r, session_id: 'PENDING' } });
		}
		await flushWrites();
		setSaving(false);
		alert('Session saved');
	}

	useEffect(() => {
		const canvas = canvasRef.current;
		const video = videoRef.current;
		if (!canvas || !video) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const raf = requestAnimationFrame(function draw() {
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			requestAnimationFrame(draw);
		});
		return () => cancelAnimationFrame(raf);
	}, []);

	return (
		<div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
			<header className="p-4 flex items-center justify-between border-b">
				<div className="flex items-center gap-2">
					<select value={exercise} onChange={(e) => setExercise(e.target.value as Exercise)} className="border rounded-md px-2 py-1">
						<option value="squat">Squat</option>
						<option value="pushup">Pushup</option>
						<option value="plank">Plank</option>
					</select>
					<label className="flex items-center gap-2 text-sm">
						<input type="checkbox" checked={muted} onChange={(e) => updateMuted(e.target.checked)} /> Mute coach
					</label>
				</div>
				<div className="text-sm opacity-70">Shortcuts: Space start/stop, 1/2/3 select exercise</div>
			</header>

			<main className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4 items-start">
				<div className="relative rounded-xl overflow-hidden border bg-black">
					<video ref={videoRef} className="w-full h-full object-contain" playsInline muted />
					<canvas ref={canvasRef} className="absolute inset-0" />
					{videoRef.current && (
						<PoseOverlay landmarks={landmarks} video={videoRef.current} />
					)}
					<HUD repCount={repCount} cue={cue} spark={spark} />
					{saving && (
						<div className="absolute inset-0 bg-black/40 backdrop-blur grid place-items-center text-white">
							<div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent" />
							<p className="mt-3">Saving...</p>
						</div>
					)}
				</div>
				<div className="space-y-4">
					<button onClick={() => setRunning((r) => !r)} className="w-full py-3 rounded-lg bg-black text-white">{running ? 'Pause' : 'Start'} Session</button>
					<button onClick={endSession} className="w-full py-3 rounded-lg bg-gray-200">End & Save</button>
					<a href="/history" className="block text-center text-blue-600">History</a>
				</div>
			</main>
		</div>
	);
} 