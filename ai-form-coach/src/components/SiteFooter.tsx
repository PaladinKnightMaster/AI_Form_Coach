import Link from 'next/link';

export default function SiteFooter() {
	return (
		<footer className="border-t mt-10">
			<div className="container py-10 grid gap-8 md:grid-cols-4">
				<section aria-labelledby="footer-product">
					<h3 id="footer-product" className="text-sm font-semibold mb-2">Product</h3>
					<ul className="space-y-1 text-sm opacity-80">
						<li><Link href="/coach" className="underline-offset-2 hover:underline">Coach</Link></li>
						<li><Link href="/history" className="underline-offset-2 hover:underline">History</Link></li>
						<li><Link href="/privacy" className="underline-offset-2 hover:underline">Privacy</Link></li>
					</ul>
				</section>
				<section aria-labelledby="footer-company">
					<h3 id="footer-company" className="text-sm font-semibold mb-2">Company</h3>
					<ul className="space-y-1 text-sm opacity-80">
						<li><Link href="/" className="underline-offset-2 hover:underline">About</Link></li>
						<li><Link href="/" className="underline-offset-2 hover:underline">Contact</Link></li>
						<li><Link href="/" className="underline-offset-2 hover:underline">Blog</Link></li>
					</ul>
				</section>
				<section aria-labelledby="footer-legal">
					<h3 id="footer-legal" className="text-sm font-semibold mb-2">Legal</h3>
					<ul className="space-y-1 text-sm opacity-80">
						<li><Link href="/privacy" className="underline-offset-2 hover:underline">Privacy Policy</Link></li>
						<li><Link href="/" className="underline-offset-2 hover:underline">Terms of Service</Link></li>
						<li><Link href="/" className="underline-offset-2 hover:underline">Security</Link></li>
					</ul>
				</section>
				<section aria-labelledby="footer-privacy">
					<h3 id="footer-privacy" className="text-sm font-semibold mb-2">Your privacy</h3>
					<p className="text-sm opacity-80">All processing happens in your browser. We never upload video—only motion summaries you control.</p>
				</section>
			</div>
			<div className="container py-6 text-sm opacity-80 flex items-center justify-between border-t">
				<p>© {new Date().getFullYear()} AI Form Coach</p>
				<p><Link href="/privacy" className="underline-offset-2 hover:underline">Privacy</Link></p>
			</div>
		</footer>
	);
} 