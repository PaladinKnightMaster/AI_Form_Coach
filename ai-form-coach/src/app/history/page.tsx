"use client";
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function History() {
	type S = { id: string; exercise: string; started_at: string; total_reps: number | null; total_time_seconds: number | null; is_demo?: boolean };
	type R = { session_id: string; rom_score: number | null; start_ms: number; end_ms: number };
	const [sessions, setSessions] = useState<S[]>([]);
	const [reps, setReps] = useState<R[]>([]);
	const [showDemo, setShowDemo] = useState(false);

	// Generate demo data
	const generateDemoData = () => {
		const demoSession: S[] = [];
		const demoReps: R[] = [];
		const exercises = ['squat', 'pushup', 'plank'] as const;
		
		// Generate 8 demo sessions over the past 2 weeks
		for (let i = 0; i < 8; i++) {
			const date = new Date();
			date.setDate(date.getDate() - (i * 2)); // Every 2 days
			
			const exercise = exercises[i % exercises.length];
			const startedAt = new Date(date);
			startedAt.setHours(8 + Math.floor(Math.random() * 12));
			startedAt.setMinutes(Math.floor(Math.random() * 60));
			
			const durationMinutes = exercise === 'plank' ? 
				Math.floor(Math.random() * 3) + 1 : 
				Math.floor(Math.random() * 20) + 10;
			
			const endedAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
			const totalReps = exercise === 'plank' ? null : Math.floor(Math.random() * 40) + 15;
			const totalTimeSeconds = durationMinutes * 60;
			
			const sessionId = `demo_${i}`;
			demoSession.push({
				id: sessionId,
				exercise,
				started_at: startedAt.toISOString(),
				total_reps: totalReps,
				total_time_seconds: totalTimeSeconds,
				is_demo: true
			});
			
			// Generate demo reps for non-plank exercises
			if (exercise !== 'plank' && totalReps) {
				for (let j = 0; j < Math.min(totalReps, 20); j++) {
					const startMs = j * 2000;
					const endMs = startMs + 2000;
					demoReps.push({
						session_id: sessionId,
						rom_score: Math.random() * 0.2 + 0.8,
						start_ms: startMs,
						end_ms: endMs
					});
				}
			}
		}
		
		return { sessions: demoSession, reps: demoReps };
	};

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
			} catch { setSessions([]); setReps([]); }
		})();
	}, []);

	// Handle demo mode
	const handleShowDemo = () => {
		const demoData = generateDemoData();
		setSessions(demoData.sessions);
		setReps(demoData.reps);
		setShowDemo(true);
	};

	const handleHideDemo = () => {
		setShowDemo(false);
		// Reload real data
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
			} catch { setSessions([]); setReps([]); }
		})();
	};

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
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">History</h1>
				{showDemo && (
					<button
						onClick={handleHideDemo}
						className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors"
					>
						Exit Demo
					</button>
				)}
			</div>

			{showDemo && (
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
						<span className="text-blue-800 font-medium">Demo Mode</span>
					</div>
					<p className="text-blue-700 text-sm mt-1">
						This is sample data showing how your workout history will look. Start your first workout on the Coach page to see real data here.
					</p>
				</div>
			)}

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
				<div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
					<div className="max-w-md mx-auto">
						<div className="text-6xl mb-4">🏋️</div>
						<h3 className="text-lg font-semibold text-gray-900 mb-2">No workout sessions yet</h3>
						<p className="text-gray-600 mb-6">
							Start your fitness journey by completing your first workout session. Track your progress and see your improvements over time.
						</p>
						<div className="flex flex-col sm:flex-row gap-3 justify-center">
							<a 
								href="/coach" 
								className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
							>
								Start First Workout
							</a>
							<button
								onClick={handleShowDemo}
								className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
							>
								See Demo
							</button>
						</div>
					</div>
				</div>
			) : (
				<ul className="space-y-3">
					{sessions.map((s) => (
						<li key={s.id} className="rounded-lg border p-4 flex items-center justify-between">
							<div>
								<div className="font-medium capitalize flex items-center gap-2">
									{s.exercise}
									{s.is_demo && <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">Demo</span>}
								</div>
								<div className="text-sm opacity-70">{new Date(s.started_at).toLocaleString()}</div>
							</div>
							{s.is_demo ? (
								<span className="text-gray-400 text-sm">Demo Session</span>
							) : (
								<a className="text-blue-600 hover:text-blue-800" href={`/session/${s.id}`}>Open</a>
							)}
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