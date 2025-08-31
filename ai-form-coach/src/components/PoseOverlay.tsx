"use client";
import { type SmoothedLandmark } from '@/lib/pose';
import { useEffect, useRef } from 'react';

const EDGES: [number, number][] = [
	[11, 13], [13, 15],
	[12, 14], [14, 16],
	[11, 12],
	[11, 23], [12, 24],
	[23, 25], [25, 27],
	[24, 26], [26, 28],
];

export default function PoseOverlay({ landmarks, video, mirror = false }: { landmarks: SmoothedLandmark[] | null; video: HTMLVideoElement | null; mirror?: boolean }) {
	const ref = useRef<HTMLCanvasElement>(null);
	useEffect(() => {
		const canvas = ref.current; if (!canvas || !video) return;
		const ctx = canvas.getContext('2d'); if (!ctx) return;
		canvas.width = video.videoWidth; canvas.height = video.videoHeight;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (!landmarks) return;
		ctx.save();
		if (mirror) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
		ctx.lineWidth = 4; ctx.strokeStyle = '#22c55e'; ctx.fillStyle = '#22c55e';
		for (const [a, b] of EDGES) {
			const p1 = landmarks[a]; const p2 = landmarks[b]; if (!p1 || !p2) continue;
			ctx.beginPath();
			ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
			ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
			ctx.stroke();
		}
		for (const p of landmarks) {
			ctx.beginPath();
			ctx.arc(p.x * canvas.width, p.y * canvas.height, 3, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.restore();
	}, [landmarks, video, mirror]);
	return <canvas ref={ref} className="absolute inset-0 pointer-events-none" />;
} 