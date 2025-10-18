export type EventName = 'session_started' | 'session_ended' | 'rest_started' | 'undo_used' | 'goal_met' | 'pose_quality_low' | 'rep_completed' | 'pose_autopause_triggered' | 'pose_resume' | 'calibration_started' | 'calibration_completed' | 'rep_correct' | 'rep_incorrect' | 'cue_emitted' | 'leaderboard_view' | 'leaderboard_filter_change' | 'new_top_rank' | 'report_generated' | 'report_shared' | 'organization_created' | 'organization_joined' | 'organization_dashboard_viewed' | 'organization_export_requested' | 'organization_webhook_configured' | 'user_signup' | 'user_first_session' | 'user_week_1_active' | 'user_week_2_active' | 'landing_page_view' | 'signup_start' | 'signup_complete' | 'first_session' | 'pro_trial_start' | 'pro_convert' | 'pack_purchase' | 'session_verify' | 'rep_undo' | 'api_latency' | 'processing_time' | 'error_occurred' | 'device_processing' | 'feature_used' | 'page_view' | 'button_click' | 'navigation' | 'pricing_view' | 'checkout_start' | 'payment_success' | 'subscription_change' | 'pack_view';

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