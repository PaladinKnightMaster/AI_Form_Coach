import type { Metadata } from "next";
import LogSilencer from '@/components/LogSilencer';
import "./globals.css";
import Script from 'next/script';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
	title: {
		default: 'AI Form Coach',
		template: '%s · AI Form Coach'
	},
	description: 'Private, real-time form coaching in the browser',
	metadataBase: new URL('https://example.com'),
	openGraph: { title: 'AI Form Coach', description: 'Private, real-time form coaching in the browser', type: 'website' },
	twitter: { card: 'summary_large_image', title: 'AI Form Coach', description: 'Private, real-time form coaching in the browser' }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
	const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC || 'https://analytics.umami.is/script.js';
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="antialiased" suppressHydrationWarning>
				<SiteHeader />
				{children}
				<LogSilencer />
				<SiteFooter />
				{umamiWebsiteId ? (
					<Script async defer src={umamiSrc} data-website-id={umamiWebsiteId} />
				) : null}
			</body>
		</html>
	);
}
