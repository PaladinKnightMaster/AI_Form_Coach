"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button, Icon } from '@/ui/DS';
import { getSupabaseClient } from '@/lib/supabase/client';
import { subscriptionService } from '@/lib/subscription/subscriptionService';

export default function PricingTeaser() {
	const [cycle, setCycle] = useState<'monthly'|'yearly'>('monthly');
	const [loading, setLoading] = useState(false);
	const [userTier, setUserTier] = useState<'free' | 'pro' | 'founder' | null>(null);
	const proPrice = cycle === 'monthly' ? '$8/mo' : '$79/yr';

	// Check user subscription status
	useEffect(() => {
		const checkSubscription = async () => {
			try {
				const supabase = getSupabaseClient();
				const { data: { user } } = await supabase.auth.getUser();
				
				if (!user) {
					setUserTier('free');
					return;
				}
				const tier = await subscriptionService.getUserTier(user.id);
				setUserTier(tier);
			} catch (error) {
				console.error('Error checking subscription:', error);
				setUserTier('free');
			}
		};

		checkSubscription();
	}, []);
	async function startCheckout(tier?: 'founder') {
		setLoading(true);
		try {
			const supabase = getSupabaseClient();
			const { data } = await supabase.auth.getUser();
			const userId = data.user?.id;
			if (!userId) { window.location.href = '/signin'; return; }
			
			const body: { userId: string; tier?: string; cycle?: string } = { userId };
			if (tier === 'founder') {
				body.tier = 'founder';
			} else {
				body.cycle = cycle;
			}
			
			const res = await fetch('/api/checkout', { 
				method: 'POST', 
				headers: { 'Content-Type': 'application/json' }, 
				body: JSON.stringify(body) 
			});
			const out = await res.json();
			if (out.url) window.location.href = out.url;
		} finally {
			setLoading(false);
		}
	}
	return (
		<section className="section">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
					<div className={`card p-4 ${userTier === 'pro' ? 'border-emerald-500 bg-emerald-50/50' : 'border-emerald-500/50'}`}>
						<div className="flex items-center justify-between mb-1">
							<h3 className="font-semibold">Pro</h3>
							{userTier === 'pro' && (
								<span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium">
									✓ Current Plan
								</span>
							)}
						</div>
						<div className="text-2xl font-extrabold mb-1">{proPrice}</div>
						{userTier === 'pro' ? (
        <p className="text-xs opacity-70 mb-3">You&apos;re currently on the Pro plan!</p>
						) : (
							<p className="text-xs opacity-70 mb-3">No charge yet — sign up to get notified.</p>
						)}
						<ul className="text-sm space-y-1 mb-4">
							<li className="flex items-center gap-2"><Icon name="check" /> AI Plan Generation</li>
							<li className="flex items-center gap-2"><Icon name="check" /> Detailed Trends & Analytics</li>
							<li className="flex items-center gap-2"><Icon name="check" /> Health Data Sync</li>
							<li className="flex items-center gap-2"><Icon name="check" /> Coach Packs Access</li>
							<li className="flex items-center gap-2"><Icon name="check" /> Monthly Challenges</li>
							<li className="flex items-center gap-2"><Icon name="check" /> Premium Analytics</li>
							<li className="flex items-center gap-2"><Icon name="check" /> Export Data</li>
							<li className="flex items-center gap-2"><Icon name="check" /> Priority Support</li>
						</ul>
						{userTier === 'pro' ? (
							<Link href="/account">
								<Button variant="secondary" className="w-full">Manage Subscription</Button>
							</Link>
						) : (
							<Button variant="primary" className="w-full" onClick={() => startCheckout()} disabled={loading}>
								{loading ? 'Redirecting…' : 'Upgrade to Pro'}
							</Button>
						)}
					</div>
					
					<div className={`card p-4 ${userTier === 'founder' ? 'border-purple-500 bg-purple-50/50' : 'border-purple-500/50'} relative`}>
						<div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
							{userTier === 'founder' ? (
								<span className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium">✓ Current Plan</span>
							) : (
								<span className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium">Limited Time</span>
							)}
						</div>
						<h3 className="font-semibold mb-1">Founder</h3>
						<div className="text-2xl font-extrabold mb-1">$199</div>
						{userTier === 'founder' ? (
        <p className="text-xs opacity-70 mb-3">You&apos;re a Founder! Lifetime access unlocked.</p>
						) : (
							<p className="text-xs opacity-70 mb-3">One-time payment • Lifetime access</p>
						)}
						<ul className="text-sm space-y-1 mb-4">
							<li className="flex items-center gap-2"><Icon name="check" /> Everything in Pro</li>
							<li className="flex items-center gap-2"><Icon name="check" /> Lifetime access</li>
							<li className="flex items-center gap-2"><Icon name="check" /> Early access to features</li>
							<li className="flex items-center gap-2"><Icon name="check" /> Founder badge</li>
							<li className="flex items-center gap-2"><Icon name="check" /> Direct feedback channel</li>
							<li className="flex items-center gap-2"><Icon name="check" /> Exclusive content</li>
						</ul>
						{userTier === 'founder' ? (
							<Link href="/account">
								<Button variant="secondary" className="w-full">Manage Account</Button>
							</Link>
						) : (
							<Button variant="primary" className="w-full bg-purple-500 hover:bg-purple-600" onClick={() => startCheckout('founder')} disabled={loading}>
								{loading ? 'Redirecting…' : 'Become a Founder'}
							</Button>
						)}
						{userTier !== 'founder' && <p className="text-xs opacity-70 mt-2">Only 100 spots available</p>}
					</div>
				</div>
			</div>
		</section>
	);
} 