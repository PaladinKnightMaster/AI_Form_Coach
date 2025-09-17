import Link from 'next/link';
import { Container, Section, Button, Badge } from '@/ui/DS';
import PricingTeaser from '@/components/PricingTeaser';

export default function PricingPage() {
	return (
		<div className="min-h-screen">
			<Container>
				<Section>
					<div className="text-center mb-12">
						<Badge className="animate-pulse">💰 Simple Pricing</Badge>
						<h1 className="text-4xl font-bold mt-6 mb-6">
							Choose Your Plan
							<span className="block text-3xl mt-2">💪✨</span>
						</h1>
						<p className="text-xl opacity-80 max-w-2xl mx-auto">
							Start free and upgrade when you're ready for advanced features. 
							All plans include our core AI coaching and nutrition tracking.
						</p>
					</div>
					
					<PricingTeaser />
					
					<div className="text-center mt-12">
						<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
							<h3 className="text-lg font-semibold mb-3">🎯 What's Included in All Plans</h3>
							<div className="grid md:grid-cols-2 gap-4 text-sm text-left">
								<div className="flex items-center gap-2">
									<span className="text-green-500">✅</span>
									<span>AI Form Coaching (Squats, Push-ups, Planks)</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-green-500">✅</span>
									<span>Real-time Rep Counting</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-green-500">✅</span>
									<span>Nutrition Tracking & Macro Counting</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-green-500">✅</span>
									<span>Progress History & Charts</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-green-500">✅</span>
									<span>Featured Workout Plans</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-green-500">✅</span>
									<span>Health Monitoring & Readiness</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-green-500">✅</span>
									<span>Privacy-First Design</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-green-500">✅</span>
									<span>Works Offline</span>
								</div>
							</div>
						</div>
					</div>
					
					<div className="text-center mt-8">
						<Link href="/signin">
							<Button variant="primary" size="lg">
								Get Started Free
							</Button>
						</Link>
						<p className="text-sm opacity-80 mt-4">
							No credit card required • Cancel anytime
						</p>
					</div>
				</Section>
			</Container>
		</div>
	);
}
