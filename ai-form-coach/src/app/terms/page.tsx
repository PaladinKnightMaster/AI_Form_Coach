import { Container } from '@/ui/DS';
import Link from 'next/link';

export default function Terms() {
	return (
		<Container>
			<div className="section max-w-3xl mx-auto space-y-6">
				<div className="text-center">
					<h1 className="font-bold mb-2">Terms of Service</h1>
					<p className="opacity-80">Last updated: {new Date().toLocaleDateString()}</p>
				</div>

				<div className="prose prose-sm max-w-none space-y-4">
					<section>
						<h2 className="font-semibold mb-2">1. Acceptance of Terms</h2>
						<p className="opacity-80">
							By accessing and using AI Form Coach, you accept and agree to be bound by the terms and provision of this agreement.
						</p>
					</section>

					<section>
						<h2 className="font-semibold mb-2">2. Use License</h2>
						<p className="opacity-80">
							Permission is granted to temporarily use AI Form Coach for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
						</p>
					</section>

					<section>
						<h2 className="font-semibold mb-2">3. Privacy and Data</h2>
						<p className="opacity-80">
							We are committed to protecting your privacy. All pose detection runs locally in your browser. We do not store or transmit your video data. See our{' '}
							<Link href="/privacy" className="underline">Privacy Policy</Link> for details.
						</p>
					</section>

					<section>
						<h2 className="font-semibold mb-2">4. Disclaimer</h2>
						<p className="opacity-80">
							AI Form Coach is provided for informational purposes only. It is not a substitute for professional fitness training or medical advice. Use at your own risk.
						</p>
					</section>

					<section>
						<h2 className="font-semibold mb-2">5. Limitations</h2>
						<p className="opacity-80">
							In no event shall AI Form Coach or its suppliers be liable for any damages arising out of the use or inability to use the service.
						</p>
					</section>

					<section>
						<h2 className="font-semibold mb-2">6. Contact</h2>
						<p className="opacity-80">
							Questions about these Terms of Service should be sent to us via our contact page.
						</p>
					</section>
				</div>

				<div className="text-center pt-8">
					<Link href="/" className="btn btn-secondary">
						Back to Home
					</Link>
				</div>
			</div>
		</Container>
	);
} 