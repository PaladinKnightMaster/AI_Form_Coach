"use client";
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { FormIQTrending } from '@/components/FormIQTrending';
import { Badge } from '@/ui/DS';
import { subscriptionService } from '@/lib/subscription/subscriptionService';
import { VerificationIcon } from '@/components/verification/VerificationBadge';
import { CompactIntegrityScore } from '@/components/verification/IntegrityScoreDisplay';

export default function History() {
	type S = { id: string; exercise: string; started_at: string; total_reps: number | null; total_time_seconds: number | null; formIQ?: number; sideBalance?: number; is_demo?: boolean; verified?: boolean; flagged?: boolean; integrity_score?: number };
	type R = { session_id: string; rom_score: number | null; start_ms: number; end_ms: number };
	const [sessions, setSessions] = useState<S[]>([]);
	const [reps, setReps] = useState<R[]>([]);
	const [showDemo, setShowDemo] = useState(false);
	const [subscription, setSubscription] = useState<{ tier: string } | null>(null);

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
			
			// const endedAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
			const totalReps = exercise === 'plank' ? null : Math.floor(Math.random() * 40) + 15;
			const totalTimeSeconds = durationMinutes * 60;
			
			const sessionId = `demo_${i}`;
			
			// Generate demo Form IQ and side balance
			const formIQ = Math.random() * 0.4 + 0.6; // 0.6 to 1.0 range
			const sideBalance = exercise !== 'plank' 
				? Math.random() * 0.3 + 0.35 // 0.35 to 0.65 range (some imbalance)
				: undefined;
			
			// Generate demo verification data
			const integrityScore = Math.random() * 0.3 + 0.7; // 0.7 to 1.0 range
			const verified = integrityScore >= 0.7 && Math.random() > 0.1; // 90% verified
			const flagged = !verified && integrityScore < 0.5;
			
			demoSession.push({
				id: sessionId,
				exercise,
				started_at: startedAt.toISOString(),
				total_reps: totalReps,
				total_time_seconds: totalTimeSeconds,
				formIQ,
				sideBalance,
				is_demo: true,
				verified,
				flagged,
				integrity_score: integrityScore
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
				const { data: { user } } = await supabase.auth.getUser();
				
				if (user) {
					// Load subscription status
					const sub = await subscriptionService.getUserSubscription(user.id);
					setSubscription(sub);
					
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
				} else {
					setShowDemo(true);
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
		<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900/30 dark:to-purple-900/30">
			<div className="p-6 max-w-5xl mx-auto space-y-6">
				<div className="text-center space-y-4">
					<Badge tone="info" size="lg" className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
						📊 Progress Tracking
					</Badge>
					<h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
						Workout History
					</h1>
					<p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
						Track your fitness journey and see your improvements over time
					</p>
				</div>
				{showDemo && (
					<div className="flex justify-center">
						<button
							onClick={handleHideDemo}
							className="px-3 py-1 text-sm bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors"
						>
							Exit Demo
						</button>
					</div>
				)}
			</div>

			{showDemo && (
				<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
						<span className="text-blue-800 dark:text-blue-300 font-medium">Demo Mode</span>
					</div>
					<p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
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
			<div className="flex items-center gap-2 flex-wrap mb-6">
				{insights.badges.streak7 && <Badge tone="success">7-day streak</Badge>}
				{insights.badges.reps100 && <Badge tone="info">100+ total reps</Badge>}
				{insights.badges.rom90 && <Badge tone="warning">Best ROM ≥ 0.90</Badge>}
			</div>

			{/* Form IQ Trending - New Feature */}
			{(sessions.length > 0 || showDemo) && (
				<FormIQTrending 
					sessions={sessions} 
					isPro={subscription?.tier === 'pro' || subscription?.tier === 'founder'}
					className="mb-6"
				/>
			)}
			{sessions.length === 0 ? (
				<div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
					<div className="max-w-md mx-auto">
						<div className="text-6xl mb-4">🏋️</div>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No workout sessions yet</h3>
						<p className="text-gray-600 dark:text-gray-300 mb-6">
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
								className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
							>
								See Demo
							</button>
						</div>
					</div>
				</div>
			) : (
				<ul className="space-y-3">
					{sessions.map((s) => (
						<li key={s.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 flex items-center justify-between">
							<div className="flex-1">
								<div className="font-medium capitalize flex items-center gap-2 text-gray-900 dark:text-white">
									{s.exercise}
									{s.is_demo && <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full">Demo</span>}
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
									<span>{new Date(s.started_at).toLocaleString()}</span>
									{s.total_reps && <span>• {s.total_reps} reps</span>}
									{s.total_time_seconds && <span>• {Math.floor(s.total_time_seconds / 60)}:{(s.total_time_seconds % 60).toString().padStart(2, '0')}</span>}
								</div>
							</div>
							<div className="flex items-center gap-3">
								{/* Verification indicators */}
								{!s.is_demo && s.integrity_score !== undefined && (
									<div className="flex items-center gap-2">
										<VerificationIcon
											verified={s.verified || false}
											flagged={s.flagged || false}
											size="sm"
										/>
										<CompactIntegrityScore score={s.integrity_score} />
									</div>
								)}
								{s.is_demo ? (
									<span className="text-gray-400 dark:text-gray-500 text-sm">Demo Session</span>
								) : (
									<a className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium" href={`/session/${s.id}`}>View</a>
								)}
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function InsightCard({ title, value }: { title: string; value: string }) {
	return (
		<div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4">
			<div className="text-sm text-gray-600 dark:text-gray-400">{title}</div>
			<div className="text-xl font-semibold text-gray-900 dark:text-white">{value}</div>
		</div>
	);
}
