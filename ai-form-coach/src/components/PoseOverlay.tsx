"use client";
import { type Landmark3D } from '@/lib/pose/engine';
import { useEffect, useRef } from 'react';

const EDGES: [number, number][] = [
	[11, 13], [13, 15],
	[12, 14], [14, 16],
	[11, 12],
	[11, 23], [12, 24],
	[23, 25], [25, 27],
	[24, 26], [26, 28],
];

const LEFT_INDICES = new Set([11,13,15,23,25,27]);
const RIGHT_INDICES = new Set([12,14,16,24,26,28]);

interface PoseOverlayProps {
  landmarks: Landmark3D[] | null;
  video: HTMLVideoElement | null;
  mirror?: boolean;
  labels?: boolean;
  showConfidence?: boolean;
  highlightJoints?: number[];
  corrections?: Array<{
    joint: string;
    position: { x: number; y: number };
    message: string;
  }>;
}

export default function PoseOverlay({ 
  landmarks, 
  video, 
  mirror = false, 
  labels = false,
  showConfidence = false,
  highlightJoints = [],
  corrections = []
}: PoseOverlayProps) {
	const ref = useRef<HTMLCanvasElement>(null);
	useEffect(() => {
		const canvas = ref.current; if (!canvas || !video) return;
		const ctx = canvas.getContext('2d'); if (!ctx) return;
		canvas.width = video.videoWidth; canvas.height = video.videoHeight;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (!landmarks) return;
		
		ctx.save();
		if (mirror) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
		
		// Draw skeleton edges
		ctx.lineWidth = 4;
		for (const [a, b] of EDGES) {
			const p1 = landmarks[a]; const p2 = landmarks[b]; 
			if (!p1 || !p2) continue;
			
			// Check if edge should be highlighted
			const isHighlighted = highlightJoints.includes(a) || highlightJoints.includes(b);
			ctx.strokeStyle = isHighlighted ? '#ff4444' : edgeColor(a, b);
			ctx.lineWidth = isHighlighted ? 6 : 4;
			
			ctx.beginPath();
			ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
			ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
			ctx.stroke();
		}
		
		// Draw joints
		for (let i = 0; i < landmarks.length; i++) {
			const p = landmarks[i]; if (!p) continue;
			
			// Determine joint color and size
			const isHighlighted = highlightJoints.includes(i);
			const confidence = showConfidence ? p.visibility : 1;
			const size = isHighlighted ? 6 : 3;
			
			ctx.fillStyle = isHighlighted ? '#ff4444' : pointColor(i);
			ctx.globalAlpha = confidence;
			
			ctx.beginPath();
			ctx.arc(p.x * canvas.width, p.y * canvas.height, size, 0, Math.PI * 2);
			ctx.fill();
			
			// Draw confidence ring for low confidence joints
			if (showConfidence && confidence < 0.7) {
				ctx.strokeStyle = '#ff4444';
				ctx.lineWidth = 2;
				ctx.globalAlpha = 0.8;
				ctx.beginPath();
				ctx.arc(p.x * canvas.width, p.y * canvas.height, size + 2, 0, Math.PI * 2);
				ctx.stroke();
			}
			
			// Draw labels
			if (labels && (LEFT_INDICES.has(i) || RIGHT_INDICES.has(i))) {
				ctx.fillStyle = 'rgba(0,0,0,0.8)';
				ctx.font = '10px system-ui';
				ctx.globalAlpha = 1;
				ctx.fillText(String(i), p.x * canvas.width + 4, p.y * canvas.height - 4);
			}
		}
		
		// Draw corrections
		corrections.forEach(correction => {
			ctx.globalAlpha = 0.8;
			ctx.strokeStyle = '#ff4444';
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.arc(correction.position.x * canvas.width, correction.position.y * canvas.height, 8, 0, Math.PI * 2);
			ctx.stroke();
			
			// Draw correction message
			ctx.fillStyle = 'rgba(255, 68, 68, 0.9)';
			ctx.font = '12px system-ui';
			ctx.globalAlpha = 1;
			ctx.fillText(correction.message, correction.position.x * canvas.width + 12, correction.position.y * canvas.height - 4);
		});
		
		ctx.restore();
	}, [landmarks, video, mirror, labels, showConfidence, highlightJoints, corrections]);
	return <canvas ref={ref} className="absolute inset-0 pointer-events-none" />;
}

function pointColor(i: number) {
	if (LEFT_INDICES.has(i)) return '#22c55e'; // green left
	if (RIGHT_INDICES.has(i)) return '#3b82f6'; // blue right
	return '#ffffff'; // center
}

function edgeColor(a: number, b: number) {
	if (LEFT_INDICES.has(a) && LEFT_INDICES.has(b)) return '#22c55e';
	if (RIGHT_INDICES.has(a) && RIGHT_INDICES.has(b)) return '#3b82f6';
	return 'rgba(255,255,255,0.9)';
} 