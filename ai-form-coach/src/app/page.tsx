import Link from 'next/link';
import { Container, Section, Button, Badge, Icon } from '@/ui/DS';
import Reveal from '@/ui/Reveal';

export default function Home() {
	return (
		<main>
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
									<Link href="/coach"><Button variant="secondary">Try demo</Button></Link>
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
								<img src="/hero.svg" alt="On-device AI coaching illustration" className="w-full rounded-lg" />
							</div>
						</div>
					</div>
				</Container>
			</section>

			<Section>
				<Container>
					<div className="grid md:grid-cols-3 gap-6">
						<Reveal><Feature title="Private on‑device" body="All pose detection runs locally with MediaPipe—no uploads, just insights." icon={<Icon name="check" />} /></Reveal>
						<Reveal delay={60}><Feature title="Real‑time cues" body="Hear actionable guidance as you move to improve form instantly." icon={<Icon name="check" />} /></Reveal>
						<Reveal delay={120}><Feature title="Rep & ROM tracking" body="Automatic counting with depth/ROM metrics to measure progress." icon={<Icon name="check" />} /></Reveal>
						<Reveal delay={180}><Feature title="Goals & rest timers" body="Hit targets for reps or time; built‑in rest with haptic cues." icon={<Icon name="check" />} /></Reveal>
						<Reveal delay={240}><Feature title="Offline first" body="Train anywhere; sessions sync when you’re back online." icon={<Icon name="check" />} /></Reveal>
						<Reveal delay={300}><Feature title="Export & history" body="Review past sessions, copy summaries, and export CSV." icon={<Icon name="check" />} /></Reveal>
					</div>
					<div className="text-center mt-8">
						<Link href="/signin"><Button variant="primary">Create free account</Button></Link>
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
