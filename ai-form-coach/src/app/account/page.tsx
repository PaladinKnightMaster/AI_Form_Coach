"use client";
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Badge } from '@/ui/DS';

export default function Account() {
	const [email, setEmail] = useState<string>('');
	const [plan, setPlan] = useState<'free'|'pro'|'lifetime'>('free');
	const [renewsAt, setRenewsAt] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			const supabase = getSupabaseClient();
			const { data: u } = await supabase.auth.getUser();
			setEmail(u.user?.email ?? '');
			if (u.user) {
				const { data } = await supabase.from('profiles').select('plan,plan_renews_at').eq('id', u.user.id).maybeSingle();
				if (data) { setPlan((data.plan as typeof plan) ?? 'free'); setRenewsAt(data.plan_renews_at ?? null); }
			}
		})();
	}, []);

	async function goManage() {
		alert('Coming soon: billing portal');
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-900 dark:via-gray-900/30 dark:to-zinc-900/30">
			<div className="p-6 max-w-4xl mx-auto space-y-8">
				<div className="text-center space-y-4">
					<Badge tone="neutral" size="lg" className="bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800">
						👤 Account Management
					</Badge>
					<h1 className="text-5xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
						Account Settings
					</h1>
					<p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
						Manage your account, subscription, and preferences
					</p>
				</div>
			<div className="rounded-lg border p-4">
				<div className="mb-2">Signed in as <span className="font-medium">{email}</span></div>
				<div className="flex items-center gap-2">
					<span className={`badge ${plan==='pro'?'badge-success':'badge-warning'}`}>{plan.toUpperCase()}</span>
					{renewsAt ? <span className="text-sm opacity-80">Renews {new Date(renewsAt).toLocaleDateString()}</span> : null}
				</div>
				<div className="mt-3 space-x-2">
					<button onClick={goManage} className="btn btn-secondary">Manage plan</button>
					<button 
						onClick={() => {
							try {
								localStorage.removeItem('afc_first_run_seen');
								alert('First-run tutorial reset. Visit the Coach page to see it again.');
							} catch {
								alert('Unable to reset tutorial.');
							}
						}}
						className="btn btn-secondary text-sm"
					>
						Reset tutorial
					</button>
				</div>
			</div>
		</div>
	);
}