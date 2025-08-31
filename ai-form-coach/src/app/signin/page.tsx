"use client";
import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function SignIn() {
	const [email, setEmail] = useState('');
	const [status, setStatus] = useState<string>('');

	async function sendMagicLink(e: React.FormEvent) {
		e.preventDefault();
		const supabase = getSupabaseClient();
		const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: typeof window !== 'undefined' ? `${location.origin}/` : undefined } });
		setStatus(error ? `Error: ${error.message}` : 'Check your email for the magic link');
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<form onSubmit={sendMagicLink} className="w-full max-w-md space-y-4 bg-gray-100 dark:bg-gray-900 p-6 rounded-xl border">
				<h1 className="text-2xl font-semibold">Sign in</h1>
				<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-md border px-3 py-2 bg-white dark:bg-black" />
				<button className="w-full rounded-md bg-black text-white py-2">Send magic link</button>
				<p className="text-sm opacity-80">{status}</p>
			</form>
		</div>
	);
} 