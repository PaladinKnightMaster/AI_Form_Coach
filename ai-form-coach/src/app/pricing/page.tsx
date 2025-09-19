import Link from 'next/link';
import { Container, Section, Button, Badge } from '@/ui/DS';
import PricingTeaser from '@/components/PricingTeaser';

export default function PricingPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-slate-900 dark:via-orange-900/30 dark:to-pink-900/30">
			<Container>
				<Section>
					<div className="text-center space-y-6 mb-12">
						<div className="space-y-4">
							<Badge tone="warning" size="lg" className="bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 animate-pulse">
								💰 Simple Pricing
							</Badge>
							<h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
								Choose Your Plan
							</h1>
							<p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
								Start free and upgrade when you're ready for advanced features. 
								All plans include our core AI coaching and nutrition tracking.
							</p>
						</div>
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
