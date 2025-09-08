"use client";
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignIn() {
	const [mode, setMode] = useState<'signin'|'signup'|'reset-request'>('signin');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState<string>('');
	const router = useRouter();

	useEffect(() => { setStatus(''); if (mode!=='signup') { setConfirm(''); } }, [mode]);

	async function ensureProfile(userId: string) {
		try {
			const supabase = getSupabaseClient();
			await supabase.from('profiles').upsert({ id: userId }, { onConflict: 'id' });
		} catch {}
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault(); setLoading(true); setStatus('');
		const supabase = getSupabaseClient();
		try {
			if (mode === 'signup') {
				if (!email || !password) { setStatus('Enter email and password'); return; }
				if (password.length < 6) { setStatus('Password must be at least 6 characters'); return; }
				if (password !== confirm) { setStatus('Passwords do not match'); return; }
				const { data, error } = await supabase.auth.signUp({ email, password });
				if (error) {
					const msg = error.message.toLowerCase();
					if (error.status === 422 || msg.includes('registered') || msg.includes('already')) {
						setStatus('An account with this email already exists. Please sign in.');
						setMode('signin');
					} else {
						setStatus(`Error: ${error.message}`);
					}
					return;
				}
				if (data.user) await ensureProfile(data.user.id);
				setStatus('Check your email to confirm your account');
				return;
			}
			if (mode === 'reset-request') {
				if (!email) { setStatus('Enter your email'); return; }
				const redirectTo = typeof window !== 'undefined' ? `${location.origin}/reset-password` : undefined;
				const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
				if (error) { setStatus(`Error: ${error.message}`); return; }
				setStatus('Check your email for a reset link');
				return;
			}
			// Sign in
			const { data, error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) {
				const msg = error.message.toLowerCase();
				if (msg.includes('invalid') || msg.includes('wrong')) {
					setStatus('Invalid email or password');
				} else {
					setStatus(`Error: ${error.message}`);
				}
				return;
			}
			if (data.user) await ensureProfile(data.user.id);
			router.push('/');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<form onSubmit={onSubmit} className="w-full max-w-md space-y-4 bg-gray-100 dark:bg-gray-900 p-6 rounded-xl border">
				<div className="flex items-center gap-2 text-sm">
					<button type="button" className={`px-3 py-1 rounded ${mode==='signin'?'bg-black text-white':''}`} onClick={() => setMode('signin')}>Sign in</button>
					<button type="button" className={`px-3 py-1 rounded ${mode==='signup'?'bg-black text-white':''}`} onClick={() => setMode('signup')}>Sign up</button>
					<button type="button" className={`px-3 py-1 rounded ${mode==='reset-request'?'bg-black text-white':''}`} onClick={() => setMode('reset-request')}>Forgot password</button>
				</div>
				<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-md border px-3 py-2 bg-white dark:bg-black" />
				{mode!=='reset-request' ? (
					<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-md border px-3 py-2 bg-white dark:bg-black" />
				) : null}
				{mode==='signup' ? (
					<input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" className="w-full rounded-md border px-3 py-2 bg-white dark:bg-black" />
				) : null}
				<button disabled={loading} className="w-full rounded-md bg-black text-white py-2">{loading ? 'Please wait…' : mode==='signup' ? 'Create account' : mode==='reset-request' ? 'Send reset link' : 'Sign in'}</button>
				<p className="text-sm opacity-80">{status}</p>
			</form>
		</div>
	);
} 