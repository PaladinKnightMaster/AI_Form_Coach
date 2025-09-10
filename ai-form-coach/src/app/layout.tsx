import type { Metadata } from "next";
import LogSilencer from '@/components/LogSilencer';
import "./globals.css";
import Script from 'next/script';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
	title: {
		default: 'AI Form Coach - Real-time AI Form Coaching in Your Browser',
		template: '%s · AI Form Coach'
	},
	description: 'Get instant form cues, rep counts, and progress tracking with AI coaching that runs privately in your browser. No video uploads, works offline.',
	keywords: ['AI fitness coach', 'form checker', 'workout tracker', 'pose detection', 'privacy-first fitness', 'browser-based coaching'],
	authors: [{ name: 'AI Form Coach' }],
	creator: 'AI Form Coach',
	publisher: 'AI Form Coach',
	metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://aiformcoach.com'),
	openGraph: {
		type: 'website',
		locale: 'en_US',
		url: '/',
		siteName: 'AI Form Coach',
		title: 'AI Form Coach - Real-time AI Form Coaching in Your Browser',
		description: 'Get instant form cues, rep counts, and progress tracking with AI coaching that runs privately in your browser. No video uploads, works offline.',
		images: [
			{
				url: '/og-image?title=AI Form Coach&subtitle=Real-time AI Form Coaching — right in your browser',
				width: 1200,
				height: 630,
				alt: 'AI Form Coach - Private, real-time form coaching in your browser'
			}
		]
	},
	twitter: {
		card: 'summary_large_image',
		site: '@aiformcoach',
		creator: '@aiformcoach',
		title: 'AI Form Coach - Real-time AI Form Coaching in Your Browser',
		description: 'Get instant form cues, rep counts, and progress tracking with AI coaching that runs privately in your browser. No video uploads, works offline.',
		images: ['/og-image?title=AI Form Coach&subtitle=Real-time AI Form Coaching — right in your browser']
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	verification: {
		google: process.env.GOOGLE_SITE_VERIFICATION,
	}
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
	const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC || 'https://analytics.umami.is/script.js';
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<meta name="theme-color" content="#111827" />
				<meta name="color-scheme" content="light dark" />
			</head>
			<body className="antialiased" suppressHydrationWarning>
				<SiteHeader />
				<main id="main-content">
					{children}
				</main>
				<LogSilencer />
				<SiteFooter />
				{umamiWebsiteId ? (
					<Script async defer src={umamiSrc} data-website-id={umamiWebsiteId} />
				) : null}
			</body>
		</html>
	);
}
