"use client";
import Link from 'next/link';
import ThemeToggle from '@/ui/ThemeToggle';

export default function SiteHeader() {
	return (
		<header className="border-b sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-black/30">
			<div className="container flex items-center justify-between h-14">
				<Link href="/" className="font-semibold">AI Form Coach</Link>
				<nav className="flex items-center gap-4 text-sm">
					<Link href="/coach">Coach</Link>
					<Link href="/history">History</Link>
					<Link href="/privacy">Privacy</Link>
					<ThemeToggle />
				</nav>
			</div>
		</header>
	);
} 