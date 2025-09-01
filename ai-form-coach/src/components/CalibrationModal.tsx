"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SmoothedLandmark } from '@/lib/pose';
import { angleBetween, clamp } from '@/lib/math/poseMath';
import { saveExerciseThresholds } from '@/lib/calibration';
import type { Exercise } from '@/lib/validators/types';

export default function CalibrationModal({ exercise, landmarks, onClose, onSaved }: { exercise: Exercise; landmarks: SmoothedLandmark[] | null; onClose: () => void; onSaved: () => void }) {
	const [running, setRunning] = useState(false);
	const [samples, setSamples] = useState<number[]>([]);
	const [seconds, setSeconds] = useState(0);
	const timerRef = useRef<number | null>(null);

	useEffect(() => {
		if (!running) return;
		if (!landmarks) return;
		const val = measure(exercise, landmarks);
		if (val !== null) setSamples((s) => s.concat(val).slice(-180)); // last 6s @30fps cap
	}, [landmarks, running, exercise]);

	useEffect(() => {
		if (!running) return;
		timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
		return () => { if (timerRef.current) window.clearInterval(timerRef.current); timerRef.current = null; };
	}, [running]);

	const preview = useMemo(() => {
		if (!samples.length) return { primary: '-', secondary: '-' };
		const min = Math.min(...samples);
		const max = Math.max(...samples);
		return { primary: `${Math.round(min)} – ${Math.round(max)}`, secondary: `${samples.length} samples` };
	}, [samples]);

	function start() { setRunning(true); setSamples([]); setSeconds(0); }
	function stop() { setRunning(false); }

	async function save() {
		const now = Date.now();
		if (exercise === 'squat') {
			const maxDepth = Math.max(20, ...samples);
			const thr = { downDepth: Math.round(maxDepth * 0.6), upDepth: 10 };
			await saveExerciseThresholds({ exercise: 'squat', squat: thr, createdAt: now });
		} else if (exercise === 'pushup') {
			const minElbow = Math.min(140, ...samples); // elbow angle gets small at bottom
			const thr = { bottomElbow: Math.round(Math.max(50, minElbow + 5)), topElbow: 155 };
			await saveExerciseThresholds({ exercise: 'pushup', pushup: thr, createdAt: now });
		} else if (exercise === 'plank') {
			const avgHip = Math.round(samples.reduce((a, b) => a + b, 0) / Math.max(1, samples.length));
			const thr = { minHipAngle: clamp(avgHip - 5, 150, 179) };
			await saveExerciseThresholds({ exercise: 'plank', plank: thr, createdAt: now });
		}
		onSaved();
		onClose();
	}

	return (
		<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur grid place-items-center p-4">
			<div className="w-full max-w-xl bg-white text-black rounded-xl overflow-hidden">
				<div className="p-5 space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold">Calibrate {exercise}</h3>
						<button onClick={onClose} className="text-sm opacity-60 hover:opacity-100">Close</button>
					</div>
					<p className="text-sm">Perform a few good reps or hold the position for ~10s. We’ll learn your range and set thresholds.</p>
					<div className="rounded border p-3 bg-white/80">
						<div className="text-sm opacity-80">Samples: {preview.secondary}</div>
						<div className="text-2xl font-bold">{preview.primary}</div>
						<div className="text-xs opacity-70 mt-1">{seconds}s</div>
					</div>
					<div className="flex gap-2">
						{!running ? (
							<button onClick={start} className="px-3 py-2 rounded bg-black text-white">Start</button>
						) : (
							<button onClick={stop} className="px-3 py-2 rounded border">Stop</button>
						)}
						<button onClick={save} disabled={!samples.length} className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50">Use these thresholds</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function measure(exercise: Exercise, lm: SmoothedLandmark[]): number | null {
	try {
		if (exercise === 'squat') {
			// Use better-visibility side knee depth
			const L = { HIP: 23, K: 25, A: 27 } as const; const R = { HIP: 24, K: 26, A: 28 } as const;
			const lv = (lm[L.K]?.visibility ?? 0) + (lm[L.HIP]?.visibility ?? 0) + (lm[L.A]?.visibility ?? 0);
			const rv = (lm[R.K]?.visibility ?? 0) + (lm[R.HIP]?.visibility ?? 0) + (lm[R.A]?.visibility ?? 0);
			const s = rv > lv ? R : L;
			const k = angleBetween(lm[s.HIP], lm[s.K], lm[s.A]);
			return clamp(180 - k, 0, 120);
		}
		if (exercise === 'pushup') {
			const L = { S: 11, E: 13, W: 15 } as const; const R = { S: 12, E: 14, W: 16 } as const;
			const lv = (lm[L.S]?.visibility ?? 0) + (lm[L.E]?.visibility ?? 0) + (lm[L.W]?.visibility ?? 0);
			const rv = (lm[R.S]?.visibility ?? 0) + (lm[R.E]?.visibility ?? 0) + (lm[R.W]?.visibility ?? 0);
			const s = rv > lv ? R : L;
			return angleBetween(lm[s.S], lm[s.E], lm[s.W]);
		}
		if (exercise === 'plank') {
			const hipAngleL = angleBetween(lm[11], lm[23], lm[25]);
			const hipAngleR = angleBetween(lm[12], lm[24], lm[26]);
			return Math.round((hipAngleL + hipAngleR) / 2);
		}
		return null;
	} catch {
		return null;
	}
} 