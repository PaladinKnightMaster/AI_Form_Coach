import Link from 'next/link';
import Image from 'next/image';
import { Container, Section, Button, Badge, Icon } from '@/ui/DS';
import Reveal from '@/ui/Reveal';
import { logos, testimonials } from './marketing/data';
import SocialProofBand from '@/components/SocialProofBand';
import PricingTeaser from '@/components/PricingTeaser';
import FAQ from '@/components/FAQ';
import FinalCTA from '@/components/FinalCTA';
import LazyImage from '@/components/LazyImage';
import SmoothScrollButton from '@/components/SmoothScrollButton';

export default function Home() {
	return (
		<div suppressHydrationWarning>
			<section className="relative overflow-hidden">
				<div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
					<div className="absolute -top-20 -left-20 h-80 w-80 rounded-full blur-3xl blob-a animate-pulse" style={{ background: 'radial-gradient(closest-side, #22c55e55, transparent)' }} />
					<div className="absolute -bottom-20 -right-10 h-96 w-96 rounded-full blur-3xl blob-b animate-pulse" style={{ background: 'radial-gradient(closest-side, #0ea5e955, transparent)' }} />
					<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full blur-3xl animate-bounce" style={{ background: 'radial-gradient(closest-side, #8b5cf655, transparent)' }} />
				</div>
				<Container>
					<div className="grid lg:grid-cols-2 gap-10 items-center section">
						<Reveal>
							<div className="space-y-6">
								{/* 
								HEADLINE VARIANTS FOR A/B TESTING:
								1. "Perfect Your Form Instantly" (4 words)
								2. "AI Coaching Made Simple" (4 words) 
								3. "Train Smarter, Form Better" (4 words)
								
								SUBHEAD VARIANTS FOR A/B TESTING:
								1. "Get instant form tips and rep counts. No video uploads—everything stays private on your device." (97 chars)
								2. "Real-time coaching that counts reps and fixes your form. Private, fast, works offline." (92 chars)
								3. "Smart coaching for better workouts. Counts reps, improves form, keeps data private." (87 chars)
								*/}
								<Badge className="animate-pulse">🏋️‍♀️ Complete Fitness Solution</Badge>
								<h1 className="font-extrabold leading-tight animate-fade-in" style={{ fontSize: 'var(--step-4)' }}>
									Perfect Your Form & Track Nutrition
									<span className="block text-4xl mt-2">💪🥗</span>
								</h1>
								<p className="opacity-80 max-w-xl text-lg leading-relaxed">
									🤖 AI-powered form coaching with real-time feedback, plus comprehensive nutrition tracking. 
									All private, all on your device. ✨
								</p>
								<div className="flex flex-wrap items-center gap-3">
									<Link href="/signin"><Button variant="primary">Start training</Button></Link>
									<SmoothScrollButton targetId="demo">See demo</SmoothScrollButton>
								</div>
								<div className="flex flex-wrap items-center gap-4 pt-4 text-sm opacity-80">
									<div className="flex items-center gap-2 animate-bounce">
										<span className="text-green-500">🔒</span>
										<span>No video leaves your device</span>
									</div>
									<div className="flex items-center gap-2 animate-bounce" style={{ animationDelay: '0.2s' }}>
										<span className="text-blue-500">📱</span>
										<span>Works offline</span>
									</div>
									<div className="flex items-center gap-2 animate-bounce" style={{ animationDelay: '0.4s' }}>
										<span className="text-orange-500">🥗</span>
										<span>Nutrition tracking included</span>
									</div>
								</div>
							</div>
						</Reveal>
						<div className="relative">
							<div className="card p-3 shadow-2xl hero-float animate-float" id="demo">
								<div className="relative">
									<Image 
										src="/hero.svg" 
										alt="AI Form Coach in action showing pose detection and real-time feedback" 
										width={800}
										height={480}
										className="w-full h-auto rounded-lg"
									/>
									<div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-ping"></div>
									<div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
								</div>
							</div>
							<div className="absolute -z-10 top-4 left-4 w-full h-full bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-lg blur-xl animate-pulse"></div>
						</div>
					</div>
				</Container>
			</section>

			{/* Core values and feature grid */}
			<Section>
				<Container>
					<div className="grid md:grid-cols-3 gap-6 mb-12">
						<div className="card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
							<div className="flex items-start gap-4">
								<div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl animate-bounce group-hover:animate-spin">
									⚡
								</div>
								<div>
									<h3 className="font-semibold text-lg mb-2">⚡ Instant feedback</h3>
									<p className="opacity-80 text-sm leading-relaxed">Hear cues as you move—improve form in real time. 🎯</p>
								</div>
							</div>
						</div>
						<div className="card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
							<div className="flex items-start gap-4">
								<div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-2xl animate-pulse group-hover:animate-bounce">
									🔒
								</div>
								<div>
									<h3 className="font-semibold text-lg mb-2">🔒 Completely private</h3>
									<p className="opacity-80 text-sm leading-relaxed">Your video never leaves your device—guaranteed. 🛡️</p>
								</div>
							</div>
						</div>
						<div className="card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
							<div className="flex items-start gap-4">
								<div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl animate-ping group-hover:animate-pulse">
									🚀
								</div>
								<div>
									<h3 className="font-semibold text-lg mb-2">🚀 Free to start</h3>
									<p className="opacity-80 text-sm leading-relaxed">Begin training immediately—no payment required. 💰</p>
								</div>
							</div>
						</div>
					</div>
					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
						<a href="#rep-counter" className="card p-6 block hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
							<div className="flex items-start gap-4">
								<div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-xl animate-bounce group-hover:animate-spin">
									🔢
								</div>
								<div>
									<h3 className="font-semibold text-lg mb-1">🔢 Counts reps</h3>
									<p className="opacity-80 text-sm">Never lose track of your sets again. 📊</p>
								</div>
							</div>
						</a>
						<a href="#form-cues" className="card p-6 block hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
							<div className="flex items-start gap-4">
								<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-xl animate-pulse group-hover:animate-bounce">
									🎯
								</div>
								<div>
									<h3 className="font-semibold text-lg mb-1">🎯 Coaches your form</h3>
									<p className="opacity-80 text-sm">Get helpful tips as you exercise. 💡</p>
								</div>
							</div>
						</a>
						<a href="#pose-quality" className="card p-6 block hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
							<div className="flex items-start gap-4">
								<div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-xl animate-ping group-hover:animate-pulse">
									👁️
								</div>
								<div>
									<h3 className="font-semibold text-lg mb-1">👁️ Shows when visible</h3>
									<p className="opacity-80 text-sm">Green light means you&apos;re in frame. ✅</p>
								</div>
							</div>
						</a>
						<a href="#auto-pause" className="card p-6 block hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
							<div className="flex items-start gap-4">
								<div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-xl animate-bounce group-hover:animate-spin">
									⏸️
								</div>
								<div>
									<h3 className="font-semibold text-lg mb-1">⏸️ Pauses automatically</h3>
									<p className="opacity-80 text-sm">Stops when you step out of view. 🚶‍♂️</p>
								</div>
							</div>
						</a>
						<a href="#history-charts" className="card p-6 block hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
							<div className="flex items-start gap-4">
								<div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xl animate-pulse group-hover:animate-bounce">
									📈
								</div>
								<div>
									<h3 className="font-semibold text-lg mb-1">📈 Tracks progress</h3>
									<p className="opacity-80 text-sm">See your improvement over time. 📊</p>
								</div>
							</div>
						</a>
						<a href="#export" className="card p-6 block hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
							<div className="flex items-start gap-4">
								<div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-xl animate-ping group-hover:animate-pulse">
									💾
								</div>
								<div>
									<h3 className="font-semibold text-lg mb-1">💾 Export data</h3>
									<p className="opacity-80 text-sm">Download your workout history as CSV. 📁</p>
								</div>
							</div>
						</a>
					</div>
				</Container>
			</Section>

			{/* Nutrition Tracking Section */}
			<section className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-900/20 dark:via-blue-900/20 dark:to-purple-900/20 relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-blue-400/10 to-purple-400/10 animate-pulse"></div>
				<Container>
					<div className="section relative">
						<div className="text-center mb-12">
							<Badge tone="success" className="animate-bounce">🥗 Complete Fitness Solution</Badge>
							<h2 className="text-4xl font-bold mt-6 mb-6 animate-fade-in">
								Track Your Nutrition Too
								<span className="block text-3xl mt-2">🍎🥑🍗</span>
							</h2>
							<p className="text-xl opacity-80 max-w-3xl mx-auto leading-relaxed">
								Beyond form coaching, manage your complete fitness journey with our integrated nutrition tracker. 
								Log meals, track macros, and see your progress in one place. 🎯✨
							</p>
						</div>
						
						<div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
							<div>
								<h3 className="text-2xl font-semibold mb-6">Smart Nutrition Tracking</h3>
								<div className="space-y-6">
									<div className="flex items-start gap-4 group">
										<div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl animate-bounce group-hover:animate-spin flex-shrink-0">
											🔍
										</div>
										<div>
											<h4 className="font-semibold text-lg mb-2">🔍 Food Database</h4>
											<p className="text-sm opacity-80 leading-relaxed">Search thousands of foods with verified nutritional data 📊</p>
										</div>
									</div>
									<div className="flex items-start gap-4 group">
										<div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-2xl animate-pulse group-hover:animate-bounce flex-shrink-0">
											📊
										</div>
										<div>
											<h4 className="font-semibold text-lg mb-2">📊 Macro Tracking</h4>
											<p className="text-sm opacity-80 leading-relaxed">Visual progress rings for calories, protein, carbs, and fat 🎯</p>
										</div>
									</div>
									<div className="flex items-start gap-4 group">
										<div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl animate-ping group-hover:animate-pulse flex-shrink-0">
											⚡
										</div>
										<div>
											<h4 className="font-semibold text-lg mb-2">⚡ Quick Logging</h4>
											<p className="text-sm opacity-80 leading-relaxed">Add foods to meals in seconds with smart search 🚀</p>
										</div>
									</div>
									<div className="flex items-start gap-4 group">
										<div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl animate-bounce group-hover:animate-spin flex-shrink-0">
											📱
										</div>
										<div>
											<h4 className="font-semibold text-lg mb-2">📱 Daily Overview</h4>
											<p className="text-sm opacity-80 leading-relaxed">See your complete nutrition picture at a glance 👀</p>
										</div>
									</div>
								</div>
							</div>
							<div className="relative">
								<div className="card p-4 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 animate-float">
									<div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-ping"></div>
									<div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
									<Image 
										src="/nutrition-dashboard.svg" 
										alt="Nutrition tracking dashboard showing macro rings and meal breakdown" 
										width={400}
										height={300}
										className="w-full h-auto rounded-lg"
									/>
								</div>
								<div className="absolute -z-10 top-4 left-4 w-full h-full bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg blur-xl animate-pulse"></div>
							</div>
						</div>
					</div>
				</Container>
			</section>

			{/* Food Search Feature Showcase */}
			<section className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20 relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-orange-400/10 to-red-400/10 animate-pulse"></div>
				<Container>
					<div className="section relative">
						<div className="text-center mb-12">
							<Badge tone="warning" className="animate-bounce">🍽️ Smart Food Search</Badge>
							<h2 className="text-4xl font-bold mt-6 mb-6 animate-fade-in">
								Find & Log Foods Instantly
								<span className="block text-3xl mt-2">🔍🍗🥑</span>
							</h2>
							<p className="text-xl opacity-80 max-w-3xl mx-auto leading-relaxed">
								Search thousands of foods with our smart database. Get verified nutritional data and log meals in seconds. 
								Perfect for tracking your daily nutrition goals! 🎯✨
							</p>
						</div>
						
						<div className="grid lg:grid-cols-2 gap-12 items-center">
							<div className="relative">
								<div className="card p-4 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 animate-float">
									<div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full animate-ping"></div>
									<div className="absolute -bottom-2 -left-2 w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
									<Image 
										src="/food-search.svg" 
										alt="Food search interface showing search results and quick add functionality" 
										width={400}
										height={300}
										className="w-full h-auto rounded-lg"
									/>
								</div>
								<div className="absolute -z-10 top-4 left-4 w-full h-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-lg blur-xl animate-pulse"></div>
							</div>
							<div>
								<h3 className="text-2xl font-semibold mb-6">⚡ Lightning-Fast Food Search</h3>
								<div className="space-y-6">
									<div className="flex items-start gap-4 group">
										<div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-2xl animate-bounce group-hover:animate-spin flex-shrink-0">
											🔍
										</div>
										<div>
											<h4 className="font-semibold text-lg mb-2">🔍 Smart Search</h4>
											<p className="text-sm opacity-80 leading-relaxed">Type any food name and get instant results with verified nutritional data 📊</p>
										</div>
									</div>
									<div className="flex items-start gap-4 group">
										<div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl animate-pulse group-hover:animate-bounce flex-shrink-0">
											✅
										</div>
										<div>
											<h4 className="font-semibold text-lg mb-2">✅ Verified Data</h4>
											<p className="text-sm opacity-80 leading-relaxed">All nutritional information is verified and up-to-date for accurate tracking 🎯</p>
										</div>
									</div>
									<div className="flex items-start gap-4 group">
										<div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl animate-ping group-hover:animate-pulse flex-shrink-0">
											⚡
										</div>
										<div>
											<h4 className="font-semibold text-lg mb-2">⚡ Quick Add</h4>
											<p className="text-sm opacity-80 leading-relaxed">One-click to add foods to any meal with automatic macro calculations 🚀</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</Container>
			</section>

			{/* Use Cases & Workflows */}
			<Section>
				<Container>
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold mb-4">How It Works</h2>
						<p className="text-lg opacity-80 max-w-2xl mx-auto">
							From workout coaching to nutrition tracking, see how AI Form Coach fits into your daily routine
						</p>
					</div>
					
					<div className="grid md:grid-cols-2 gap-8 mb-12">
						<div className="card p-6">
							<div className="flex items-center gap-3 mb-4">
								<div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
									<Icon name="activity" className="text-blue-600 dark:text-blue-400" />
								</div>
								<h3 className="text-xl font-semibold">Workout Session</h3>
							</div>
							<div className="space-y-3 text-sm">
								<div className="flex items-start gap-3">
									<span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
									<span>Open Coach page and select your exercise</span>
								</div>
								<div className="flex items-start gap-3">
									<span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
									<span>Position yourself in camera view</span>
								</div>
								<div className="flex items-start gap-3">
									<span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
									<span>Get real-time form cues and rep counting</span>
								</div>
								<div className="flex items-start gap-3">
									<span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">4</span>
									<span>View session summary and progress charts</span>
								</div>
							</div>
						</div>
						
						<div className="card p-6">
							<div className="flex items-center gap-3 mb-4">
								<div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
									<Icon name="chart" className="text-green-600 dark:text-green-400" />
								</div>
								<h3 className="text-xl font-semibold">Nutrition Tracking</h3>
							</div>
							<div className="space-y-3 text-sm">
								<div className="flex items-start gap-3">
									<span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
									<span>Go to Nutrition page to see daily overview</span>
								</div>
								<div className="flex items-start gap-3">
									<span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
									<span>Click &quot;Add Food&quot; to search and log meals</span>
								</div>
								<div className="flex items-start gap-3">
									<span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
									<span>Watch macro rings update in real-time</span>
								</div>
								<div className="flex items-start gap-3">
									<span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">4</span>
									<span>Track progress across days and weeks</span>
								</div>
							</div>
						</div>
					</div>
				</Container>
			</Section>

			<Section>
				<Container>
					<div className="grid sm:grid-cols-2 gap-3 text-sm" id="demo">
					<div className="rounded-md border p-3 flex items-center gap-2"><span className="badge badge-success">Completely private</span><span className="opacity-80">Everything runs on your device</span></div>
					<div className="rounded-md border p-3 flex items-center gap-2"><span className="badge badge-success">No uploads</span><span className="opacity-80">Your video stays with you</span></div>
					</div>
				</Container>
			</Section>

			{/* Social proof and outcomes */}
			<section className="bg-gray-50 dark:bg-white/5">
				<Container>
					<SocialProofBand />
				</Container>
			</section>

			<Section>
				<Container>
					<div className="text-xs uppercase tracking-wide opacity-70 mb-3">Trusted by builders</div>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-center">
						{logos.map((l, i) => (
							<LazyImage key={i} src={l.src} alt={l.alt} className="h-6 opacity-70 logo" height={24} />
						))}
					</div>
				</Container>
			</Section>

			{/* Complete Feature Overview */}
			<Section>
				<Container>
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold mb-4">Everything You Need for Fitness Success</h2>
						<p className="text-lg opacity-80 max-w-2xl mx-auto">
							From AI-powered form coaching to comprehensive nutrition tracking, 
							AI Form Coach provides all the tools you need for your fitness journey.
						</p>
					</div>
					
					<div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
						<div>
							<h3 className="text-2xl font-semibold mb-6">AI Form Coaching</h3>
							<div className="space-y-4">
								<div className="flex items-start gap-3">
									<div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-1">
										<Icon name="activity" className="text-blue-600 dark:text-blue-400" />
									</div>
									<div>
										<h4 className="font-semibold">Real-time Form Analysis</h4>
										<p className="text-sm opacity-80">Get instant feedback on squats, push-ups, and planks</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-1">
										<Icon name="message" className="text-green-600 dark:text-green-400" />
									</div>
									<div>
										<h4 className="font-semibold">Voice Coaching</h4>
										<p className="text-sm opacity-80">Hear helpful cues as you exercise</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-1">
										<Icon name="chart" className="text-purple-600 dark:text-purple-400" />
									</div>
									<div>
										<h4 className="font-semibold">Progress Tracking</h4>
										<p className="text-sm opacity-80">See your improvement over time with detailed charts</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0 mt-1">
										<Icon name="sun" className="text-orange-600 dark:text-orange-400" />
									</div>
									<div>
										<h4 className="font-semibold">Privacy First</h4>
										<p className="text-sm opacity-80">Everything runs on your device—no video uploads</p>
									</div>
								</div>
							</div>
						</div>
						<div className="relative">
							<div className="card p-4 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 animate-float">
								<div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full animate-ping"></div>
								<div className="absolute -bottom-2 -left-2 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
								<Image 
									src="/fitness-app.svg" 
									alt="AI Form Coach app showing live pose detection and workout tracking" 
									width={400}
									height={300}
									className="w-full h-auto rounded-lg"
								/>
							</div>
							<div className="absolute -z-10 top-4 left-4 w-full h-full bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-lg blur-xl animate-pulse"></div>
						</div>
					</div>
				</Container>
			</Section>

			<Section>
				<Container>
					<div className="grid md:grid-cols-3 gap-4">
						{testimonials.map((t, i) => (
							<Reveal key={i} delay={i * 80}><Testimonial quote={t.quote} name={t.name} role={t.role} /></Reveal>
						))}
					</div>
					<div className="text-center mt-8">
						<Link href="/signin"><Button variant="primary">Begin training</Button></Link>
					</div>
				</Container>
			</Section>

			<PricingTeaser />

			<FAQ />

			<FinalCTA />
		</div>
	);
}

// Unused Feature component removed - functionality moved inline above

function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
	return (
		<figure className="card p-4">
			<blockquote className="italic">&ldquo;{quote}&rdquo;</blockquote>
			<figcaption className="mt-3 flex items-center gap-2 text-sm opacity-80">
				<span className="inline-grid place-items-center h-8 w-8 rounded-full bg-black text-white text-xs">{name.charAt(0)}</span>
				<span>{name} · {role}</span>
			</figcaption>
		</figure>
	);
}

