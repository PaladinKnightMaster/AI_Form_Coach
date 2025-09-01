import { getSupabaseClient } from '@/lib/supabase/client';

type SessionRow = { id: string; exercise: 'squat'|'pushup'|'plank'; started_at: string; user_id: string };
 type RepRow = { session_id: string; rom_score: number | null };

export async function suggestNextGoal(userId: string, exercise: 'squat'|'pushup'|'plank', current: { type: 'reps'|'time'; value: number }) {
	if (current.type !== 'reps') return current;
	const supabase = getSupabaseClient();
	const { data: sessions } = await supabase.from('sessions').select('*').eq('user_id', userId).eq('exercise', exercise).order('started_at', { ascending: false }).limit(2) as { data: SessionRow[] | null };
	if (!sessions || sessions.length < 2) return current;
	const { data: reps } = await supabase.from('reps').select('rom_score, session_id').in('session_id', sessions.map((s) => s.id)) as { data: RepRow[] | null };
	if (!reps?.length) return current;
	const bySession: Record<string, number[]> = {};
	reps.forEach((r) => { const arr = bySession[r.session_id] ?? (bySession[r.session_id] = []); if (typeof r.rom_score === 'number') arr.push(r.rom_score); });
	const romOk = sessions.every((s) => {
		const arr = bySession[s.id] ?? []; const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
		return avg >= 0.8;
	});
	if (romOk) return { ...current, value: current.value + 2 };
	return current;
} 