"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';

const SessionChart = dynamic(() => import('@/components/SessionChart'), { ssr: false });

export default function SessionDetail() {
	const params = useParams<{ id: string }>();
	type S = { id: string; exercise: string; started_at: string; ended_at: string | null; total_reps: number | null };
	type R = { id: string; idx: number; start_ms: number; end_ms: number; peak_depth: number | null; rom_score: number | null };
	const [session, setSession] = useState<S | null>(null);
	const [reps, setReps] = useState<R[]>([]);

	useEffect(() => {
		(async () => {
			const supabase = getSupabaseClient();
			const { data: s } = await supabase.from('sessions').select('*').eq('id', params.id).single();
			const { data: r } = await supabase.from('reps').select('*').eq('session_id', params.id).order('start_ms');
			setSession(s ?? null);
			setReps(r ?? []);
		})();
	}, [params.id]);

	if (!session) return <div className="p-6">Loading...</div>;

	return (
		<div className="p-6 max-w-4xl mx-auto space-y-4">
			<h1 className="text-2xl font-semibold">Session</h1>
			<div className="rounded-lg border p-4 flex items-center justify-between">
				<div>Exercise: <span className="capitalize">{session.exercise}</span></div>
				<div className="text-sm opacity-70">{new Date(session.started_at).toLocaleString()}</div>
			</div>
			<div className="rounded-lg border p-4">
				<h2 className="font-medium mb-2">Reps</h2>
				{reps.length === 0 ? (
					<div className="text-sm opacity-70">No reps captured.</div>
				) : (
					<div className="space-y-4">
						<SessionChart reps={reps.map(r => ({ idx: r.idx, start_ms: r.start_ms, end_ms: r.end_ms, peak_depth: r.peak_depth, rom_score: r.rom_score }))} />
						<ul className="space-y-1">
							{reps.map((r) => (
								<li key={r.id} className="flex items-center justify-between text-sm">
									<span>Rep {r.idx}</span>
									<span className="opacity-70">{(r.end_ms - r.start_ms).toFixed(0)} ms · ROM {r.rom_score ?? '-'} · depth {r.peak_depth ?? '-'}</span>
								</li>
							))}
						</ul>
						<p className="text-xs opacity-70">Note: For privacy, video is not recorded; this timeline summarizes motion-only metrics.</p>
					</div>
				)}
			</div>
		</div>
	);
} 