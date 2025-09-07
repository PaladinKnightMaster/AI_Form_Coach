"use client";
import { useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AuthStatus() {
	const [email, setEmail] = useState<string | null>(null);
	const [open, setOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

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

	useEffect(() => {
		function onDocClick(e: MouseEvent) { if (open && menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false); }
		function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
		document.addEventListener('mousedown', onDocClick);
		document.addEventListener('keydown', onKey);
		return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onKey); };
	}, [open]);

	async function signOut() {
		const supabase = getSupabaseClient();
		await supabase.auth.signOut();
		setOpen(false);
	}

	if (!email) return <Link href="/signin">Sign in</Link>;
	const initial = email?.charAt(0).toUpperCase() ?? '?';
	return (
		<div className="relative" ref={menuRef}>
			<button aria-label="Account menu" className="flex items-center gap-2" onClick={() => setOpen(v => !v)}>
				<span className="inline-grid place-items-center h-8 w-8 rounded-full bg-black text-white text-sm">{initial}</span>
			</button>
			{open && (
				<div role="menu" className="absolute right-0 mt-2 w-44 rounded-md border bg-white dark:bg-black shadow-lg p-1 text-sm">
					<div className="px-2 py-1 opacity-70 truncate">{email}</div>
					<Link role="menuitem" href="/coach" className="block px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => setOpen(false)}>Start session</Link>
					<Link role="menuitem" href="/history" className="block px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => setOpen(false)}>History</Link>
					<button role="menuitem" className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-white/10" onClick={signOut}>Sign out</button>
				</div>
			)}
		</div>
	);
} 