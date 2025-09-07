"use client";
import { useSocialData } from '@/app/marketing/useSocialData';

export default function SocialProofBand() {
	const { testimonials, outcomes } = useSocialData();
	return (
		<div className="section">
			<div className="grid lg:grid-cols-[2fr_1fr] gap-6 items-center">
				<TestimonialSlider items={testimonials} />
				<OutcomesStrip avg={outcomes.avgSessionMinutes} total={outcomes.totalRepsCounted} pct={outcomes.romImprovedPct} />
			</div>
		</div>
	);
}

function TestimonialSlider({ items }: { items: { quote: string; name: string; role: string; avatarInitial?: string }[] }) {
	const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	if (prefersReduced) {
		return (
			<div className="card p-4 space-y-3">
				{items.map((t, i) => <SmallTestimonial key={i} quote={t.quote} name={t.name} role={t.role} avatarInitial={t.avatarInitial} />)}
			</div>
		);
	}
	return (
		<div className="card p-4 overflow-hidden">
			<div className="whitespace-nowrap animate-[scrollLeft_20s_linear_infinite]" style={{ display: 'flex', gap: '12px' }}>
				{items.concat(items).map((t, i) => (
					<div key={i} className="min-w-[260px] max-w-[260px]">
						<SmallTestimonial quote={t.quote} name={t.name} role={t.role} avatarInitial={t.avatarInitial} />
					</div>
				))}
			</div>
		</div>
	);
}

function SmallTestimonial({ quote, name, role, avatarInitial }: { quote: string; name: string; role: string; avatarInitial?: string }) {
	return (
		<figure className="border rounded-md p-3 bg-white/60 dark:bg-white/5 whitespace-normal break-words">
			<blockquote className="text-sm leading-snug">“{quote}”</blockquote>
			<figcaption className="mt-2 flex items-center gap-2 text-xs opacity-80">
				<span className="inline-grid place-items-center h-7 w-7 rounded-full bg-black text-white">{avatarInitial ?? name.charAt(0)}</span>
				<span>{name} · {role}</span>
			</figcaption>
		</figure>
	);
}

function OutcomesStrip({ avg, total, pct }: { avg: number; total: number; pct: number }) {
	return (
		<div className="grid grid-cols-3 gap-2 text-center">
			<div className="card p-3"><div className="text-xs opacity-70">Avg session</div><div className="text-lg font-semibold">{avg} min</div></div>
			<div className="card p-3"><div className="text-xs opacity-70">Reps counted</div><div className="text-lg font-semibold">{total.toLocaleString()}</div></div>
			<div className="card p-3"><div className="text-xs opacity-70">ROM improved</div><div className="text-lg font-semibold">{pct}%</div></div>
		</div>
	);
} 