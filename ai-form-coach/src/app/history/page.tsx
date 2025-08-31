"use client";
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function History() {
	type S = { id: string; exercise: string; started_at: string };
	const [sessions, setSessions] = useState<S[]>([]);

	useEffect(() => {
		(async () => {
			try {
				const supabase = getSupabaseClient();
				const { data } = await supabase.from('sessions').select('*').order('started_at', { ascending: false });
				setSessions(data ?? []);
			} catch (_) {
				setSessions([]);
			}
		})();
	}, []);

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<h1 className="text-2xl font-semibold mb-4">History</h1>
			{sessions.length === 0 ? (
				<div className="rounded-lg border p-6 text-center opacity-80">No sessions yet. Start one on the Coach page.</div>
			) : (
				<ul className="space-y-3">
					{sessions.map((s) => (
						<li key={s.id} className="rounded-lg border p-4 flex items-center justify-between">
							<div>
								<div className="font-medium capitalize">{s.exercise}</div>
								<div className="text-sm opacity-70">{new Date(s.started_at).toLocaleString()}</div>
							</div>
							<a className="text-blue-600" href={`/session/${s.id}`}>Open</a>
						</li>
					))}
				</ul>
			)}
		</div>
	);
} 