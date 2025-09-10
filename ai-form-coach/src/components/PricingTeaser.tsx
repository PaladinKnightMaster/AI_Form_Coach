"use client";
import Link from 'next/link';
import { useState } from 'react';
import { Button, Icon } from '@/ui/DS';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function PricingTeaser() {
	const [cycle, setCycle] = useState<'monthly'|'yearly'>('monthly');
	const [loading, setLoading] = useState(false);
	const proPrice = cycle === 'monthly' ? '$8/mo' : '$79/yr';
	async function startCheckout() {
		setLoading(true);
		try {
			const supabase = getSupabaseClient();
			const { data } = await supabase.auth.getUser();
			const userId = data.user?.id;
			if (!userId) { window.location.href = '/signin'; return; }
			const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cycle, userId }) });
			const out = await res.json();
			if (out.url) window.location.href = out.url;
		} finally {
			setLoading(false);
		}
	}
	return (
		<section className="section">
			<div className="container">
				<div className="text-center mb-6">
					<h2 className="font-semibold" style={{ fontSize: 'var(--step-2)' }}>Simple pricing</h2>
					<p className="opacity-80 text-sm">Start free. Upgrade anytime.</p>
					<div className="inline-flex items-center gap-1 mt-3 border rounded-md p-1">
						<button aria-pressed={cycle==='monthly'} onClick={() => setCycle('monthly')} className={`px-3 py-1 text-sm rounded ${cycle==='monthly'?'bg-black text-white':''}`}>Monthly</button>
						<button aria-pressed={cycle==='yearly'} onClick={() => setCycle('yearly')} className={`px-3 py-1 text-sm rounded ${cycle==='yearly'?'bg-black text-white':''}`}>Yearly</button>
					</div>
				</div>
				<div className="grid md:grid-cols-2 gap-4">
					<div className="card p-4">
						<h3 className="font-semibold mb-1">Free</h3>
						<div className="text-2xl font-extrabold mb-3">$0</div>
						<ul className="text-sm space-y-1 mb-4">
							<li className="flex items-center gap-2"><Icon name="check" /> Live form tracking (squat, pushup, plank)</li>
							<li className="flex items-center gap-2"><Icon name="check" /> Basic history</li>
						</ul>
						<Link href="/signin"><Button variant="secondary" className="w-full">Begin training</Button></Link>
					</div>
					<div className="card p-4 border-emerald-500/50">
						<h3 className="font-semibold mb-1">Pro</h3>
						<div className="text-2xl font-extrabold mb-1">{proPrice}</div>
						<p className="text-xs opacity-70 mb-3">No charge yet — sign up to get notified.</p>
						<ul className="text-sm space-y-1 mb-4">
							<li className="flex items-center gap-2"><Icon name="check" /> Form IQ score</li>
							<li className="flex items-center gap-2"><Icon name="check" /> Trends & insights</li>
							<li className="flex items-center gap-2"><Icon name="check" /> Goal programs</li>
							<li className="flex items-center gap-2"><Icon name="check" /> Export without watermark</li>
							<li className="flex items-center gap-2"><Icon name="check" /> Health sync</li>
						</ul>
						<Button variant="primary" className="w-full" onClick={startCheckout} disabled={loading}>{loading ? 'Redirecting…' : 'Upgrade to Pro'}</Button>
						<p className="text-xs opacity-70 mt-2">Limited lifetime tier coming soon.</p>
					</div>
				</div>
			</div>
		</section>
	);
} 