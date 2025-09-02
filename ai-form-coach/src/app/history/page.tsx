"use client";
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function History() {
	type S = { id: string; exercise: string; started_at: string; total_reps: number | null; total_time_seconds: number | null };
	type R = { session_id: string; rom_score: number | null; start_ms: number; end_ms: number };
	const [sessions, setSessions] = useState<S[]>([]);
	const [reps, setReps] = useState<R[]>([]);

	useEffect(() => {
		(async () => {
			try {
				const supabase = getSupabaseClient();
				const { data: s } = await supabase.from('sessions').select('*').order('started_at', { ascending: false });
				const sess = (s ?? []) as S[];
				setSessions(sess);
				const last30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
				const recentIds = sess.filter(x => x.started_at >= last30).map(x => x.id);
				if (recentIds.length) {
					const { data: r } = await supabase.from('reps').select('session_id,rom_score,start_ms,end_ms').in('session_id', recentIds);
					setReps((r ?? []) as R[]);
				} else {
					setReps([]);
				}
			} catch (_) { setSessions([]); setReps([]); }
		})();
	}, []);

	const insights = useMemo(() => {
		const now = Date.now();
		const dayMs = 24 * 3600 * 1000;
		const inDays = (d: string, n: number) => (now - new Date(d).getTime()) <= n * dayMs;
		const s7 = sessions.filter(s => inDays(s.started_at, 7));
		const s30 = sessions.filter(s => inDays(s.started_at, 30));
		const total = (arr: S[], key: keyof S) => arr.reduce((a, b) => a + (Number(b[key] ?? 0) || 0), 0);
		const t7 = { reps: total(s7, 'total_reps'), sec: total(s7, 'total_time_seconds') };
		const t30 = { reps: total(s30, 'total_reps'), sec: total(s30, 'total_time_seconds') };
		const bestRom = Math.max(0, ...reps.map(r => r.rom_score ?? 0));
		const bestSessionReps = Math.max(0, ...sessions.map(s => Number(s.total_reps ?? 0)));
		const bestTempoMs = Math.min(...reps.map(r => (r.end_ms - r.start_ms))).toFixed(0);
		// Consistency streak (days with at least one session)
		const days = Array.from(new Set(sessions.map(s => new Date(s.started_at).toDateString()))).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
		let streak = 0; let last = new Date().toDateString();
		for (const d of days) { const dd = new Date(d).getTime(); const ll = new Date(last).getTime(); const delta = Math.round((ll - dd)/dayMs); if (delta <= 1) { streak += 1; last = d; } else break; }
		const totalRepsAll = total(sessions, 'total_reps');
		const badges = {
			streak7: streak >= 7,
			reps100: totalRepsAll >= 100,
			rom90: bestRom >= 0.9
		};
		return { t7, t30, bestRom: Number(bestRom.toFixed(2)), bestSessionReps, bestTempoMs, streak, badges };
	}, [sessions, reps]);

	return (
		<div className="p-6 max-w-5xl mx-auto space-y-4">
			<h1 className="text-2xl font-semibold">History</h1>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
				<InsightCard title="Last 7 days" value={`${insights.t7.reps} reps • ${(insights.t7.sec/60).toFixed(0)} min`} />
				<InsightCard title="Last 30 days" value={`${insights.t30.reps} reps • ${(insights.t30.sec/60).toFixed(0)} min`} />
				<InsightCard title="Best ROM" value={insights.bestRom ? insights.bestRom.toString() : '-'} />
				<InsightCard title="Best set (reps)" value={insights.bestSessionReps.toString()} />
				<InsightCard title="Best tempo (ms)" value={isFinite(Number(insights.bestTempoMs)) ? insights.bestTempoMs : '-'} />
				<InsightCard title="Consistency streak" value={`${insights.streak} days`} />
			</div>
			{/* Badges */}
			<div className="flex items-center gap-2 flex-wrap">
				{insights.badges.streak7 && <Badge label="7-day streak" />}
				{insights.badges.reps100 && <Badge label="100+ total reps" />}
				{insights.badges.rom90 && <Badge label="Best ROM ≥ 0.90" />}
			</div>
			{sessions.length === 0 ? (
				<div className="rounded-lg border p-6 text-center opacity-80">No sessions yet. Start one on the Coach page.</div>
			) : (
				<ul className="space-y-3">
					{sessions.map((s) => (
						<li key={s.id} className="rounded-lg border p-4 flex items-center justify-between">
							<div>
								<div className="font-medium capitalize">{s.exercise}</div>
								<div className="text-sm opacity-70">{new Date(s.started_at).toLocaleString()}</div>
							</div>
							<a className="text-blue-600" href={`/session/${s.id}`}>Open</a>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function InsightCard({ title, value }: { title: string; value: string }) {
	return (
		<div className="rounded-lg border p-4">
			<div className="text-sm opacity-70">{title}</div>
			<div className="text-xl font-semibold">{value}</div>
		</div>
	);
}

function Badge({ label }: { label: string }) { return <span className="px-2 py-1 rounded-full bg-emerald-600/15 text-emerald-700 text-xs">{label}</span>; } 