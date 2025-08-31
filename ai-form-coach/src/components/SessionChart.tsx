"use client";

type Rep = { idx: number; start_ms: number; end_ms: number; peak_depth: number | null; rom_score: number | null };

export default function SessionChart({ reps }: { reps: Rep[] }) {
	if (!reps?.length) return <div className="text-sm opacity-70">No reps recorded.</div>;
	const maxDepth = Math.max(1, ...reps.map(r => (r.peak_depth ?? 0)));
	const width = 600;
	const height = 120;
	const barW = Math.max(4, Math.floor(width / reps.length) - 2);
	return (
		<svg width={width} height={height} className="w-full h-32">
			{reps.map((r, i) => {
				const h = Math.round(((r.peak_depth ?? 0) / maxDepth) * (height - 20));
				const x = i * (barW + 2);
				const y = height - h - 10;
				const good = (r.rom_score ?? 0) >= 0.8;
				return <rect key={r.idx} x={x} y={y} width={barW} height={h} rx={2} className={good ? 'fill-green-500' : 'fill-yellow-500'} />;
			})}
		</svg>
	);
} 