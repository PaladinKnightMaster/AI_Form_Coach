export type EventName = 'session_started' | 'session_ended' | 'rest_started' | 'undo_used' | 'goal_met' | 'pose_quality_low' | 'rep_completed' | 'pose_autopause_triggered' | 'pose_resume' | 'calibration_started' | 'calibration_completed' | 'rep_correct' | 'rep_incorrect' | 'cue_emitted' | 'leaderboard_view' | 'leaderboard_filter_change' | 'new_top_rank';

export async function logEvent(name: EventName, payload?: Record<string, unknown>) {
	try {
		const [{ getCurrentUserId }, { enqueueWrite }] = await Promise.all([
			import('@/lib/supabase/client'),
			import('@/lib/storage/offlineQueue')
		]);
		const userId = await getCurrentUserId();
		await enqueueWrite({ table: 'events', payload: { user_id: userId, name, payload: payload ?? {} } });
	} catch {}
	try {
		const w = window as unknown as { umami?: ((event: string, data?: Record<string, unknown>) => void) & { trackEvent?: (event: string, data?: Record<string, unknown>) => void } };
		if (w.umami?.trackEvent) {
			w.umami.trackEvent(name, payload ?? {});
		} else if (w.umami) {
			w.umami(name, payload ?? {});
		}
	} catch {}
} 