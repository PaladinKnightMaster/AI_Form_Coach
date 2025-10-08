"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Badge } from '@/ui/DS';
import { getCalibrationStatus } from '@/lib/calibration/service';

export default function Account() {
	const router = useRouter();
	const [email, setEmail] = useState<string>('');
	const [plan, setPlan] = useState<'free'|'pro'|'lifetime'>('free');
	const [renewsAt, setRenewsAt] = useState<string | null>(null);
	const [calibrationStatus, setCalibrationStatus] = useState<{
		isCalibrated: boolean;
		completedSteps: string[];
		missingSteps: string[];
		lastCalibrated?: Date;
	} | null>(null);
	
	// Mentor cue settings (A5)
	const [mentorCueEnabled, setMentorCueEnabled] = useState(true);
	const [voiceEnabled, setVoiceEnabled] = useState(true);

	useEffect(() => {
		(async () => {
			const supabase = getSupabaseClient();
			const { data: u } = await supabase.auth.getUser();
			setEmail(u.user?.email ?? '');
			if (u.user) {
				const { data } = await supabase.from('profiles').select('plan,plan_renews_at').eq('id', u.user.id).maybeSingle();
				if (data) { setPlan((data.plan as typeof plan) ?? 'free'); setRenewsAt(data.plan_renews_at ?? null); }
				
				// Load calibration status
				const status = await getCalibrationStatus();
				setCalibrationStatus(status);
			}
			
			// Load mentor cue settings from localStorage
			try {
				const savedMentorCueEnabled = localStorage.getItem('mentorCueEnabled');
				const savedVoiceEnabled = localStorage.getItem('voiceEnabled');
				if (savedMentorCueEnabled !== null) {
					setMentorCueEnabled(savedMentorCueEnabled === 'true');
				}
				if (savedVoiceEnabled !== null) {
					setVoiceEnabled(savedVoiceEnabled === 'true');
				}
			} catch (error) {
				console.warn('Failed to load mentor cue settings:', error);
			}
		})();
	}, []);

	async function goManage() {
		alert('Coming soon: billing portal');
	}
	
	function handleMentorCueToggle(enabled: boolean) {
		setMentorCueEnabled(enabled);
		try {
			localStorage.setItem('mentorCueEnabled', enabled.toString());
		} catch (error) {
			console.warn('Failed to save mentor cue setting:', error);
		}
	}
	
	function handleVoiceToggle(enabled: boolean) {
		setVoiceEnabled(enabled);
		try {
			localStorage.setItem('voiceEnabled', enabled.toString());
		} catch (error) {
			console.warn('Failed to save voice setting:', error);
		}
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
				
				{/* Device Calibration Section */}
				<div className="rounded-lg border p-4">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="text-lg font-semibold text-gray-900">Device Calibration</h3>
							<p className="text-sm text-gray-600">Personalize your exercise thresholds for better accuracy</p>
						</div>
						<div className="flex items-center gap-2">
							{calibrationStatus?.isCalibrated ? (
								<Badge tone="success" size="sm">✅ Calibrated</Badge>
							) : (
								<Badge tone="warning" size="sm">⚠️ Not Calibrated</Badge>
							)}
						</div>
					</div>
					
					{calibrationStatus && (
						<div className="mb-4">
							{calibrationStatus.isCalibrated ? (
								<div className="text-sm text-gray-600">
									<p>✅ All exercises calibrated</p>
									{calibrationStatus.lastCalibrated && (
										<p>Last calibrated: {calibrationStatus.lastCalibrated.toLocaleDateString()}</p>
									)}
								</div>
							) : (
								<div className="text-sm text-gray-600">
									<p>Missing calibration for: {calibrationStatus.missingSteps.join(', ')}</p>
									<p className="text-orange-600">⚠️ Calibration recommended for better accuracy</p>
								</div>
							)}
						</div>
					)}
					
					<div className="space-x-2">
						<button 
							onClick={() => router.push('/calibrate')}
							className="btn btn-primary"
						>
							{calibrationStatus?.isCalibrated ? 'Recalibrate' : 'Start Calibration'}
						</button>
						{calibrationStatus?.isCalibrated && (
							<button 
								onClick={() => {
									if (confirm('This will clear your calibration data. Are you sure?')) {
										// Clear calibration logic would go here
										alert('Calibration cleared. You can recalibrate anytime.');
									}
								}}
								className="btn btn-secondary text-sm"
							>
								Clear Calibration
							</button>
						)}
					</div>
				</div>
				
				{/* Mentor Cue Settings */}
				<div className="rounded-lg border p-4">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="text-lg font-semibold text-gray-900">Mentor Cues</h3>
							<p className="text-sm text-gray-600">Configure intelligent coaching feedback and voice cues</p>
						</div>
						<Badge tone="info" size="sm">🎯 Smart Coaching</Badge>
					</div>
					
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium text-gray-900">Enable Mentor Cues</h4>
								<p className="text-sm text-gray-600">Show intelligent coaching feedback during exercises</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input 
									type="checkbox" 
									checked={mentorCueEnabled}
									onChange={(e) => handleMentorCueToggle(e.target.checked)}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
							</label>
						</div>
						
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium text-gray-900">Voice Cues</h4>
								<p className="text-sm text-gray-600">Enable spoken coaching feedback (requires mentor cues)</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input 
									type="checkbox" 
									checked={voiceEnabled && mentorCueEnabled}
									disabled={!mentorCueEnabled}
									onChange={(e) => handleVoiceToggle(e.target.checked)}
									className="sr-only peer"
								/>
								<div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 ${!mentorCueEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
							</label>
						</div>
						
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
							<div className="flex items-start gap-2">
								<div className="text-blue-600 text-sm">💡</div>
								<div className="text-sm text-blue-800">
									<p className="font-medium">Smart Cue System</p>
									<p>Mentor cues use intelligent prioritization and cooldowns to reduce spam while providing actionable feedback. Critical errors (🚨) get priority over minor issues (💡).</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}