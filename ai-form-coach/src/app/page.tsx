import Link from 'next/link';
import { Container, Section, Button, Badge, Icon } from '@/ui/DS';
import Reveal from '@/ui/Reveal';
import HeroCanvas from '@/components/HeroCanvas';
import { logos, testimonials } from './marketing/data';
import SocialProofBand from '@/components/SocialProofBand';
import PricingTeaser from '@/components/PricingTeaser';
import FAQ from '@/components/FAQ';
import FinalCTA from '@/components/FinalCTA';
import LazyImage from '@/components/LazyImage';

export default function Home() {
	return (
		<div>
			<section className="relative overflow-hidden">
				<div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
					<div className="absolute -top-20 -left-20 h-80 w-80 rounded-full blur-3xl blob-a" style={{ background: 'radial-gradient(closest-side, #22c55e55, transparent)' }} />
					<div className="absolute -bottom-20 -right-10 h-96 w-96 rounded-full blur-3xl blob-b" style={{ background: 'radial-gradient(closest-side, #0ea5e955, transparent)' }} />
				</div>
				<Container>
					<div className="grid lg:grid-cols-2 gap-10 items-center section">
						<Reveal>
							<div className="space-y-6">
								<Badge>Private by design</Badge>
								<h1 className="font-extrabold leading-tight" style={{ fontSize: 'var(--step-4)' }}>Real‑time AI Form Coaching — right in your browser</h1>
								<p className="opacity-80 max-w-xl">Get instant cues, rep counts, and progress—without uploading video. MediaPipe runs on‑device for privacy and speed. Start a guided session in seconds.</p>
								<div className="flex flex-wrap items-center gap-3">
									<Link href="/signin"><Button variant="primary">Start free</Button></Link>
									<button className="btn btn-secondary" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>Watch demo</button>
								</div>
								<div className="flex items-center gap-3 pt-2 text-sm opacity-80">
									<Icon name="check" /> No video leaves your device
									<span className="mx-1">•</span>
									<Icon name="check" /> Works offline
								</div>
							</div>
						</Reveal>
						<div className="relative">
							<div className="card p-3 shadow-lg hero-float" id="demo">
								<HeroCanvas />
							</div>
						</div>
					</div>
				</Container>
			</section>

			{/* Core values and feature grid */}
			<Section>
				<Container>
					<div className="grid md:grid-cols-3 gap-4 mb-8">
						<div className="card p-4"><div className="flex items-start gap-3"><Icon name="activity" /><div><h3 className="font-semibold">Instant feedback</h3><p className="opacity-80 text-sm">Hear cues as you move—improve form in real time.</p></div></div></div>
						<div className="card p-4"><div className="flex items-start gap-3"><Icon name="sun" /><div><h3 className="font-semibold">Private by default</h3><p className="opacity-80 text-sm">On-device analysis. No video uploads—ever.</p></div></div></div>
						<div className="card p-4"><div className="flex items-start gap-3"><Icon name="download" /><div><h3 className="font-semibold">Start free</h3><p className="opacity-80 text-sm">No subscription required to begin training.</p></div></div></div>
					</div>
					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
						<a href="#rep-counter" className="card p-4 block hover:shadow-md transition"><div className="flex items-start gap-3"><Icon name="activity" /><div><h3 className="font-semibold">Rep counter</h3><p className="opacity-80 text-sm">Automatic counting for every set.</p></div></div></a>
						<a href="#form-cues" className="card p-4 block hover:shadow-md transition"><div className="flex items-start gap-3"><Icon name="message" /><div><h3 className="font-semibold">Form cues</h3><p className="opacity-80 text-sm">Actionable voice tips while you move.</p></div></div></a>
						<a href="#pose-quality" className="card p-4 block hover:shadow-md transition"><div className="flex items-start gap-3"><Icon name="sun" /><div><h3 className="font-semibold">Pose quality light</h3><p className="opacity-80 text-sm">Simple indicator to stay in frame.</p></div></div></a>
						<a href="#auto-pause" className="card p-4 block hover:shadow-md transition"><div className="flex items-start gap-3"><Icon name="pause" /><div><h3 className="font-semibold">Auto pause</h3><p className="opacity-80 text-sm">Automatically pauses on low visibility.</p></div></div></a>
						<a href="#history-charts" className="card p-4 block hover:shadow-md transition"><div className="flex items-start gap-3"><Icon name="chart" /><div><h3 className="font-semibold">History with charts</h3><p className="opacity-80 text-sm">Track progress over time at a glance.</p></div></div></a>
						<a href="#export" className="card p-4 block hover:shadow-md transition"><div className="flex items-start gap-3"><Icon name="download" /><div><h3 className="font-semibold">Export</h3><p className="opacity-80 text-sm">One-click CSV exports for analysis.</p></div></div></a>
					</div>
				</Container>
			</Section>

			<Section>
				<Container>
					<div className="grid sm:grid-cols-2 gap-3 text-sm" id="demo">
						<div className="rounded-md border p-3 flex items-center gap-2"><span className="badge badge-success">Privacy first</span><span className="opacity-80">All processing is on-device</span></div>
						<div className="rounded-md border p-3 flex items-center gap-2"><span className="badge badge-success">On-device analysis</span><span className="opacity-80">No video uploads</span></div>
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

			<Section>
				<Container>
					<div className="grid md:grid-cols-3 gap-4">
						{testimonials.map((t, i) => (
							<Reveal key={i} delay={i * 80}><Testimonial quote={t.quote} name={t.name} role={t.role} /></Reveal>
						))}
					</div>
					<div className="text-center mt-8">
						<Link href="/signin"><Button variant="primary">Start your first session</Button></Link>
					</div>
				</Container>
			</Section>

			<PricingTeaser />

			<FAQ />

			<FinalCTA />
		</div>
	);
}

function Feature({ title, body, icon }: { title: string; body: string; icon: React.ReactNode }) {
	return (
		<div className="card p-4">
			<div className="flex items-start gap-3">
				<div className="mt-0.5 text-emerald-600">{icon}</div>
				<div>
					<h3 className="font-semibold mb-1">{title}</h3>
					<p className="opacity-80 text-sm">{body}</p>
				</div>
			</div>
		</div>
	);
}

function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
	return (
		<figure className="card p-4">
			<blockquote className="italic">“{quote}”</blockquote>
			<figcaption className="mt-3 flex items-center gap-2 text-sm opacity-80">
				<span className="inline-grid place-items-center h-8 w-8 rounded-full bg-black text-white text-xs">{name.charAt(0)}</span>
				<span>{name} · {role}</span>
			</figcaption>
		</figure>
	);
}
