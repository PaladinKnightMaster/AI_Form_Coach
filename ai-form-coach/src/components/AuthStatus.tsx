"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Account surface for the site header.
 *
 * Colours come from the Carriage header palette already used by SiteHeader
 * (#C9C0B2 / #F4EFE6 text, #2C3036 / #1F2228 borders, #070707 / #111418
 * surfaces, malachite CTA gradient). The previous slate/white styling was built
 * for a light header and rendered at ~1.9:1 against the near-black brand header.
 *
 * `variant="mobile"` renders the same account actions inline for the mobile
 * drawer, which has no room for a positioned dropdown. Without it the drawer
 * offered no sign-out and no route to /settings at all.
 */
interface AuthStatusProps {
	variant?: 'desktop' | 'mobile';
	/** Lets the mobile drawer close itself after a navigation or sign-out. */
	onNavigate?: () => void;
}

const ACCOUNT_LINKS: Array<{ href: string; label: string }> = [
	{ href: '/coach', label: 'Start session' },
	{ href: '/history', label: 'History' },
	{ href: '/settings', label: 'Settings' },
];

export default function AuthStatus({ variant = 'desktop', onNavigate }: AuthStatusProps) {
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
		onNavigate?.();
	};

	// Mobile: the drawer already shows a "Sign in" call to action when logged out,
	// so only the signed-in account block belongs here.
	if (variant === 'mobile') {
		if (!email) return null;
		return (
			<div className="space-y-1 border-t border-[#1F2228] pt-4">
				<div className="truncate px-3 py-1 text-xs text-[#C9C0B2]">{email}</div>
				<Link
					href="/settings"
					onClick={() => onNavigate?.()}
					className="block rounded-md px-3 py-3 text-[#F4EFE6] transition-colors hover:bg-[#111418]"
				>
					Settings
				</Link>
				<button
					type="button"
					onClick={handleSignOut}
					className="block min-h-[44px] w-full rounded-md px-3 py-3 text-left text-[#F4EFE6] transition-colors hover:bg-[#111418]"
				>
					Sign out
				</button>
			</div>
		);
	}

	if (!email) return <Link href="/signin" className="text-[#C9C0B2] transition-colors hover:text-[#F4EFE6]">Sign in</Link>;
	const initial = email.charAt(0).toUpperCase();
	return (
		<>
			<button ref={buttonRef} aria-label="Account menu" aria-expanded={open} aria-haspopup="true" className="flex items-center gap-2" onClick={() => setOpen(v => !v)}>
				<span
					className="inline-grid h-8 w-8 place-items-center rounded-full text-sm font-semibold text-[#F4EFE6]"
					style={{ background: 'linear-gradient(135deg, #149A80 0%, #094B3F 100%)' }}
				>
					{initial}
				</span>
			</button>
			{open && menuPos && (
				<div ref={menuRef} role="menu" className="fixed z-50 w-44 rounded-md border border-[#2C3036] bg-[#070707] p-1 text-sm shadow-lg" style={{ top: menuPos.top, right: menuPos.right }}>
					<div className="truncate px-2 py-1 text-[#C9C0B2]">{email}</div>
					{ACCOUNT_LINKS.map((link) => (
						<Link key={link.href} role="menuitem" href={link.href} className="block rounded px-2 py-1 text-[#F4EFE6] transition-colors hover:bg-[#111418]" onClick={() => setOpen(false)}>
							{link.label}
						</Link>
					))}
					<button role="menuitem" className="w-full rounded px-2 py-1 text-left text-[#F4EFE6] transition-colors hover:bg-[#111418]" onClick={handleSignOut}>Sign out</button>
				</div>
			)}
		</>
	);
}
