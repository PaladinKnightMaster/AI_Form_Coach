"use client";
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AuthStatus() {
	const [email, setEmail] = useState<string | null>(null);

	useEffect(() => {
		const supabase = getSupabaseClient();
		let mounted = true;
		supabase.auth.getUser().then(({ data }) => {
			if (!mounted) return;
			setEmail(data.user?.email ?? null);
		});
		const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
			setEmail(session?.user?.email ?? null);
		});
		return () => { mounted = false; sub.subscription.unsubscribe(); };
	}, []);

	async function signOut() {
		const supabase = getSupabaseClient();
		await supabase.auth.signOut();
	}

	if (!email) return <Link href="/signin">Sign in</Link>;
	return (
		<div className="flex items-center gap-2 text-sm">
			<span className="opacity-80">{email}</span>
			<button onClick={signOut} className="underline">Sign out</button>
		</div>
	);
} 