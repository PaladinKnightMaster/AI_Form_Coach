import { createClient } from '@supabase/supabase-js';

export const getSupabaseClient = () => {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
	const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
	if (!url || !anon) {
		console.warn('Supabase env not set; running in offline mode.');
	}
	return createClient(url ?? 'http://localhost', anon ?? 'anon');
};

export const getCurrentUserId = async (): Promise<string | null> => {
	try {
		const supabase = getSupabaseClient();
		const { data } = await supabase.auth.getUser();
		return data.user?.id ?? null;
	} catch {
		return null;
	}
}; 