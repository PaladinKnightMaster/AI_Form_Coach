"use client";

export default function HUD({ repCount, cue, spark, subtext, large }: { repCount: number; cue: string; spark: number[]; subtext?: string; large?: boolean }) {
	const pct = (spark.filter(Boolean).length / Math.max(1, spark.length)) * 100;
	return (
		<div className="absolute top-4 left-4 bg-white/70 backdrop-blur rounded-lg px-3 py-2">
			<div className={`${large ? 'text-7xl' : 'text-5xl'} font-bold`}>{repCount}</div>
			<div className="text-sm opacity-80">{cue || '—'}</div>
			{subtext ? <div className="text-xs opacity-80 mt-0.5">{subtext}</div> : null}
			<div className="mt-2 h-8 w-40 bg-gray-200 rounded overflow-hidden">
				<div className="h-full bg-green-500" style={{ width: `${pct}%` }} />
			</div>
		</div>
	);
} 