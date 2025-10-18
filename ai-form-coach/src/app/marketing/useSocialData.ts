"use client";
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export type Testimonial = { quote: string; name: string; role: string; avatarInitial?: string };
export type Outcomes = { avgSessionMinutes: number; totalRepsCounted: number; romImprovedPct: number };

export function useSocialData() {
	const [testimonials] = useState<Testimonial[]>([
		{ quote: 'Instant feedback without recording video is a game changer.', name: 'Alex P.', role: 'Coach', avatarInitial: 'A' },
		{ quote: 'Counts reps and cues my form better than my old notes.', name: 'Jamie L.', role: 'Athlete', avatarInitial: 'J' },
		{ quote: 'I trust it because everything runs locally on my phone.', name: 'Taylor K.', role: 'Engineer', avatarInitial: 'T' },
	]);
	const [outcomes, setOutcomes] = useState<Outcomes>({ avgSessionMinutes: 12, totalRepsCounted: 12450, romImprovedPct: 78 });

	useEffect(() => {
		(async () => {
			try {
				const supabase = getSupabaseClient();
				const { data } = await supabase.from('metrics_public').select('*').eq('id', 1).maybeSingle();
				if (data) {
					setOutcomes({
						avgSessionMinutes: Number(data.avg_session_minutes ?? outcomes.avgSessionMinutes),
						totalRepsCounted: Number(data.total_reps_counted ?? outcomes.totalRepsCounted),
						romImprovedPct: Number(data.rom_improved_pct ?? outcomes.romImprovedPct)
					});
				}
			} catch {}
		})();
	}, [outcomes.avgSessionMinutes, outcomes.romImprovedPct, outcomes.totalRepsCounted]);

	return { testimonials, outcomes };
} 