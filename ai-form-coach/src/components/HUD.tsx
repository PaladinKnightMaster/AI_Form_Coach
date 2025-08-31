"use client";

export default function HUD({ repCount, cue, spark }: { repCount: number; cue: string; spark: number[] }) {
	const pct = (spark.filter(Boolean).length / Math.max(1, spark.length)) * 100;
	return (
		<div className="absolute top-4 left-4 bg-white/70 backdrop-blur rounded-lg px-3 py-2">
			<div className="text-5xl font-bold">{repCount}</div>
			<div className="text-sm opacity-80">{cue || '—'}</div>
			<div className="mt-2 h-8 w-40 bg-gray-200 rounded overflow-hidden">
				<div className="h-full bg-green-500" style={{ width: `${pct}%` }} />
			</div>
		</div>
	);
} 