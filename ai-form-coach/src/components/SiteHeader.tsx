"use client";
import Link from 'next/link';
import ThemeToggle from '@/ui/ThemeToggle';
import AuthStatus from '@/components/AuthStatus';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Button, Icon } from '@/ui/DS';

export default function SiteHeader() {
	const [open, setOpen] = useState(false);
	const [isAuthed, setIsAuthed] = useState(false);
	useEffect(() => {
		const supabase = getSupabaseClient();
		supabase.auth.getUser().then(({ data }) => setIsAuthed(!!data.user));
		const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setIsAuthed(!!session?.user));
		return () => sub.subscription.unsubscribe();
	}, []);

	// Handle escape key to close menu
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && open) {
				setOpen(false);
			}
		};
		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	}, [open]);
	return (
		<header className="border-b sticky top-0 z-40 backdrop-blur bg-white/80 dark:bg-black/50 shadow-sm" role="banner" suppressHydrationWarning>
			<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-black text-white px-3 py-1 rounded z-50">Skip to content</a>
			<div className="container flex items-center justify-between h-16">
				<Link href="/" className="font-extrabold tracking-tight text-xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
					AI Form Coach
				</Link>
				<nav className="hidden md:flex items-center gap-6 text-sm" role="navigation" aria-label="Main navigation">
					<Link href="/" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Home</Link>
					<Link href="/coach" className="hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1">
						<Icon name="activity" className="w-4 h-4" />
						Coach
					</Link>
					{isAuthed ? (
						<>
							<Link href="/nutrition" className="hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1">
								<Icon name="heart" className="w-4 h-4" />
								Nutrition
							</Link>
							<Link href="/plans" className="hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1">
								<Icon name="calendar" className="w-4 h-4" />
								Plans
							</Link>
							<Link href="/coach-packs" className="hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1 whitespace-nowrap">
								<Icon name="package" className="w-4 h-4" />
								Coach Packs
							</Link>
							<Link href="/challenges" className="hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1">
								<Icon name="trophy" className="w-4 h-4" />
								Challenges
							</Link>
							<Link href="/health" className="hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1">
								<Icon name="trending-up" className="w-4 h-4" />
								Health
							</Link>
							<Link href="/history" className="hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1">
								<Icon name="bar-chart-2" className="w-4 h-4" />
								History
							</Link>
						</>
					) : (
						<Link href="/signin" className="hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1">
							<Icon name="lock" className="w-4 h-4" />
							Pro Features
						</Link>
					)}
					<Link href="/pricing" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Pricing</Link>
					<Link href="/faq" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">FAQ</Link>
					{isAuthed ? <Link href="/account" className="hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1">
						<Icon name="user" className="w-4 h-4" />
						Account
					</Link> : null}
					<ThemeToggle />
					{isAuthed ? (
						<Link href="/coach">
							<Button variant="primary" size="sm" className="flex items-center gap-2">
								<Icon name="play" className="w-4 h-4" />
								Start Session
							</Button>
						</Link>
					) : null}
					<AuthStatus />
				</nav>
				<button 
					aria-label="Open menu" 
					className="md:hidden rounded-md border px-3 py-2 min-h-[44px] flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" 
					onClick={() => setOpen(true)}
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" suppressHydrationWarning>
						<line x1="3" y1="6" x2="21" y2="6"/>
						<line x1="3" y1="12" x2="21" y2="12"/>
						<line x1="3" y1="18" x2="21" y2="18"/>
					</svg>
					Menu
				</button>
			</div>
			{/* Drawer */}
			{open && (
				<div className="fixed inset-0 z-50" aria-modal="true" role="dialog" aria-labelledby="mobile-menu-title">
					<div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden="true" />
					<aside className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-black shadow-xl p-6 grid content-start gap-4 transform transition-transform duration-300 ease-out" role="navigation" aria-label="Mobile navigation">
						<div className="flex items-center justify-between mb-4">
							<span id="mobile-menu-title" className="font-semibold text-lg">Menu</span>
							<button 
								aria-label="Close menu" 
								onClick={() => setOpen(false)} 
								className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center"
							>
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" suppressHydrationWarning>
									<line x1="18" y1="6" x2="6" y2="18"/>
									<line x1="6" y1="6" x2="18" y2="18"/>
								</svg>
							</button>
						</div>
						<nav className="space-y-1">
							<Link href="/" onClick={() => setOpen(false)} className="block py-3 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Home</Link>
							<Link href="/coach" onClick={() => setOpen(false)} className="block py-3 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Coach</Link>
							{isAuthed ? (
								<>
									<Link href="/nutrition" onClick={() => setOpen(false)} className="block py-3 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Nutrition</Link>
									<Link href="/plans" onClick={() => setOpen(false)} className="block py-3 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Plans</Link>
									<Link href="/coach-packs" onClick={() => setOpen(false)} className="block py-3 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap">Coach Packs</Link>
									<Link href="/challenges" onClick={() => setOpen(false)} className="block py-3 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Challenges</Link>
									<Link href="/leaderboards" onClick={() => setOpen(false)} className="block py-3 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Leaderboards</Link>
									<Link href="/health" onClick={() => setOpen(false)} className="block py-3 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Health</Link>
									<Link href="/history" onClick={() => setOpen(false)} className="block py-3 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">History</Link>
								</>
							) : (
								<Link href="/signin" onClick={() => setOpen(false)} className="block py-3 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
									<Icon name="lock" className="w-4 h-4" />
									Pro Features
								</Link>
							)}
							<Link href="/pricing" onClick={() => setOpen(false)} className="block py-3 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Pricing</Link>
							<Link href="/faq" onClick={() => setOpen(false)} className="block py-3 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">FAQ</Link>
							<Link href="/privacy" onClick={() => setOpen(false)} className="block py-3 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Privacy</Link>
							{isAuthed ? <Link href="/account" onClick={() => setOpen(false)} className="block py-3 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Account</Link> : null}
						</nav>
						<div className="border-t pt-4 space-y-4">
							<div className="px-3"><ThemeToggle /></div>
							{isAuthed ? 
								<Link href="/coach" className="btn btn-primary w-full" onClick={() => setOpen(false)}>Start session</Link> : 
								<Link href="/signin" className="btn btn-primary w-full" onClick={() => setOpen(false)}>Sign in</Link>
							}
						</div>
					</aside>
				</div>
			)}
		</header>
	);
} 