import { getSupabaseClient } from '@/lib/supabase/client';

async function main() {
	const supabase = getSupabaseClient();
	const started = new Date(Date.now() - 60_000);
	const ended = new Date();
	const { data: s, error } = await supabase.from('sessions').insert({ user_id: null, exercise: 'squat', started_at: started, ended_at: ended, summary: { repCount: 12 } }).select('*').single();
	if (error) throw error;
	console.log('Seeded session', s?.id);
}

main().catch((e) => { console.error(e); process.exit(1); }); 