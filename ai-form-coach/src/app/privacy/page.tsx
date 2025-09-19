import type { Metadata } from "next";
import { Container } from '@/ui/DS';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Privacy Policy',
	description: 'Learn how AI Form Coach protects your privacy. All video processing happens in your browser - no uploads, complete privacy.',
	openGraph: {
		title: 'Privacy Policy - AI Form Coach',
		description: 'Learn how AI Form Coach protects your privacy. All video processing happens in your browser - no uploads, complete privacy.',
		images: ['/og-image?title=Privacy Policy&subtitle=Your video never leaves your device']
	}
};

export default function Privacy() {
	return (
		<Container>
			<div className="section max-w-4xl mx-auto space-y-8">
				<div className="text-center">
					<h1 className="font-bold mb-2">Privacy Policy</h1>
					<p className="opacity-80">Last updated: {new Date().toLocaleDateString()}</p>
					<p className="text-sm opacity-70 mt-2">
						We believe your workout data should stay private. Here&apos;s exactly how we protect it.
					</p>
				</div>

				<div className="prose prose-sm max-w-none space-y-6">
					<section id="data-collection">
						<h2 className="font-semibold mb-3">What We Collect</h2>
						<div className="space-y-3 opacity-80">
							<p>
								<strong>Video frames:</strong> Your camera feed is processed entirely in your browser using MediaPipe technology. 
								These frames never leave your device and are not stored anywhere.
							</p>
							<p>
								<strong>Session summaries:</strong> We store basic workout metrics like rep counts, exercise duration, 
								and form quality scores to help you track progress over time.
							</p>
							<p>
								<strong>Account data:</strong> Your email address and any profile information you choose to provide.
							</p>
							<p>
								<strong>Usage analytics:</strong> Basic app usage patterns to improve the service (if you consent).
							</p>
						</div>
					</section>

					<section id="video-privacy">
						<h2 className="font-semibold mb-3">Your Video Stays Private</h2>
						<div className="space-y-3 opacity-80">
							<p>
								<strong>No video uploads:</strong> Your camera feed is processed locally using WebAssembly and MediaPipe Pose Landmarker. 
								Video frames are analyzed in real-time but never transmitted to our servers.
							</p>
							<p>
								<strong>On-device processing:</strong> All pose detection, form analysis, and rep counting happens 
								directly in your browser using Google's MediaPipe technology. This means faster responses and complete privacy.
							</p>
							<p>
								<strong>MediaPipe Pose Landmarker:</strong> We use Google's MediaPipe Pose Landmarker, which is specifically designed 
								for on-device pose detection. Your video never leaves your device.
							</p>
							<p>
								<strong>What we receive:</strong> Only numerical summaries like &ldquo;completed 12 squats with 85% average form score&rdquo; 
								— never images or video data.
							</p>
						</div>
					</section>

					<section id="nutrition-privacy">
						<h2 className="font-semibold mb-3">Nutrition Data Privacy</h2>
						<div className="space-y-3 opacity-80">
							<p>
								<strong>Anonymous product lookups:</strong> When you scan barcodes or search for foods, we use Open Food Facts, 
								an open-source database that's free to use. Your searches are anonymous and cached locally for faster access.
							</p>
							<p>
								<strong>Open Food Facts:</strong> We use the Open Food Facts API for product information. This is open data 
								that's freely available and doesn't require personal information.
							</p>
							<p>
								<strong>Local caching:</strong> Food data is cached in your browser to reduce API calls and improve performance. 
								This cache is stored locally and never shared.
							</p>
							<p>
								<strong>No tracking:</strong> We don't track what foods you search for or consume. Your nutrition data 
								is only stored if you choose to log meals.
							</p>
						</div>
					</section>

					<section id="health-data-privacy">
						<h2 className="font-semibold mb-3">Health Data Privacy</h2>
						<div className="space-y-3 opacity-80">
							<p>
								<strong>Opt-in only:</strong> Health data integration is completely optional. You can use the app 
								without connecting any health devices or services.
							</p>
							<p>
								<strong>Per-type permissions:</strong> You can choose exactly which health data types to share, 
								with clear toggles for each category (sleep, heart rate, steps, etc.).
							</p>
							<p>
								<strong>Platform transparency:</strong> We link to official Apple HealthKit and Google Health Connect 
								developer pages so you know exactly what data we access and why.
							</p>
							<p>
								<strong>Local processing:</strong> Health data is processed locally when possible, and only 
								aggregated metrics are stored on our servers.
							</p>
						</div>
					</section>

					<section id="data-storage">
						<h2 className="font-semibold mb-3">How We Store Your Data</h2>
						<div className="space-y-3 opacity-80">
							<p>
								<strong>Secure hosting:</strong> Session data is stored on Supabase with industry-standard encryption 
								and security practices.
							</p>
							<p>
								<strong>Data retention:</strong> Free accounts keep 10 recent sessions. Pro accounts have unlimited history. 
								You can delete sessions anytime.
							</p>
							<p>
								<strong>Account deletion:</strong> Contact us to permanently delete your account and all associated data.
							</p>
						</div>
					</section>

					<section id="data-sharing">
						<h2 className="font-semibold mb-3">Data Sharing</h2>
						<div className="space-y-3 opacity-80">
							<p>
								<strong>We don&apos;t sell your data.</strong> Your workout information is never sold to third parties or used for advertising.
							</p>
							<p>
								<strong>Aggregate insights:</strong> We may share anonymized, aggregate statistics (like &ldquo;users improved form by 15% on average&rdquo;) 
								for research or marketing purposes.
							</p>
							<p>
								<strong>Service providers:</strong> We use trusted services like Supabase for data storage and Stripe for payments. 
								These providers have their own privacy policies.
							</p>
						</div>
					</section>

					<section id="your-rights">
						<h2 className="font-semibold mb-3">Your Rights</h2>
						<div className="space-y-3 opacity-80">
							<p>
								<strong>Access:</strong> View all your stored session data in the History section.
							</p>
							<p>
								<strong>Export:</strong> Download your data as CSV files anytime.
							</p>
							<p>
								<strong>Delete:</strong> Remove individual sessions or your entire account.
							</p>
							<p>
								<strong>Opt-out:</strong> Disable analytics tracking in your account settings.
							</p>
						</div>
					</section>

					<section id="safety-notice">
						<h2 className="font-semibold mb-3">Safety & Health Notice</h2>
						<div className="space-y-3 opacity-80">
							<p>
								<strong>Not medical advice:</strong> AI Form Coach provides fitness guidance but is not a substitute 
								for professional training or medical advice.
							</p>
							<p>
								<strong>Warm up properly:</strong> Always warm up before exercising and cool down afterward.
							</p>
							<p>
								<strong>Listen to your body:</strong> Stop immediately if you feel pain, dizziness, or discomfort. 
								Consult a healthcare professional if you have concerns.
							</p>
							<p>
								<strong>Use at your own risk:</strong> You are responsible for exercising safely within your abilities.
							</p>
						</div>
					</section>

					<section id="cookies">
						<h2 className="font-semibold mb-3">Cookies & Local Storage</h2>
						<div className="space-y-3 opacity-80">
							<p>
								We use local browser storage to remember your preferences (like theme settings) and cache session data 
								for offline use. No tracking cookies are used without your consent.
							</p>
						</div>
					</section>

					<section id="updates">
						<h2 className="font-semibold mb-3">Policy Updates</h2>
						<div className="space-y-3 opacity-80">
							<p>
								We may update this policy occasionally. Significant changes will be announced in the app 
								and via email. Continued use means you accept the updated terms.
							</p>
						</div>
					</section>

					<section id="contact">
						<h2 className="font-semibold mb-3">Contact Us</h2>
						<div className="space-y-3 opacity-80">
							<p>
								Questions about privacy or want to exercise your data rights?
							</p>
							<p>
								<strong>Email:</strong> privacy@aiformcoach.com<br />
								<strong>Response time:</strong> We aim to respond within 48 hours
							</p>
						</div>
					</section>
				</div>

				<div className="text-center pt-8 border-t">
					<Link href="/" className="btn btn-secondary">
						Back to Home
					</Link>
				</div>
			</div>
		</Container>
	);
} 