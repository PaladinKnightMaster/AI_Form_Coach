"use client";
import Link from 'next/link';
import ThemeToggle from '@/ui/ThemeToggle';
import AuthStatus from '@/components/AuthStatus';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function SiteHeader() {
	const [open, setOpen] = useState(false);
	const [isAuthed, setIsAuthed] = useState(false);
	useEffect(() => {
		const supabase = getSupabaseClient();
		supabase.auth.getUser().then(({ data }) => setIsAuthed(!!data.user));
		const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setIsAuthed(!!session?.user));
		return () => sub.subscription.unsubscribe();
	}, []);
	return (
		<header className="border-b sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-black/30">
			<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-black text-white px-3 py-1 rounded">Skip to content</a>
			<div className="container flex items-center justify-between h-14">
				<Link href="/" className="font-extrabold tracking-tight text-lg">AI Form Coach</Link>
				<nav className="hidden md:flex items-center gap-5 text-sm">
					<Link href="/coach">Coach</Link>
					<Link href="/history">History</Link>
					<Link href="/privacy">Privacy</Link>
					<ThemeToggle />
					{isAuthed ? <Link href="/coach" className="btn btn-primary">Start session</Link> : null}
					<AuthStatus />
				</nav>
				<button aria-label="Open menu" className="md:hidden rounded-md border px-2 py-1" onClick={() => setOpen(true)}>Menu</button>
			</div>
			{/* Drawer */}
			{open && (
				<div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
					<div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
					<aside className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-black shadow-xl p-4 grid content-start gap-3">
						<div className="flex items-center justify-between mb-2"><span className="font-semibold">Menu</span><button aria-label="Close" onClick={() => setOpen(false)}>×</button></div>
						<Link href="/coach" onClick={() => setOpen(false)}>Coach</Link>
						<Link href="/history" onClick={() => setOpen(false)}>History</Link>
						<Link href="/privacy" onClick={() => setOpen(false)}>Privacy</Link>
						<div className="pt-2"><ThemeToggle /></div>
						{isAuthed ? <Link href="/coach" className="btn btn-primary" onClick={() => setOpen(false)}>Start session</Link> : <Link href="/signin" className="btn btn-primary" onClick={() => setOpen(false)}>Sign in</Link>}
					</aside>
				</div>
			)}
		</header>
	);
} 