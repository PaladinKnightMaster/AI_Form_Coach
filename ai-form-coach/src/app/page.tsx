import Link from 'next/link';
import { Container, Section, Button, Badge, Icon } from '@/ui/DS';
import Reveal from '@/ui/Reveal';
import HeroCanvas from '@/components/HeroCanvas';
import { logos, testimonials } from './marketing/data';

export default function Home() {
	return (
		<main id="main">
			<section className="relative overflow-hidden">
				<div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
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
									<a href="#demo" className="btn btn-secondary">Watch demo</a>
								</div>
								<div className="flex items-center gap-3 pt-2 text-sm opacity-80">
									<Icon name="check" /> No video leaves your device
									<span className="mx-1">•</span>
									<Icon name="check" /> Works offline
								</div>
							</div>
						</Reveal>
						<div className="relative">
							<div className="card p-3 shadow-lg hero-float">
								<HeroCanvas />
							</div>
						</div>
					</div>
				</Container>
			</section>

			<Section>
				<Container>
					<div className="grid sm:grid-cols-2 gap-3 text-sm" id="demo">
						<div className="rounded-md border p-3 flex items-center gap-2"><span className="badge badge-success">Privacy first</span><span className="opacity-80">All processing is on-device</span></div>
						<div className="rounded-md border p-3 flex items-center gap-2"><span className="badge badge-success">On-device analysis</span><span className="opacity-80">No video uploads</span></div>
					</div>
				</Container>
			</Section>

			<Section>
				<Container>
					<div className="text-xs uppercase tracking-wide opacity-70 mb-3">Trusted by builders</div>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-center">
						{logos.map((l, i) => (<img key={i} src={l.src} alt={l.alt} className="h-6 opacity-70 logo" />))}
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
		</main>
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
