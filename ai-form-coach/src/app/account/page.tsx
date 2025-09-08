"use client";
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

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
		<div className="p-6 max-w-2xl mx-auto space-y-4">
			<h1 className="text-2xl font-semibold">Account</h1>
			<div className="rounded-lg border p-4">
				<div className="mb-2">Signed in as <span className="font-medium">{email}</span></div>
				<div className="flex items-center gap-2">
					<span className={`badge ${plan==='pro'?'badge-success':'badge-warning'}`}>{plan.toUpperCase()}</span>
					{renewsAt ? <span className="text-sm opacity-80">Renews {new Date(renewsAt).toLocaleDateString()}</span> : null}
				</div>
				<div className="mt-3">
					<button onClick={goManage} className="btn btn-secondary">Manage plan</button>
				</div>
			</div>
		</div>
	);
} 