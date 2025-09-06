import type { Metadata } from "next";
import Link from 'next/link';
import AuthStatus from '@/components/AuthStatus';
import LogSilencer from '@/components/LogSilencer';
import "./globals.css";
import Script from 'next/script';

export const metadata: Metadata = {
	title: "AI Form Coach",
	description: "Private, real-time form coaching in the browser",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
	const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC || 'https://analytics.umami.is/script.js';
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="antialiased" suppressHydrationWarning>
				<nav className="border-b p-4 flex items-center justify-between">
					<Link href="/" className="font-semibold">AI Form Coach</Link>
					<div className="flex items-center gap-3 text-sm">
						<Link href="/coach">Coach</Link>
						<Link href="/history">History</Link>
						<Link href="/privacy">Privacy</Link>
						<AuthStatus />
					</div>
				</nav>
				{children}
				<LogSilencer />
				<footer className="border-t p-4 text-center text-sm opacity-70">All processing happens in your browser.</footer>
				{umamiWebsiteId ? (
					<Script async defer src={umamiSrc} data-website-id={umamiWebsiteId} />
				) : null}
			</body>
		</html>
	);
}
