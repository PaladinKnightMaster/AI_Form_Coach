"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import VerificationDetails from '@/components/verification/VerificationDetails';
import SimilarSessions from '@/components/embeddings/SimilarSessions';
import CompareToBest from '@/components/embeddings/CompareToBest';
import ReportGenerator from '@/components/reports/ReportGenerator';

const SessionChart = dynamic(() => import('@/components/SessionChart'), { ssr: false });

type S = { 
	id: string; 
	exercise: string; 
	started_at: string; 
	ended_at: string | null; 
	total_reps: number | null; 
	notes: string | null;
	correct_rate: number | null;
	avg_quality_score: number | null;
};
type R = { 
	id: string; 
	idx: number; 
	start_ms: number; 
	end_ms: number; 
	peak_depth: number | null; 
	rom_score: number | null;
	// P4: Enhanced correctness data
	is_correct: boolean | null;
	confidence: number | null;
	errors: Array<{
		type: string;
		severity: 'low' | 'medium' | 'high';
		message: string;
		duration: number;
	}> | null;
	quality: 'excellent' | 'good' | 'fair' | 'poor' | null;
	quality_score: number | null;
	tempo: 'fast' | 'normal' | 'slow' | null;
};
type OS = { id: string; total_reps: number | null };
type OR = { session_id: string; rom_score: number | null };

export default function SessionDetail() {
	const params = useParams<{ id: string }>();
	const [session, setSession] = useState<S | null>(null);
	const [reps, setReps] = useState<R[]>([]);
	const [notes, setNotes] = useState('');
	const [saving, setSaving] = useState(false);
	const [pr, setPr] = useState<{ reps: boolean; rom: boolean }>({ reps: false, rom: false });
	const [userId, setUserId] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			const supabase = getSupabaseClient();
			
			// Get current user
			const { data: { user } } = await supabase.auth.getUser();
			setUserId(user?.id || null);
			
			// P4: Enhanced session query with correctness data
			const { data: s } = await supabase.from('sessions').select('id,exercise,started_at,ended_at,total_reps,notes,correct_rate,avg_quality_score').eq('id', params.id).single() as { data: S | null };
			// P4: Enhanced reps query with correctness data
			const { data: r } = await supabase.from('reps').select('id,idx,start_ms,end_ms,peak_depth,rom_score,is_correct,confidence,errors,quality,quality_score,tempo').eq('session_id', params.id).order('start_ms') as { data: R[] | null };
			setSession(s ?? null);
			setNotes(s?.notes ?? '');
			setReps(r ?? []);
		})();
	}, [params.id]);

	// Compute PRs against user’s other sessions for same exercise
	useEffect(() => {
		(async () => {
			if (!session) return;
			const supabase = getSupabaseClient();
			const { data: others } = await supabase.from('sessions').select('id,total_reps').eq('exercise', session.exercise).neq('id', session.id) as { data: OS[] | null };
			const bestReps = Math.max(0, ...((others ?? []).map((x) => Number(x.total_reps ?? 0))));
			const curReps = Number(session.total_reps ?? 0);
			const avgRom = reps.length ? reps.reduce((a, r) => a + (r.rom_score ?? 0), 0) / reps.length : 0;
			const otherIds = (others ?? []).map((x) => x.id);
			const { data: romOthers } = otherIds.length ? await supabase.from('reps').select('rom_score,session_id').in('session_id', otherIds) as { data: OR[] | null } : { data: [] as OR[] };
			const romBySess: Record<string, number[]> = {};
			(romOthers ?? []).forEach((r) => { const arr = romBySess[r.session_id] ?? (romBySess[r.session_id] = []); if (typeof r.rom_score === 'number') arr.push(r.rom_score); });
			const bestRom = Object.values(romBySess).reduce((m, arr) => Math.max(m, arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length : 0), 0);
			setPr({ reps: curReps > bestReps && curReps > 0, rom: avgRom > bestRom && avgRom > 0 });
		})();
	}, [session, reps]);

	if (!session) return <div className="p-6">Loading...</div>;

	const totalSeconds = session ? (session.ended_at ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000) : Math.round(reps.reduce((a, r) => a + (r.end_ms - r.start_ms) / 1000, 0))) : 0;
	const avgRom = reps.length ? Number((reps.reduce((a, r) => a + (r.rom_score ?? 0), 0) / reps.length).toFixed(2)) : null;

	function copySummary() {
		const text = `${reps.length} ${session!.exercise} • ${totalSeconds}s${avgRom !== null ? ` • ROM ${avgRom}` : ''}`;
		navigator.clipboard?.writeText(text).then(() => alert('Summary copied')).catch(() => alert('Copy failed'));
	}

	function exportCSV() {
		// P4: Enhanced CSV export with correctness data
		const header = 'idx,start_ms,end_ms,duration_ms,peak_depth,rom_score,is_correct,confidence,quality,quality_score,tempo,error_count,errors';
		const rows = reps.map((r) => {
			const duration = r.end_ms - r.start_ms;
			const errors = r.errors ? r.errors.map(e => `${e.type}:${e.severity}`).join(';') : '';
			return [
				r.idx, 
				r.start_ms, 
				r.end_ms, 
				duration,
				r.peak_depth ?? '', 
				r.rom_score ?? '',
				r.is_correct ?? '',
				r.confidence ? Math.round(r.confidence * 100) / 100 : '',
				r.quality ?? '',
				r.quality_score ?? '',
				r.tempo ?? '',
				r.errors ? r.errors.length : 0,
				`"${errors}"`
			].join(',');
		});
		const csv = [header, ...rows].join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url; a.download = `session_${session!.id}.csv`;
		document.body.appendChild(a); a.click(); a.remove();
		URL.revokeObjectURL(url);
	}

	async function saveNotes() {
		setSaving(true);
		try {
			const supabase = getSupabaseClient();
			await supabase.from('sessions').update({ notes }).eq('id', session!.id);
			alert('Notes saved');
		} finally {
			setSaving(false);
		}
	}

	const quickTags = [ 'knee cave', 'fatigue', 'PR', 'depth', 'form', 'tempo' ];
	function addTag(t: string) { setNotes((n) => (n ? n + `, ${t}` : t)); }

	async function shareImage() {
		const w = 800, h = 400;
		const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
		const ctx = canvas.getContext('2d'); if (!ctx || !session) return;
		ctx.fillStyle = '#0b0b0b'; ctx.fillRect(0,0,w,h);
		ctx.fillStyle = '#ffffff'; ctx.font = 'bold 28px system-ui'; ctx.fillText('AI Form Coach', 24, 48);
		ctx.font = '16px system-ui'; ctx.fillText(`Exercise: ${session.exercise}`, 24, 80);
		const totalSeconds = session.ended_at ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000) : 0;
		const avgRom = reps.length ? Number((reps.reduce((a, r) => a + (r.rom_score ?? 0), 0) / reps.length).toFixed(2)) : null;
		ctx.fillText(`${session.total_reps ?? 0} reps • ${totalSeconds}s${avgRom !== null ? ` • ROM ${avgRom}` : ''}`, 24, 108);
		// simple sparkline
		const sx = 24, sy = 140, sw = 752, sh = 160;
		ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.strokeRect(sx, sy, sw, sh);
		if (reps.length) {
			let x = sx; const step = sw / reps.length;
			ctx.beginPath();
			reps.forEach((r, i) => {
				const v = Math.max(0, Math.min(1, (r.rom_score ?? 0)));
				const y = sy + sh - v * sh;
				if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
				x += step;
			});
			ctx.stroke();
		}
		const dataUrl = canvas.toDataURL('image/png');
		const a = document.createElement('a'); a.href = dataUrl; a.download = `session_${session.id}_share.png`; a.click();
	}

	// P4: Calculate quality reps for header display
	const correctReps = reps.filter(r => r.is_correct === true).length;
	const totalReps = reps.length;
	const qualityRepsPercentage = totalReps > 0 ? Math.round((correctReps / totalReps) * 100) : 0;

	return (
		<div className="p-6 max-w-4xl mx-auto space-y-4">
			<h1 className="text-2xl font-semibold flex items-center gap-2">Session {pr.reps || pr.rom ? <span className="px-2 py-0.5 text-xs rounded bg-emerald-600 text-white">PR</span> : null}</h1>
			<div className="rounded-lg border p-4 flex items-center justify-between">
				<div>Exercise: <span className="capitalize">{session.exercise}</span></div>
				<div className="text-sm opacity-70">{new Date(session.started_at).toLocaleString()}</div>
			</div>
			{/* P4: Quality reps header */}
			<div className="rounded-lg border p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quality Reps: {correctReps}/{totalReps} ({qualityRepsPercentage}%)</h2>
						{session.avg_quality_score && (
							<p className="text-sm text-gray-600 dark:text-gray-400">Average Quality Score: {Math.round(session.avg_quality_score)}/100</p>
						)}
					</div>
					<div className="flex items-center gap-2">
						<div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
							<div 
								className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
								style={{ width: `${qualityRepsPercentage}%` }}
							/>
						</div>
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300">{qualityRepsPercentage}%</span>
					</div>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<button onClick={copySummary} className="px-3 py-2 rounded bg-black text-white">Copy summary</button>
				<button onClick={exportCSV} className="px-3 py-2 rounded border">Export CSV</button>
				<button onClick={shareImage} className="px-3 py-2 rounded border">Share image</button>
			</div>
			<div className="rounded-lg border p-4">
				<h2 className="font-medium mb-2">Reps</h2>
				{reps.length === 0 ? (
					<div className="text-sm opacity-70">No reps captured.</div>
				) : (
					<div className="space-y-4">
						<SessionChart reps={reps.map(r => ({ idx: r.idx, start_ms: r.start_ms, end_ms: r.end_ms, peak_depth: r.peak_depth, rom_score: r.rom_score }))} />
						<ul className="space-y-3">
							{reps.map((r) => (
								<li key={r.id} className="border rounded-lg p-3 bg-white dark:bg-gray-800">
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-3">
											<span className="font-medium">Rep {r.idx}</span>
											{/* P4: Correctness badge */}
											{r.is_correct !== null && (
												<span className={`px-2 py-1 rounded-full text-xs font-medium ${
													r.is_correct 
														? 'bg-green-100 text-green-800 border border-green-200' 
														: 'bg-red-100 text-red-800 border border-red-200'
												}`}>
													{r.is_correct ? '✅ Correct' : '⚠️ Try again'}
												</span>
											)}
											{/* P4: Quality badge */}
											{r.quality && (
												<span className={`px-2 py-1 rounded-full text-xs font-medium ${
													r.quality === 'excellent' ? 'bg-emerald-100 text-emerald-800' :
													r.quality === 'good' ? 'bg-green-100 text-green-800' :
													r.quality === 'fair' ? 'bg-yellow-100 text-yellow-800' :
													'bg-red-100 text-red-800'
												}`}>
													{r.quality} ({r.quality_score ? Math.round(r.quality_score) : '-'}/100)
												</span>
											)}
										</div>
										<div className="text-sm opacity-70">
											{(r.end_ms - r.start_ms).toFixed(0)} ms · ROM {r.rom_score ?? '-'} · depth {r.peak_depth ?? '-'}
										</div>
									</div>
									
									{/* P4: Confidence bar */}
									{r.confidence !== null && (
										<div className="mb-2">
											<div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
												<span>Confidence</span>
												<span>{Math.round(r.confidence * 100)}%</span>
											</div>
											<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
												<div 
													className={`h-full transition-all duration-300 ${
														r.confidence >= 0.8 ? 'bg-green-500' :
														r.confidence >= 0.6 ? 'bg-yellow-500' :
														'bg-red-500'
													}`}
													style={{ width: `${r.confidence * 100}%` }}
												/>
											</div>
										</div>
									)}
									
									{/* P4: Error chips */}
									{r.errors && r.errors.length > 0 && (
										<div className="flex flex-wrap gap-1">
											{r.errors.slice(0, 3).map((error, index) => (
												<div key={index} className={`px-2 py-1 rounded-full text-xs font-medium ${
													error.severity === 'high' ? 'bg-red-100 text-red-800 border border-red-200' :
													error.severity === 'medium' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
													'bg-yellow-100 text-yellow-800 border border-yellow-200'
												}`}>
													{error.type === 'depth_low' ? '📏 Depth' :
													 error.type === 'knee_valgus' ? '🦵 Knees' :
													 error.type === 'chest_drop' ? '📉 Chest' :
													 error.type === 'hip_sag' ? '📐 Hips' :
													 error.type === 'tempo_fast' ? '⚡ Fast' :
													 error.type === 'tempo_slow' ? '🐌 Slow' :
													 error.type === 'bodyline_poor' ? '📐 Line' :
													 error.type}
												</div>
											))}
											{r.errors.length > 3 && (
												<div className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
													+{r.errors.length - 3} more
												</div>
											)}
										</div>
									)}
								</li>
							))}
						</ul>
						<p className="text-xs opacity-70">Note: For privacy, video is not recorded; this timeline summarizes motion-only metrics.</p>
				</div>
			)}
		</div>
		
		{/* P7: Movement Embeddings - Similar Sessions and Compare to Best */}
		{session && userId && (
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
				<SimilarSessions 
					sessionId={params.id}
					userId={userId}
					exercise={session.exercise as 'squat' | 'pushup' | 'plank'}
				/>
				<CompareToBest
					currentSession={{
						sessionId: params.id,
						totalReps: session.total_reps || 0,
						avgQuality: session.avg_quality_score || 0,
						avgRom: avgRom || 0,
						createdAt: session.started_at
					}}
					userId={userId}
					exercise={session.exercise as 'squat' | 'pushup' | 'plank'}
				/>
			</div>
		)}
		
		{/* Form Report Generator */}
		<ReportGenerator sessionId={params.id} className="mb-6" />
		
		{/* Verification Details */}
		<VerificationDetails 
			session_id={params.id}
			onReportIssue={() => {
				alert('Report issue functionality - Coming soon! If you believe this session was incorrectly flagged, please contact support.');
			}}
		/>
		
		<div className="rounded-lg border p-4 space-y-2">
			<h2 className="font-medium">Notes</h2>
				<div className="flex gap-2 flex-wrap mb-1">
					{quickTags.map(t => <button key={t} onClick={() => addTag(t)} className="px-2 py-1 rounded bg-gray-200 text-sm">{t}</button>)}
				</div>
				<textarea aria-label="Session notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-28 border rounded p-2" placeholder="How did it feel? Any cues to remember next time?" />
				<button disabled={saving} onClick={saveNotes} className="px-3 py-2 rounded bg-black text-white text-sm disabled:opacity-50">{saving ? 'Saving…' : 'Save notes'}</button>
			</div>
		</div>
	);
} 