"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TutorialOverlay({ onClose }: { onClose: () => void }) {
	const [slide, setSlide] = useState(0);
	const [dontShow, setDontShow] = useState(false);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') finish();
			if (e.key === 'ArrowRight') next();
			if (e.key === 'ArrowLeft') prev();
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [slide, dontShow]);

	function finish() {
		if (dontShow) try { localStorage.setItem('afc_tutorial_seen', '1'); } catch {}
		onClose();
	}
	function next() { setSlide((s) => Math.min(2, s + 1)); }
	function prev() { setSlide((s) => Math.max(0, s - 1)); }

	return (
		<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md grid place-items-center p-4">
			<div className="w-full max-w-2xl bg-white text-black rounded-xl shadow-lg overflow-hidden">
				<div className="p-6 space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold">Welcome to AI Form Coach</h2>
						<button aria-label="Close tutorial" onClick={finish} className="text-sm opacity-60 hover:opacity-100">Skip</button>
					</div>
					{slide === 0 && (
						<div className="space-y-2">
							<h3 className="font-medium">Camera tips</h3>
							<ul className="list-disc pl-5 text-sm space-y-1">
								<li>Stand back so your whole body fits on screen</li>
								<li>Good lighting helps landmark quality</li>
								<li>Face the camera side-on for squats/pushups</li>
							</ul>
						</div>
					)}
					{slide === 1 && (
						<div className="space-y-2">
							<h3 className="font-medium">What you’ll see</h3>
							<ul className="list-disc pl-5 text-sm space-y-1">
								<li>Green skeleton = detected joints</li>
								<li>Big number = rep counter; sparkline = depth trend</li>
								<li>Traffic light shows tracking quality</li>
							</ul>
						</div>
					)}
					{slide === 2 && (
						<div className="space-y-2">
							<h3 className="font-medium">Counting & privacy</h3>
							<ul className="list-disc pl-5 text-sm space-y-1">
								<li>Reps are counted by joint angles (not distance)</li>
								<li>Use Space to start/pause, U to undo, 1/2/3 to switch exercise</li>
								<li>Video stays on your device; only rep summaries are saved</li>
								<li className="mt-1"><Link className="underline" href="/privacy">Read privacy & safety</Link></li>
							</ul>
						</div>
					)}
				</div>
				<div className="px-6 pb-6 flex items-center justify-between">
					<label className="text-sm flex items-center gap-2">
						<input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} /> Don’t show again
					</label>
					<div className="flex items-center gap-2">
						<button onClick={prev} disabled={slide === 0} className="px-3 py-2 rounded border disabled:opacity-50">Back</button>
						{slide < 2 ? (
							<button onClick={next} className="px-3 py-2 rounded bg-black text-white">Next</button>
						) : (
							<button onClick={finish} className="px-3 py-2 rounded bg-black text-white">Start</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
} 