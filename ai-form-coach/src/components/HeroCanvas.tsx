"use client";
import { useEffect, useRef } from 'react';

/**
 * HeroCanvas — animated mini-skeleton on the marketing hero.
 *
 * Repainted in the Carriage Form Line palette:
 *   edge  · malachite-light (#149A80) → champagne (#D8C29D)  · the body line catching light
 *   joints · champagne (#D8C29D)
 *   card  · obsidian (#070707) ground, hairline bone border at 8% opacity
 */
export default function HeroCanvas({ className }: { className?: string }) {
	const ref = useRef<HTMLCanvasElement>(null);
	useEffect(() => {
		const canvasEl = ref.current; if (!canvasEl) return;
		const baseCtx = canvasEl.getContext('2d'); if (!baseCtx) return;
		let frame = 0, raf = 0;
		const dpr = Math.max(1, Math.min(2, (window.devicePixelRatio || 1)));
		const resize = () => {
			const parent = canvasEl.parentElement; if (!parent) return;
			const w = parent.clientWidth; const h = Math.round((w * 9) / 16);
			canvasEl.style.width = `${w}px`; canvasEl.style.height = `${h}px`;
			canvasEl.width = Math.round(w * dpr); canvasEl.height = Math.round(h * dpr);
			baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		resize();
		const ro = new ResizeObserver(resize); if (canvasEl.parentElement) ro.observe(canvasEl.parentElement);

		const pts = [
			{ x: 140, y: 80 }, { x: 170, y: 140 }, { x: 210, y: 190 },
			{ x: 200, y: 90 }, { x: 260, y: 140 }, { x: 200, y: 160 }, { x: 170, y: 230 }, { x: 230, y: 230 }
		];
		const edges: [number, number][] = [ [0,1],[1,2],[0,3],[3,4],[3,5],[5,6],[5,7] ];

		function draw() {
			if (!canvasEl) return;
			const ctx = baseCtx as CanvasRenderingContext2D;
			const w = canvasEl.width / dpr, h = canvasEl.height / dpr;
			ctx.clearRect(0, 0, w, h);
			// Obsidian card · hairline bone border
			ctx.fillStyle = 'rgba(7, 7, 7, 0.92)';
			ctx.strokeStyle = 'rgba(244, 239, 230, 0.08)';
			roundRect(ctx, 0, 0, w, h, 12); ctx.fill(); ctx.stroke();
			// Animated malachite glow — drifts intensity, not hue
			const t = Math.sin(frame / 60) * 0.5 + 0.5;
			ctx.shadowBlur = 14 + t * 10;
			ctx.shadowColor = `rgba(20, 154, 128, ${0.45 + t * 0.20})`; // malachite-light
			ctx.lineWidth = 4; ctx.lineCap = 'round';
			// The Form Line · malachite → champagne, left → right
			const grad = ctx.createLinearGradient(0, 0, w, 0);
			grad.addColorStop(0, '#149A80'); // malachite-light
			grad.addColorStop(1, '#D8C29D'); // champagne
			ctx.strokeStyle = grad;
			// edges
			edges.forEach(([a,b]) => {
				const p1 = pts[a], p2 = pts[b];
				ctx.beginPath(); ctx.moveTo(scaleX(p1.x, w), scaleY(p1.y, h)); ctx.lineTo(scaleX(p2.x, w), scaleY(p2.y, h)); ctx.stroke();
			});
			// joints · champagne calibration nodes
			ctx.fillStyle = '#D8C29D'; ctx.shadowBlur = 0;
			pts.forEach(p => { ctx.beginPath(); ctx.arc(scaleX(p.x, w), scaleY(p.y, h), 4, 0, Math.PI*2); ctx.fill(); });
			frame++; raf = requestAnimationFrame(draw);
		}
		draw();
		return () => { cancelAnimationFrame(raf); ro.disconnect(); };
	}, []);
	return <canvas ref={ref} className={className} aria-label="The Form Line — pose overlay demo" />;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}
function scaleX(x: number, w: number) { return (x / 320) * (w - 24) + 12; }
function scaleY(y: number, h: number) { return (y / 180) * (h - 24) + 12; }
