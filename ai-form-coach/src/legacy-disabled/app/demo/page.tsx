"use client";
import { useState } from 'react';
import { Container, Button, Badge, Icon } from '@/ui/DS';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import SocialProofBand from '@/components/SocialProofBand';

export default function ComponentDemo() {
	const [activeSection, setActiveSection] = useState<string>('buttons');

	const sections = [
		{ id: 'buttons', label: 'Buttons & Badges' },
		{ id: 'header', label: 'Header States' },
		{ id: 'footer', label: 'Footer' },
		{ id: 'auth', label: 'Auth Cards' },
		{ id: 'landing', label: 'Landing Sections' },
		{ id: 'mobile', label: 'Mobile Breakpoints' }
	];

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="bg-white dark:bg-black border-b sticky top-0 z-50">
				<Container>
					<div className="py-4">
						<h1 className="text-2xl font-bold mb-4">Component Demo - Visual QA</h1>
						<nav className="flex gap-2 flex-wrap">
							{sections.map(section => (
								<button
									key={section.id}
									onClick={() => setActiveSection(section.id)}
									className={`px-3 py-1 rounded text-sm transition ${
										activeSection === section.id
											? 'bg-black text-white dark:bg-white dark:text-black'
											: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
									}`}
								>
									{section.label}
								</button>
							))}
						</nav>
					</div>
				</Container>
			</div>

			<Container>
				<div className="py-8">
					{activeSection === 'buttons' && <ButtonsAndBadgesDemo />}
					{activeSection === 'header' && <HeaderStatesDemo />}
					{activeSection === 'footer' && <FooterDemo />}
					{activeSection === 'auth' && <AuthCardsDemo />}
					{activeSection === 'landing' && <LandingSectionsDemo />}
					{activeSection === 'mobile' && <MobileBreakpointsDemo />}
				</div>
			</Container>
		</div>
	);
}

function ButtonsAndBadgesDemo() {
	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-xl font-semibold mb-4">Buttons</h2>
				<div className="grid gap-4">
					<div className="space-y-3">
						<h3 className="font-medium">Primary Buttons</h3>
						<div className="flex flex-wrap gap-3">
							<Button variant="primary">Start training</Button>
							<Button variant="primary" disabled>Loading...</Button>
							<Button variant="primary">
								<Icon name="activity" />
								With icon
							</Button>
						</div>
					</div>
					<div className="space-y-3">
						<h3 className="font-medium">Secondary Buttons</h3>
						<div className="flex flex-wrap gap-3">
							<Button variant="secondary">See demo</Button>
							<Button variant="secondary" disabled>Disabled</Button>
							<Button variant="secondary">
								<Icon name="download" />
								Export data
							</Button>
						</div>
					</div>
					<div className="space-y-3">
						<h3 className="font-medium">Ghost Buttons</h3>
						<div className="flex flex-wrap gap-3">
							<Button variant="ghost">Cancel</Button>
							<Button variant="ghost">
								<Icon name="chevron-down" />
								Options
							</Button>
						</div>
					</div>
				</div>
			</div>

			<div>
				<h2 className="text-xl font-semibold mb-4">Badges</h2>
				<div className="flex flex-wrap gap-3">
					<Badge tone="success">Private by design</Badge>
					<Badge tone="success">No uploads</Badge>
					<Badge tone="warning">Beta</Badge>
				</div>
			</div>

			<div>
				<h2 className="text-xl font-semibold mb-4">Icons</h2>
				<div className="grid grid-cols-4 gap-4 text-sm">
					<div className="flex items-center gap-2"><Icon name="check" /> check</div>
					<div className="flex items-center gap-2"><Icon name="alert" /> alert</div>
					<div className="flex items-center gap-2"><Icon name="activity" /> activity</div>
					<div className="flex items-center gap-2"><Icon name="message" /> message</div>
					<div className="flex items-center gap-2"><Icon name="pause" /> pause</div>
					<div className="flex items-center gap-2"><Icon name="chart" /> chart</div>
					<div className="flex items-center gap-2"><Icon name="download" /> download</div>
					<div className="flex items-center gap-2"><Icon name="sun" /> sun</div>
				</div>
			</div>
		</div>
	);
}

function HeaderStatesDemo() {
	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-xl font-semibold mb-4">Header - Live Component</h2>
				<div className="border rounded-lg overflow-hidden">
					<SiteHeader />
				</div>
				<p className="text-sm opacity-70 mt-2">
					This is the live header component. Test the mobile menu by resizing your browser or using dev tools.
				</p>
			</div>

			<div>
				<h2 className="text-xl font-semibold mb-4">Mobile Menu Test</h2>
				<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
					<h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Testing Instructions:</h3>
					<ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-decimal list-inside">
						<li>Open browser dev tools (F12)</li>
						<li>Toggle device toolbar (Ctrl+Shift+M)</li>
						<li>Select mobile device (iPhone, Android, etc.)</li>
						<li>Click &ldquo;Menu&rdquo; button in header</li>
						<li>Verify drawer slides in from right</li>
						<li>Test all navigation links work</li>
						<li>Verify close button and backdrop work</li>
					</ol>
				</div>
			</div>
		</div>
	);
}

function FooterDemo() {
	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-xl font-semibold mb-4">Footer - Live Component</h2>
				<div className="border rounded-lg overflow-hidden">
					<SiteFooter />
				</div>
			</div>
		</div>
	);
}

function AuthCardsDemo() {
	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-xl font-semibold mb-4">Auth Cards</h2>
				<div className="grid md:grid-cols-2 gap-6">
					<div className="border rounded-lg p-4 bg-white dark:bg-black">
						<h3 className="font-medium mb-3">Sign In Card</h3>
						<div className="scale-75 origin-top-left w-[133%]">
							<div className="min-h-screen flex items-center justify-center p-6">
								<div className="w-full max-w-md">
									<div className="text-center mb-8">
										<div className="font-extrabold tracking-tight text-2xl">
											AI Form Coach
										</div>
									</div>
									<div className="card p-8 space-y-6">
										<div className="text-center">
											<h1 className="text-2xl font-semibold mb-2">Welcome back</h1>
											<p className="text-sm opacity-80">Private, real-time form coaching</p>
										</div>
										<form className="space-y-4">
											<div>
												<label className="block text-sm font-medium mb-1">Email</label>
												<input
													type="email"
													className="w-full px-3 py-2 border rounded-md"
													placeholder="you@example.com"
													disabled
												/>
											</div>
											<div>
												<label className="block text-sm font-medium mb-1">Password</label>
												<input
													type="password"
													className="w-full px-3 py-2 border rounded-md"
													placeholder="••••••••"
													disabled
												/>
											</div>
											<div className="btn btn-primary w-full opacity-50 cursor-not-allowed">Sign in</div>
										</form>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="border rounded-lg p-4 bg-white dark:bg-black">
						<h3 className="font-medium mb-3">Sign Up Card</h3>
						<div className="scale-75 origin-top-left w-[133%]">
							<div className="min-h-screen flex items-center justify-center p-6">
								<div className="w-full max-w-md">
									<div className="text-center mb-8">
										<div className="font-extrabold tracking-tight text-2xl">
											AI Form Coach
										</div>
									</div>
									<div className="card p-8 space-y-6">
										<div className="text-center">
											<h1 className="text-2xl font-semibold mb-2">Create account</h1>
											<p className="text-sm opacity-80">Private, real-time form coaching</p>
										</div>
										<form className="space-y-4">
											<div>
												<label className="block text-sm font-medium mb-1">Email</label>
												<input
													type="email"
													className="w-full px-3 py-2 border rounded-md"
													placeholder="you@example.com"
													disabled
												/>
											</div>
											<div>
												<label className="block text-sm font-medium mb-1">Password</label>
												<input
													type="password"
													className="w-full px-3 py-2 border rounded-md"
													placeholder="••••••••"
													disabled
												/>
											</div>
											<div className="btn btn-primary w-full opacity-50 cursor-not-allowed">Create account</div>
										</form>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<p className="text-sm opacity-70 text-center">
					Note: Form inputs are disabled for demo purposes. Visit <Link href="/signin" className="text-blue-600 hover:underline">/signin</Link> for functional forms.
				</p>
			</div>
		</div>
	);
}

function LandingSectionsDemo() {
	return (
		<div className="space-y-12">
			<div>
				<h2 className="text-xl font-semibold mb-4">Social Proof Band</h2>
				<div className="border rounded-lg p-4">
					<SocialProofBand />
				</div>
			</div>

			<div>
				<h2 className="text-xl font-semibold mb-4">Interactive Landing Sections</h2>
				<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
					<p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
						The following sections contain interactive elements and are best viewed on the live landing page:
					</p>
					<div className="grid md:grid-cols-3 gap-4">
						<div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
							<h3 className="font-medium mb-2">Pricing Section</h3>
							<p className="text-xs opacity-70 mb-3">Monthly/yearly toggle, upgrade buttons</p>
							<Link href="/#pricing" className="text-blue-600 hover:underline text-sm">
								View on landing →
							</Link>
						</div>
						<div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
							<h3 className="font-medium mb-2">FAQ Section</h3>
							<p className="text-xs opacity-70 mb-3">Expandable questions and answers</p>
							<Link href="/#faq" className="text-blue-600 hover:underline text-sm">
								View on landing →
							</Link>
						</div>
						<div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
							<h3 className="font-medium mb-2">Final CTA</h3>
							<p className="text-xs opacity-70 mb-3">Gradient background, action buttons</p>
							<Link href="/#cta" className="text-blue-600 hover:underline text-sm">
								View on landing →
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function MobileBreakpointsDemo() {
	const breakpoints = [
		{ name: 'Mobile Portrait', width: '375px', height: '667px', device: 'iPhone SE' },
		{ name: 'Mobile Landscape', width: '667px', height: '375px', device: 'iPhone SE' },
		{ name: 'Large Mobile', width: '414px', height: '896px', device: 'iPhone 11 Pro' },
		{ name: 'Tablet Portrait', width: '768px', height: '1024px', device: 'iPad' },
		{ name: 'Tablet Landscape', width: '1024px', height: '768px', device: 'iPad' },
		{ name: 'Desktop', width: '1280px', height: '800px', device: 'Desktop' }
	];

	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-xl font-semibold mb-4">Mobile Breakpoint Testing</h2>
				<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
					<h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Screenshot Instructions:</h3>
					<ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
						<li>Open browser dev tools (F12)</li>
						<li>Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)</li>
						<li>Set custom dimensions using the values below</li>
						<li>Navigate to different pages (/, /coach, /signin, etc.)</li>
						<li>Take screenshots for each breakpoint</li>
						<li>Test header menu interaction on mobile sizes</li>
					</ol>
				</div>

				<div className="grid md:grid-cols-2 gap-4">
					{breakpoints.map((bp, i) => (
						<div key={i} className="border rounded-lg p-4">
							<div className="flex justify-between items-start mb-2">
								<h3 className="font-medium">{bp.name}</h3>
								<span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
									{bp.device}
								</span>
							</div>
							<div className="text-sm opacity-70">
								{bp.width} × {bp.height}
							</div>
							<div className="mt-3 text-xs">
								<code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
									{bp.width} × {bp.height}
								</code>
							</div>
						</div>
					))}
				</div>
			</div>

			<div>
				<h2 className="text-xl font-semibold mb-4">Key Pages to Test</h2>
				<div className="grid md:grid-cols-3 gap-4">
					<div className="border rounded-lg p-4">
						<h3 className="font-medium mb-2">Landing Page</h3>
						<p className="text-sm opacity-70 mb-3">Hero section, features, pricing</p>
						<Link href="/" className="text-blue-600 hover:underline text-sm">
							Open page →
						</Link>
					</div>
					<div className="border rounded-lg p-4">
						<h3 className="font-medium mb-2">Auth Pages</h3>
						<p className="text-sm opacity-70 mb-3">Sign in, sign up forms</p>
						<Link href="/signin" className="text-blue-600 hover:underline text-sm">
							Open signin →
						</Link>
					</div>
					<div className="border rounded-lg p-4">
						<h3 className="font-medium mb-2">Coach Page</h3>
						<p className="text-sm opacity-70 mb-3">Main app interface</p>
						<Link href="/coach" className="text-blue-600 hover:underline text-sm">
							Open coach →
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
