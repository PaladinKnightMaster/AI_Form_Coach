"use client";
import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';

const SessionChart = dynamic(() => import('@/components/SessionChart'), { ssr: false });

type S = { id: string; exercise: string; started_at: string; ended_at: string | null; total_reps: number | null; notes: string | null };
 type R = { id: string; idx: number; start_ms: number; end_ms: number; peak_depth: number | null; rom_score: number | null };
 type OS = { id: string; total_reps: number | null };
 type OR = { session_id: string; rom_score: number | null };

export default function SessionDetail() {
	const params = useParams<{ id: string }>();
	const [session, setSession] = useState<S | null>(null);
	const [reps, setReps] = useState<R[]>([]);
	const [notes, setNotes] = useState('');
	const [saving, setSaving] = useState(false);
	const [pr, setPr] = useState<{ reps: boolean; rom: boolean }>({ reps: false, rom: false });

	useEffect(() => {
		(async () => {
			const supabase = getSupabaseClient();
			const { data: s } = await supabase.from('sessions').select('id,exercise,started_at,ended_at,total_reps,notes').eq('id', params.id).single() as { data: S | null };
			const { data: r } = await supabase.from('reps').select('id,idx,start_ms,end_ms,peak_depth,rom_score').eq('session_id', params.id).order('start_ms') as { data: R[] | null };
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
		const header = 'idx,start_ms,end_ms,peak_depth,rom_score';
		const rows = reps.map((r) => [r.idx, r.start_ms, r.end_ms, r.peak_depth ?? '', r.rom_score ?? ''].join(','));
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

	return (
		<div className="p-6 max-w-4xl mx-auto space-y-4">
			<h1 className="text-2xl font-semibold flex items-center gap-2">Session {pr.reps || pr.rom ? <span className="px-2 py-0.5 text-xs rounded bg-emerald-600 text-white">PR</span> : null}</h1>
			<div className="rounded-lg border p-4 flex items-center justify-between">
				<div>Exercise: <span className="capitalize">{session.exercise}</span></div>
				<div className="text-sm opacity-70">{new Date(session.started_at).toLocaleString()}</div>
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