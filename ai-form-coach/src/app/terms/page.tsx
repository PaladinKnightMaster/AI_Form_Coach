import { Container } from '@/ui/DS';
import Link from 'next/link';

export default function Terms() {
	return (
		<Container>
			<div className="section max-w-4xl mx-auto space-y-8">
				<div className="text-center">
					<h1 className="font-bold mb-2">Terms of Service</h1>
					<p className="opacity-80">Last updated: {new Date().toLocaleDateString()}</p>
					<p className="text-sm opacity-70 mt-2">
						The legal stuff, explained in plain English.
					</p>
				</div>

				<div className="prose prose-sm max-w-none space-y-6">
					<section id="acceptance">
						<h2 className="font-semibold mb-3">1. Acceptance of Terms</h2>
						<div className="space-y-3 opacity-80">
							<p>
								By using AI Form Coach, you agree to these terms. If you don&apos;t agree, please don&apos;t use our service.
							</p>
							<p>
								These terms may change occasionally. We&apos;ll notify you of significant changes via email or in-app notifications.
							</p>
						</div>
					</section>

					<section id="service-description">
						<h2 className="font-semibold mb-3">2. What We Provide</h2>
						<div className="space-y-3 opacity-80">
							<p>
								<strong>AI Form Coach</strong> is a fitness application that provides real-time form coaching using computer vision technology. 
								All processing happens in your browser for privacy and speed.
							</p>
							<p>
								<strong>Free features:</strong> Basic coaching, rep counting, 10 recent sessions, and form analysis.
							</p>
							<p>
								<strong>Pro features:</strong> Unlimited history, advanced analytics, custom plans, and priority support.
							</p>
						</div>
					</section>

					<section id="acceptable-use">
						<h2 className="font-semibold mb-3">3. How You Can Use Our Service</h2>
						<div className="space-y-3 opacity-80">
							<p>
								<strong>Personal use:</strong> Use AI Form Coach for your own fitness and wellness goals.
							</p>
							<p>
								<strong>Commercial use:</strong> Trainers and fitness professionals may use Pro accounts with clients, 
								but may not resell or redistribute our technology.
							</p>
							<p>
								<strong>What&apos;s not allowed:</strong> Don&apos;t reverse engineer, copy, or misuse our service. 
								Don&apos;t share your account credentials.
							</p>
						</div>
					</section>

					<section id="privacy-commitment">
						<h2 className="font-semibold mb-3">4. Privacy & Your Data</h2>
						<div className="space-y-3 opacity-80">
							<p>
								<strong>Video privacy:</strong> Your camera feed is processed entirely in your browser. 
								Video never leaves your device or gets stored on our servers.
							</p>
							<p>
								<strong>Session data:</strong> We store workout summaries (reps, duration, form scores) 
								to help track your progress. You can export or delete this data anytime.
							</p>
							<p>
								<strong>Full details:</strong> See our <Link href="/privacy" className="underline">Privacy Policy</Link> for complete information.
							</p>
						</div>
					</section>

					<section id="health-disclaimer">
						<h2 className="font-semibold mb-3">5. Health & Safety Disclaimer</h2>
						<div className="space-y-3 opacity-80">
							<p>
								<strong>Not medical advice:</strong> AI Form Coach provides fitness guidance but is not a substitute 
								for professional training, medical advice, or healthcare services.
							</p>
							<p>
								<strong>Exercise at your own risk:</strong> You are responsible for exercising safely within your abilities. 
								Consult a healthcare professional before starting any new exercise program.
							</p>
							<p>
								<strong>Listen to your body:</strong> Stop immediately if you experience pain, dizziness, or discomfort. 
								Always warm up properly and stay hydrated.
							</p>
							<p>
								<strong>Equipment safety:</strong> Ensure you have adequate space and proper equipment. 
								We are not responsible for injuries that occur during your workouts.
							</p>
						</div>
					</section>

					<section id="payments">
						<h2 className="font-semibold mb-3">6. Payments & Subscriptions</h2>
						<div className="space-y-3 opacity-80">
							<p>
								<strong>Free tier:</strong> Always available with basic features and recent session history.
							</p>
							<p>
								<strong>Pro subscriptions:</strong> Billed monthly or yearly through Stripe. 
								Cancel anytime from your account settings.
							</p>
							<p>
								<strong>Refunds:</strong> Contact us within 14 days if you&apos;re not satisfied. 
								We&apos;ll work with you to make it right.
							</p>
							<p>
								<strong>Price changes:</strong> We&apos;ll give 30 days notice before changing subscription prices.
							</p>
						</div>
					</section>

					<section id="service-availability">
						<h2 className="font-semibold mb-3">7. Service Availability</h2>
						<div className="space-y-3 opacity-80">
							<p>
								We strive for 99.9% uptime but can&apos;t guarantee the service will always be available. 
								We may need to perform maintenance or updates occasionally.
							</p>
							<p>
								Your data is backed up regularly, but we recommend exporting important sessions periodically.
							</p>
						</div>
					</section>

					<section id="intellectual-property">
						<h2 className="font-semibold mb-3">8. Intellectual Property</h2>
						<div className="space-y-3 opacity-80">
							<p>
								AI Form Coach&apos;s code, design, and content are our intellectual property. 
								You can use our service but can&apos;t copy or redistribute our technology.
							</p>
							<p>
								Your workout data belongs to you. We don&apos;t claim ownership of your session summaries or progress data.
							</p>
						</div>
					</section>

					<section id="limitation-of-liability">
						<h2 className="font-semibold mb-3">9. Limitation of Liability</h2>
						<div className="space-y-3 opacity-80">
							<p>
								AI Form Coach is provided &ldquo;as is&rdquo; without warranties. We&apos;re not liable for injuries, 
								data loss, or other damages that may occur from using our service.
							</p>
							<p>
								Our maximum liability is limited to the amount you&apos;ve paid us in the past 12 months.
							</p>
						</div>
					</section>

					<section id="termination">
						<h2 className="font-semibold mb-3">10. Account Termination</h2>
						<div className="space-y-3 opacity-80">
							<p>
								<strong>You can leave anytime:</strong> Delete your account from the settings page. 
								Your data will be permanently removed within 30 days.
							</p>
							<p>
								<strong>We may suspend accounts:</strong> If terms are violated or for security reasons. 
								We&apos;ll try to contact you first when possible.
							</p>
						</div>
					</section>

					<section id="governing-law">
						<h2 className="font-semibold mb-3">11. Legal Stuff</h2>
						<div className="space-y-3 opacity-80">
							<p>
								These terms are governed by the laws where our company is incorporated. 
								Any disputes will be resolved through binding arbitration.
							</p>
							<p>
								If any part of these terms is found invalid, the rest still applies.
							</p>
						</div>
					</section>

					<section id="contact-terms">
						<h2 className="font-semibold mb-3">12. Contact Us</h2>
						<div className="space-y-3 opacity-80">
							<p>
								Questions about these terms or need to report an issue?
							</p>
							<p>
								<strong>Email:</strong> legal@aiformcoach.com<br />
								<strong>Support:</strong> support@aiformcoach.com<br />
								<strong>Response time:</strong> We aim to respond within 2 business days
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