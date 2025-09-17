import Link from 'next/link';

export default function SiteFooter() {
	return (
		<footer className="border-t mt-20 bg-gray-50/50 dark:bg-gray-900/50">
			<div className="container py-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
				{/* Features */}
				<section aria-labelledby="footer-features">
					<h3 id="footer-features" className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Features</h3>
					<ul className="space-y-3 text-sm">
						<li><Link href="/coach" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
							<span className="text-blue-500">💪</span> AI Form Coaching
						</Link></li>
						<li><Link href="/nutrition" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
							<span className="text-green-500">🥗</span> Nutrition Tracking
						</Link></li>
						<li><Link href="/plans" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
							<span className="text-purple-500">📋</span> Workout Plans
						</Link></li>
						<li><Link href="/health" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
							<span className="text-orange-500">🏥</span> Health Monitoring
						</Link></li>
						<li><Link href="/history" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
							<span className="text-indigo-500">📊</span> Progress History
						</Link></li>
					</ul>
				</section>

				{/* Quick Links */}
				<section aria-labelledby="footer-quick-links">
					<h3 id="footer-quick-links" className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Quick Links</h3>
					<ul className="space-y-3 text-sm">
						<li><Link href="/signin" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Get Started</Link></li>
						<li><Link href="/demo" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">See Demo</Link></li>
						<li><Link href="/account" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">My Account</Link></li>
						<li><Link href="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</Link></li>
					</ul>
				</section>

				{/* Support */}
				<section aria-labelledby="footer-support">
					<h3 id="footer-support" className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Support</h3>
					<ul className="space-y-3 text-sm">
						<li><Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Privacy Policy</Link></li>
						<li><Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Terms of Service</Link></li>
						<li><a href="mailto:support@aiformcoach.com" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Contact Support</a></li>
						<li><a href="https://github.com/aiformcoach" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">GitHub</a></li>
					</ul>
				</section>

				{/* Privacy & Security */}
				<section aria-labelledby="footer-privacy">
					<h3 id="footer-privacy" className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Privacy & Security</h3>
					<div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
						<div className="flex items-start gap-2">
							<span className="text-green-500 mt-0.5">🔒</span>
							<span>All processing happens in your browser</span>
						</div>
						<div className="flex items-start gap-2">
							<span className="text-blue-500 mt-0.5">📱</span>
							<span>No video uploads—everything stays private</span>
						</div>
						<div className="flex items-start gap-2">
							<span className="text-purple-500 mt-0.5">🛡️</span>
							<span>End-to-end encrypted data storage</span>
						</div>
						<div className="flex items-start gap-2">
							<span className="text-orange-500 mt-0.5">⚡</span>
							<span>Works completely offline</span>
						</div>
					</div>
				</section>
			</div>
			
			{/* Bottom Bar */}
			<div className="container py-6 border-t border-gray-200 dark:border-gray-700">
				<div className="flex flex-col md:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
						<p>© {new Date().getFullYear()} AI Form Coach. All rights reserved.</p>
						<span className="hidden md:inline">•</span>
						<p>Built with ❤️ for fitness enthusiasts</p>
					</div>
					<div className="flex items-center gap-4 text-sm">
						<Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</Link>
						<Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Terms</Link>
						<a href="https://github.com/aiformcoach" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">GitHub</a>
					</div>
				</div>
			</div>
		</footer>
	);
} 