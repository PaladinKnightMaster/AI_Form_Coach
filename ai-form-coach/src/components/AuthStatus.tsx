"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthStatus() {
	const { user, signOut } = useAuth();
	const [open, setOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const email = user?.email ?? null;

	useEffect(() => {
		function onDocClick(e: MouseEvent) { if (open && menuRef.current && !menuRef.current.contains(e.target as Node) && buttonRef.current && !buttonRef.current.contains(e.target as Node)) setOpen(false); }
		function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
		document.addEventListener('mousedown', onDocClick);
		document.addEventListener('keydown', onKey);
		return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onKey); };
	}, [open]);

	// Position dropdown relative to button, but render at fixed position to escape stacking context
	const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
	useEffect(() => {
		if (!open || !buttonRef.current) return;
		const rect = buttonRef.current.getBoundingClientRect();
		setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
	}, [open]);

	const handleSignOut = async () => {
		await signOut();
		setOpen(false);
	};

	if (!email) return <Link href="/signin" className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors">Sign in</Link>;
	const initial = email.charAt(0).toUpperCase();
	return (
		<>
			<button ref={buttonRef} aria-label="Account menu" aria-expanded={open} aria-haspopup="true" className="flex items-center gap-2" onClick={() => setOpen(v => !v)}>
				<span className="inline-grid place-items-center h-8 w-8 rounded-full bg-slate-900 text-white text-sm dark:bg-white dark:text-slate-900">{initial}</span>
			</button>
			{open && menuPos && (
				<div ref={menuRef} role="menu" className="fixed z-50 w-44 rounded-md border border-slate-200 bg-white shadow-lg p-1 text-sm dark:border-slate-700 dark:bg-slate-900" style={{ top: menuPos.top, right: menuPos.right }}>
					<div className="px-2 py-1 text-slate-500 dark:text-slate-400 truncate">{email}</div>
					<Link role="menuitem" href="/coach" className="block px-2 py-1 rounded text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>Start session</Link>
					<Link role="menuitem" href="/history" className="block px-2 py-1 rounded text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>History</Link>
					<Link role="menuitem" href="/settings" className="block px-2 py-1 rounded text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>Settings</Link>
					<button role="menuitem" className="w-full text-left px-2 py-1 rounded text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" onClick={handleSignOut}>Sign out</button>
				</div>
			)}
		</>
	);
}
