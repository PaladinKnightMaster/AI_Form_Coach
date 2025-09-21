import Link from 'next/link';
import { Container, Section, Button, Badge, Icon } from '@/ui/DS';
import { HeroGradientBackground, NutritionGradientBackground, PlansGradientBackground } from '@/components/AnimatedGradientBackground';
import { ProfessionalImage } from '@/components/ProfessionalImage';
import { FeatureCarousel } from '@/components/FeatureCarousel';
import EnhancedNavigation from '@/components/navigation/EnhancedNavigation';

export default function Home() {
	return (
		<div className="relative bg-white dark:bg-gray-900">
			{/* Hero Section with Diagonal Slash Layout */}
			<HeroGradientBackground className="min-h-screen relative overflow-hidden">
				{/* Diagonal slash divider */}
				<div className="absolute inset-0 z-0">
					<div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/10 transform rotate-12 scale-150 origin-bottom-left"></div>
					<div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent transform -rotate-12"></div>
				</div>

				<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="min-h-screen grid lg:grid-cols-12 gap-4 items-start py-8">
						{/* Top-Left: Hero Content */}
						<div className="lg:col-span-7 lg:row-start-1 flex flex-col justify-start pt-4 lg:pt-12">
							<div className="text-center lg:text-left">
								<Badge tone="success" size="lg" className="animate-bounce mb-6 bg-green-500/20 text-green-300 border-green-400/30">
									🚀 AI-Powered Fitness
								</Badge>
								<h1 className="text-4xl font-extrabold tracking-tight mb-6 sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-tight">
									Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 animate-pulse">Personal AI</span> Fitness Coach
								</h1>
								<p className="text-lg lg:text-xl text-gray-200 mb-8 leading-relaxed max-w-xl">
									Transform your workouts with real-time form correction, AI-driven plans, and smart nutrition tracking.
								</p>
								
								{/* Trust Indicators */}
								<div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mb-8 text-sm text-gray-300">
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
										<span>50K+ Active Users</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
										<span>4.9★ Rating</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
										<span>99.9% Uptime</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
										<span>🔒 100% Private</span>
									</div>
								</div>
								
								{/* Privacy Highlights */}
								<div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-8 border border-white/20">
									<div className="flex items-center gap-3 mb-2">
										<Icon name="check" className="w-5 h-5 text-green-400" />
										<span className="font-medium text-white">Privacy First</span>
									</div>
									<p className="text-sm text-gray-200">
										Your video is processed locally using MediaPipe. No uploads, no cloud processing, complete privacy.
									</p>
								</div>
								<div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-8">
									<Link href="/coach">
										<Button variant="primary" size="xl" className="w-full sm:w-auto transform hover:scale-105 transition-all duration-300">
											Start Free Workout <Icon name="chevron-right" className="ml-2" />
										</Button>
									</Link>
									<Link href="/signin">
										<Button variant="secondary" size="xl" className="w-full sm:w-auto">
											Sign In <Icon name="user" className="ml-2" />
										</Button>
									</Link>
								</div>
								<div className="flex items-center justify-center lg:justify-start gap-8 text-sm text-gray-300">
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
										<span>50K+ Active Users</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
										<span>95% Satisfaction</span>
									</div>
								</div>
							</div>

							{/* Professional Image positioned in top-left area */}
							<div className="relative mt-8 lg:mt-12">
								<div className="relative transform hover:scale-105 transition-transform duration-500 max-w-md mx-auto lg:mx-0">
									<ProfessionalImage
										src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
										alt="Professional fitness trainer with AI technology"
										width={500}
										height={300}
										className="rounded-2xl shadow-2xl"
										priority={true}
									/>
									{/* Floating elements */}
									<div className="absolute -top-4 -right-4 w-8 h-8 bg-green-500 rounded-full animate-ping opacity-75"></div>
									<div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-500 rounded-full animate-pulse opacity-75"></div>
								</div>
								{/* Background glow */}
								<div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl blur-xl -z-10 animate-pulse"></div>
						</div>
					</div>

						{/* Top-Right: Rainbow Diagonal Text Effect */}
						<div className="lg:col-span-5 lg:row-start-1 flex items-start justify-center lg:justify-end pt-16">
							<div className="text-center lg:text-right transform -rotate-12 select-none">
								<div className="text-6xl lg:text-8xl xl:text-9xl font-black leading-none animate-rainbow opacity-30">
									AI
								</div>
								<div className="text-4xl lg:text-6xl xl:text-7xl font-bold leading-none -mt-4 animate-rainbow opacity-25" style={{ animationDelay: '1s' }}>
									FITNESS
							</div>
						</div>
					</div>

						{/* Bottom-Right: Feature Carousel - More Right Position */}
						<div className="lg:col-span-8 lg:col-start-5 lg:row-start-2 flex flex-col justify-end pb-4 lg:-mr-8">
							<div className="text-center lg:text-right mb-4 lg:mr-0">
								<Badge tone="success" className="mb-2 bg-white/20 text-white border-white/30">
									✨ Discover Features
								</Badge>
								<h2 className="text-xl lg:text-2xl font-bold text-white mb-2">
									<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400">AI-Powered</span> Tools
							</h2>
								<p className="text-gray-200 text-sm lg:mr-0">
									Explore cutting-edge features designed for your success.
							</p>
						</div>
						
							{/* 1.5x Taller, 3x Wider Feature Carousel - Tight Right */}
							<div className="transform lg:rotate-1 hover:rotate-0 transition-transform duration-700 lg:mr-0">
								<FeatureCarousel />
										</div>
									</div>
								</div>
							</div>
				
				{/* Enhanced curved bottom section */}
				<div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 to-transparent"></div>
				<div className="absolute bottom-0 left-0 right-0">
					<svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-20">
						<path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f9fafb"/>
					</svg>
								</div>
			</HeroGradientBackground>

			{/* Compact Stats Section */}
			<Section className="relative -mt-10 z-10 bg-gray-50 py-16">
				<Container>
						<div className="text-center mb-12">
						<Badge tone="success" className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
							📊 Trusted Worldwide
						</Badge>
						<h2 className="text-3xl font-bold mb-4 text-gray-900">
							Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">50,000+</span> Users
							</h2>
						</div>
						
					{/* Compact stats grid */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
						<div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 hover:shadow-lg transition-all duration-300">
							<div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-1">50K+</div>
							<div className="text-sm font-semibold text-gray-800">Active Users</div>
								</div>
						<div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-teal-50 border border-green-100 hover:shadow-lg transition-all duration-300">
							<div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600 mb-1">1M+</div>
							<div className="text-sm font-semibold text-gray-800">Workouts</div>
							</div>
						<div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 hover:shadow-lg transition-all duration-300">
							<div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-1">95%</div>
							<div className="text-sm font-semibold text-gray-800">Satisfaction</div>
										</div>
						<div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100 hover:shadow-lg transition-all duration-300">
							<div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-1">24/7</div>
							<div className="text-sm font-semibold text-gray-800">AI Support</div>
						</div>
					</div>
				</Container>
			</Section>

			{/* Compact How It Works Section */}
			<NutritionGradientBackground className="relative">
				{/* Top curved section */}
				<div className="absolute top-0 left-0 right-0">
					<svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-20">
						<path d="M0 0L60 10C120 20 240 40 360 50C480 60 600 60 720 55C840 50 960 40 1080 35C1200 30 1320 30 1380 30L1440 30V0H1380C1320 0 1200 0 1080 0C960 0 840 0 720 0C600 0 480 0 360 0C240 0 120 0 60 0H0Z" fill="#f9fafb"/>
					</svg>
				</div>
				
				<Container>
					<div className="py-20 pt-28">
					<div className="text-center mb-12">
							<Badge tone="success" className="mb-4 bg-white/20 text-white border-white/30">
								🎯 How It Works
							</Badge>
							<h2 className="text-3xl font-bold mb-4 text-white">Get Started in 3 Steps</h2>
					</div>
					
						{/* Compact 3-step process */}
						<div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
							<div className="text-center group">
								<div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold border border-white/20 group-hover:scale-110 transition-transform duration-300">
									1
								</div>
								<h3 className="text-xl font-bold mb-3 text-white">Choose Exercise</h3>
								<p className="text-gray-200 text-sm leading-relaxed">Select from supported exercises to begin your workout.</p>
							</div>
							
							<div className="text-center group">
								<div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold border border-white/20 group-hover:scale-110 transition-transform duration-300">
									2
								</div>
								<h3 className="text-xl font-bold mb-3 text-white">Start Session</h3>
								<p className="text-gray-200 text-sm leading-relaxed">Position yourself and let AI analyze your form.</p>
						</div>
						
							<div className="text-center group">
								<div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold border border-white/20 group-hover:scale-110 transition-transform duration-300">
									3
								</div>
								<h3 className="text-xl font-bold mb-3 text-white">Get Feedback</h3>
								<p className="text-gray-200 text-sm leading-relaxed">Receive instant corrections and rep counting.</p>
							</div>
						</div>
					</div>
				</Container>

				{/* Bottom curved section */}
				<div className="absolute bottom-0 left-0 right-0">
					<svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-20">
						<path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
					</svg>
					</div>
			</NutritionGradientBackground>

			{/* Compact Testimonials Section */}
			<Section className="relative -mt-10 z-10 bg-white py-16">
				<Container>
					<div className="text-center mb-12">
						<Badge tone="success" className="mb-4 bg-yellow-100 text-yellow-800 border-yellow-200">
							⭐ User Stories
						</Badge>
						<h2 className="text-3xl font-bold mb-4 text-gray-900">
							<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">Real Results</span>
						</h2>
					</div>
					
					{/* Compact testimonials grid */}
					<div className="grid md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
						<div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100">
							<div className="flex items-center mb-4">
								<div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg">
									<span className="text-white font-bold">S</span>
									</div>
									<div>
									<h4 className="font-bold text-gray-900">Sarah J.</h4>
									<div className="flex text-yellow-400 text-sm">{'★'.repeat(5)}</div>
									</div>
								</div>
							<p className="text-gray-700 text-sm leading-relaxed italic">&ldquo;Completely transformed my workouts. Amazing results!&rdquo;</p>
						</div>
						
						<div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-100">
							<div className="flex items-center mb-4">
								<div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center mr-3 shadow-lg">
									<span className="text-white font-bold">M</span>
									</div>
									<div>
									<h4 className="font-bold text-gray-900">Mike C.</h4>
									<div className="flex text-yellow-400 text-sm">{'★'.repeat(5)}</div>
									</div>
								</div>
							<p className="text-gray-700 text-sm leading-relaxed italic">&ldquo;AI feedback is incredibly accurate. Like having a 24/7 coach!&rdquo;</p>
									</div>
						
						<div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-100">
							<div className="flex items-center mb-4">
								<div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mr-3 shadow-lg">
									<span className="text-white font-bold">E</span>
									</div>
									<div>
									<h4 className="font-bold text-gray-900">Emma R.</h4>
									<div className="flex text-yellow-400 text-sm">{'★'.repeat(5)}</div>
									</div>
								</div>
							<p className="text-gray-700 text-sm leading-relaxed italic">&ldquo;Nutrition tracking is so intuitive. Saves tons of time!&rdquo;</p>
						</div>
					</div>
				</Container>
			</Section>

			{/* Compact CTA Section */}
			{/* Privacy & Trust Section */}
			<Section className="bg-gray-50 dark:bg-gray-800 py-20">
				<Container>
					<div className="text-center mb-16">
						<Badge tone="success" className="mb-4 bg-green-100 text-green-800 border-green-200">
							🔒 Privacy & Trust
						</Badge>
						<h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
							Your Data Stays <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">Private</span>
						</h2>
						<p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
							We believe your fitness data should remain completely private. Here&apos;s how we protect it.
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
						{/* On-Device Processing */}
						<div className="bg-white dark:bg-gray-700 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-600">
							<div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
								<Icon name="check" className="w-8 h-8 text-green-600 dark:text-green-400" />
							</div>
							<h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white text-center">
								On-Device Processing
							</h3>
							<p className="text-gray-600 dark:text-gray-400 text-center mb-4">
								Your video is processed locally using Google&apos;s MediaPipe Pose Landmarker. No uploads, no cloud processing.
							</p>
							<div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
								<p className="text-sm text-green-800 dark:text-green-300 text-center font-medium">
									✅ Video never leaves your device
								</p>
							</div>
						</div>

						{/* Anonymous Nutrition Data */}
						<div className="bg-white dark:bg-gray-700 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-600">
							<div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
								<Icon name="heart" className="w-8 h-8 text-blue-600 dark:text-blue-400" />
							</div>
							<h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white text-center">
								Anonymous Nutrition Data
							</h3>
							<p className="text-gray-600 dark:text-gray-400 text-center mb-4">
								Food lookups use Open Food Facts - an open-source database. Your searches are anonymous and cached locally.
							</p>
							<div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3">
								<p className="text-sm text-blue-800 dark:text-blue-300 text-center font-medium">
									✅ No personal tracking
								</p>
							</div>
						</div>

						{/* Health Data Control */}
						<div className="bg-white dark:bg-gray-700 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-600">
							<div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
								<Icon name="settings" className="w-8 h-8 text-purple-600 dark:text-purple-400" />
							</div>
							<h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white text-center">
								Health Data Control
							</h3>
							<p className="text-gray-600 dark:text-gray-400 text-center mb-4">
								Health data integration is opt-in only. Choose exactly which data types to share with per-type toggles.
							</p>
							<div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-3">
								<p className="text-sm text-purple-800 dark:text-purple-300 text-center font-medium">
									✅ Full control over your data
								</p>
							</div>
						</div>
					</div>

					<div className="text-center mt-12">
						<Link href="/privacy">
							<Button variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300">
								<Icon name="check" className="w-4 h-4 mr-2" />
								Read Full Privacy Policy
							</Button>
						</Link>
					</div>
				</Container>
			</Section>

			{/* Community Hub Section */}
			<Section className="py-20 bg-gray-50 dark:bg-gray-800">
				<Container>
					<div className="text-center mb-12">
						<Badge tone="success" size="lg" className="mb-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
							🌟 Community & Motivation
						</Badge>
						<h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
							Stay Motivated with Real-time Feedback
						</h2>
						<p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
							Get instant coaching, compete fairly with similar fitness levels, and stay connected with your fitness community.
						</p>
					</div>
					<EnhancedNavigation className="max-w-6xl mx-auto" />
				</Container>
			</Section>

			<PlansGradientBackground className="relative">
				{/* Top curved section */}
				<div className="absolute top-0 left-0 right-0">
					<svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-20">
						<path d="M0 0L60 10C120 20 240 40 360 50C480 60 600 60 720 55C840 50 960 40 1080 35C1200 30 1320 30 1380 30L1440 30V0H1380C1320 0 1200 0 1080 0C960 0 840 0 720 0C600 0 480 0 360 0C240 0 120 0 60 0H0Z" fill="white"/>
					</svg>
				</div>
				
				<Container>
					<div className="py-20 pt-28 text-center">
						<Badge tone="warning" className="mb-6 bg-white/20 text-white border-white/30">
							💰 Simple Pricing
						</Badge>
						<h2 className="text-4xl font-bold mb-6 text-white leading-tight">
							Start Free, <span className="text-yellow-300">Upgrade When Ready</span>
						</h2>
						<p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
							Begin your fitness journey completely free. Upgrade for advanced features.
						</p>
						<div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
							<Link href="/coach">
								<Button variant="primary" className="w-full sm:w-auto bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
									Start Free Now <Icon name="chevron-right" className="ml-2" />
								</Button>
							</Link>
							<Link href="/pricing">
								<Button variant="secondary" className="w-full sm:w-auto bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-8 py-4 text-lg font-semibold backdrop-blur-sm">
									View Pricing <Icon name="chevron-right" className="ml-2" />
								</Button>
							</Link>
					</div>
					</div>
				</Container>
			</PlansGradientBackground>
		</div>
	);
}