// Supabase Edge Function: update-metrics
// Computes sitewide metrics from sessions and upserts into public.metrics_public (id=1)
// Schedule this function in the Supabase dashboard (Functions -> Schedules)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (_req) => {
	const url = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
	const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE');
	if (!url || !serviceRoleKey) {
		return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }), { status: 500, headers: { 'content-type': 'application/json' } });
	}
	const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

	try {
		// Rolling window (60d). Adjust or remove as desired.
		const since = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();
		const { data: sessions, error } = await supabase
			.from('sessions')
			.select('started_at,total_time_seconds,total_reps,avg_pose_quality')
			.gte('started_at', since)
			.limit(100000);
		if (error) throw error;
		const arr = sessions ?? [];
		const totalSeconds = arr.reduce((a, s) => a + Number(s.total_time_seconds ?? 0), 0);
		const avgSessionMinutes = arr.length ? Math.round((totalSeconds / arr.length) / 60) : 0;
		const totalRepsCounted = arr.reduce((a, s) => a + Number(s.total_reps ?? 0), 0);
		const now = Date.now();
		const d14 = 14 * 24 * 3600 * 1000;
		const recent = arr.filter(s => now - new Date(s.started_at).getTime() <= d14);
		const prev = arr.filter(s => { const t = now - new Date(s.started_at).getTime(); return t > d14 && t <= d14 * 2; });
		const avg = (xs: typeof arr) => { const vals = xs.map(s => Number(s.avg_pose_quality ?? 0)).filter(n => Number.isFinite(n)); return vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : 0; };
		const recentAvg = avg(recent);
		const prevAvg = avg(prev);
		const romImprovedPct = prevAvg > 0 ? Math.max(0, Math.round(((recentAvg - prevAvg) / prevAvg) * 100)) : 0;

		const payload = { id: 1, avg_session_minutes: avgSessionMinutes, total_reps_counted: totalRepsCounted, rom_improved_pct: romImprovedPct };
		const { error: upErr } = await supabase.from('metrics_public').upsert(payload, { onConflict: 'id' });
		if (upErr) throw upErr;
		return new Response(JSON.stringify({ ok: true, payload }), { headers: { 'content-type': 'application/json' } });
	} catch (e) {
		return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'content-type': 'application/json' } });
	}
}); 