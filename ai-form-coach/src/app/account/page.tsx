"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Badge, Button } from '@/ui/DS';
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
	const [detailedCoaching, setDetailedCoaching] = useState(true);
	
	// Camera assist settings (A6)
	const [mirrorVideo, setMirrorVideo] = useState(true);
	const [largeText, setLargeText] = useState(false);
	const [highContrast, setHighContrast] = useState(false);
	
	// Ghost pacing settings (M2)
	const [reducedMotion, setReducedMotion] = useState(false);
	
	// Micro model settings (P8)
	const [microModelEnabled, setMicroModelEnabled] = useState(false);
	
	// Enhanced phase detection settings (P9)
	const [enhancedPhaseDetectionEnabled, setEnhancedPhaseDetectionEnabled] = useState(true);

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
				const savedDetailedCoaching = localStorage.getItem('detailedCoaching');
				if (savedMentorCueEnabled !== null) {
					setMentorCueEnabled(savedMentorCueEnabled === 'true');
				}
				if (savedVoiceEnabled !== null) {
					setVoiceEnabled(savedVoiceEnabled === 'true');
				}
				if (savedDetailedCoaching !== null) {
					setDetailedCoaching(savedDetailedCoaching === 'true');
				}
			} catch (error) {
				console.warn('Failed to load mentor cue settings:', error);
			}
			
			// Load A6 camera assist settings from localStorage
			try {
				const savedMirrorVideo = localStorage.getItem('mirrorVideo');
				const savedLargeText = localStorage.getItem('largeText');
				const savedHighContrast = localStorage.getItem('highContrast');
				if (savedMirrorVideo !== null) {
					setMirrorVideo(savedMirrorVideo === 'true');
				}
				if (savedLargeText !== null) {
					setLargeText(savedLargeText === 'true');
				}
				if (savedHighContrast !== null) {
					setHighContrast(savedHighContrast === 'true');
				}
			} catch (error) {
				console.warn('Failed to load camera assist settings:', error);
			}
			
			// Load M2 ghost pacing settings from localStorage
			try {
				const savedReducedMotion = localStorage.getItem('reducedMotion');
				if (savedReducedMotion !== null) {
					setReducedMotion(savedReducedMotion === 'true');
				}
			} catch (error) {
				console.warn('Failed to load ghost pacing settings:', error);
			}
			
		// Load P8 micro model settings from localStorage
		try {
			const savedMicroModelEnabled = localStorage.getItem('microModelEnabled');
			if (savedMicroModelEnabled !== null) {
				setMicroModelEnabled(savedMicroModelEnabled === 'true');
			}
		} catch (error) {
			console.warn('Failed to load micro model settings:', error);
		}
		
		// Load P9 enhanced phase detection settings from localStorage
		try {
			const savedEnhancedPhaseDetection = localStorage.getItem('enhancedPhaseDetectionEnabled');
			if (savedEnhancedPhaseDetection !== null) {
				setEnhancedPhaseDetectionEnabled(savedEnhancedPhaseDetection === 'true');
			}
		} catch (error) {
			console.warn('Failed to load enhanced phase detection settings:', error);
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
	
	function handleDetailedCoachingToggle(enabled: boolean) {
		setDetailedCoaching(enabled);
		try {
			localStorage.setItem('detailedCoaching', enabled.toString());
		} catch (error) {
			console.warn('Failed to save detailed coaching setting:', error);
		}
	}
	
	// A6: Camera assist setting handlers
	function handleMirrorVideoToggle(enabled: boolean) {
		setMirrorVideo(enabled);
		try {
			localStorage.setItem('mirrorVideo', enabled.toString());
		} catch (error) {
			console.warn('Failed to save mirror video setting:', error);
		}
	}
	
	function handleLargeTextToggle(enabled: boolean) {
		setLargeText(enabled);
		try {
			localStorage.setItem('largeText', enabled.toString());
		} catch (error) {
			console.warn('Failed to save large text setting:', error);
		}
	}
	
	function handleHighContrastToggle(enabled: boolean) {
		setHighContrast(enabled);
		try {
			localStorage.setItem('highContrast', enabled.toString());
		} catch (error) {
			console.warn('Failed to save high contrast setting:', error);
		}
	}
	
	// M2: Ghost pacing setting handlers
	function handleReducedMotionToggle(enabled: boolean) {
		setReducedMotion(enabled);
		try {
			localStorage.setItem('reducedMotion', enabled.toString());
		} catch (error) {
			console.warn('Failed to save reduced motion setting:', error);
		}
	}
	
	// P8: Micro model setting handlers
	function handleMicroModelToggle(enabled: boolean) {
		setMicroModelEnabled(enabled);
		try {
			localStorage.setItem('microModelEnabled', enabled.toString());
		} catch (error) {
			console.warn('Failed to save micro model setting:', error);
		}
	}
	
	// P9: Enhanced phase detection setting handlers
	function handleEnhancedPhaseDetectionToggle(enabled: boolean) {
		setEnhancedPhaseDetectionEnabled(enabled);
		try {
			localStorage.setItem('enhancedPhaseDetectionEnabled', enabled.toString());
		} catch (error) {
			console.warn('Failed to save enhanced phase detection setting:', error);
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
						
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium text-gray-900">Detailed Coaching</h4>
								<p className="text-sm text-gray-600">Show detailed form feedback vs minimal cues only</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input 
									type="checkbox" 
									checked={detailedCoaching && mentorCueEnabled}
									disabled={!mentorCueEnabled}
									onChange={(e) => handleDetailedCoachingToggle(e.target.checked)}
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
				
				{/* Camera Assist Settings (A6) */}
				<div className="rounded-lg border p-4">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="text-lg font-semibold text-gray-900">Camera Assist</h3>
							<p className="text-sm text-gray-600">Optimize your camera setup and display preferences</p>
						</div>
						<Badge tone="info" size="sm">📹 Camera Quality</Badge>
					</div>
					
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium text-gray-900">Mirror Video</h4>
								<p className="text-sm text-gray-600">Flip the video horizontally for a mirror-like view</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input 
									type="checkbox" 
									checked={mirrorVideo}
									onChange={(e) => handleMirrorVideoToggle(e.target.checked)}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
							</label>
						</div>
						
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium text-gray-900">Large Text</h4>
								<p className="text-sm text-gray-600">Use larger text in the HUD for better visibility</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input 
									type="checkbox" 
									checked={largeText}
									onChange={(e) => handleLargeTextToggle(e.target.checked)}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
							</label>
						</div>
						
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium text-gray-900">High Contrast Overlay</h4>
								<p className="text-sm text-gray-600">Use high contrast colors for better visibility</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input 
									type="checkbox" 
									checked={highContrast}
									onChange={(e) => handleHighContrastToggle(e.target.checked)}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
							</label>
						</div>
						
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
							<div className="flex items-start gap-2">
								<div className="text-blue-600 text-sm">💡</div>
								<div className="text-sm text-blue-800">
									<p className="font-medium">Quality Monitoring</p>
									<p>The app automatically monitors camera quality and will pause counting if it can&apos;t see your full body clearly for more than 1.5 seconds. This helps ensure accurate pose detection.</p>
								</div>
							</div>
						</div>
					</div>
				</div>
				
				{/* Ghost Pacing Settings (M2) */}
				<div className="rounded-lg border p-4">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="text-lg font-semibold text-gray-900">Ghost Pacing</h3>
							<p className="text-sm text-gray-600">Compare your current session against your best performance</p>
						</div>
						<Badge tone="info" size="sm">👻 PR Ghost</Badge>
					</div>
					
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium text-gray-900">Reduced Motion</h4>
								<p className="text-sm text-gray-600">Disable animations and transitions for accessibility</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input 
									type="checkbox" 
									checked={reducedMotion}
									onChange={(e) => handleReducedMotionToggle(e.target.checked)}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
							</label>
						</div>
						
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
							<div className="flex items-start gap-2">
								<div className="text-blue-600 text-sm">💡</div>
								<div className="text-sm text-blue-800">
									<p className="font-medium">Live PR Ghost</p>
									<p>The pacing bar shows how you&apos;re performing compared to your best verified session. It helps you maintain consistent pace and push for new personal records.</p>
								</div>
							</div>
						</div>
					</div>
				</div>
				
				{/* Micro Model Settings (P8) */}
				<div className="rounded-lg border p-4">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="text-lg font-semibold text-gray-900">AI Quality Scorer</h3>
							<p className="text-sm text-gray-600">Enhanced quality scoring using machine learning</p>
						</div>
						<Badge tone="warning" size="sm">🧠 Beta</Badge>
					</div>
					
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium text-gray-900">Enable Micro Model</h4>
								<p className="text-sm text-gray-600">Blend rule-based scoring (60%) with AI model scoring (40%) for better edge case handling</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input 
									type="checkbox" 
									checked={microModelEnabled}
									onChange={(e) => handleMicroModelToggle(e.target.checked)}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
							</label>
						</div>
						
						<div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
							<div className="flex items-start gap-2">
								<div className="text-amber-600 text-sm">⚠️</div>
								<div className="text-sm text-amber-800">
									<p className="font-medium">Beta Feature</p>
									<p>This feature uses a tiny on-device AI model to improve quality scoring for borderline cases. When disabled, the app uses traditional rule-based scoring only.</p>
								</div>
							</div>
						</div>
						
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
							<div className="flex items-start gap-2">
								<div className="text-blue-600 text-sm">💡</div>
								<div className="text-sm text-blue-800">
									<p className="font-medium">How It Works</p>
									<p>The micro model analyzes 15 features (duration, tempo, ROM, errors, depth, stability, etc.) and provides a quality score that&apos;s blended with traditional rules for more consistent borderline rep classification.</p>
								</div>
							</div>
						</div>
					</div>
				</div>
				
				{/* Calibration Settings (P2) */}
				<div className="rounded-lg border p-4">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="text-lg font-semibold text-gray-900">Personal Calibration</h3>
							<p className="text-sm text-gray-600">Calibrate your personal movement ranges for accurate coaching</p>
						</div>
						<Badge tone="info" size="sm">🎯 Personalization</Badge>
					</div>
					
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium text-gray-900">Recalibrate Movement Ranges</h4>
								<p className="text-sm text-gray-600">Update your personal depth and angle thresholds</p>
							</div>
							<Button
								onClick={() => router.push('/calibrate')}
								variant="outline"
								size="sm"
							>
								Recalibrate
							</Button>
						</div>
						
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
							<div className="flex items-start gap-2">
								<div className="text-blue-600 text-sm">💡</div>
								<div className="text-sm text-blue-800">
									<p className="font-medium">Personalized Coaching</p>
									<p>We&apos;ll learn your range so coaching matches your body. This ensures &quot;Correct&quot; judgments align with your natural movement patterns.</p>
								</div>
							</div>
						</div>
					</div>
				</div>
				
				{/* Enhanced Phase Detection Settings (P9) */}
				<div className="rounded-lg border p-4">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="text-lg font-semibold text-gray-900">Enhanced Phase Detection</h3>
							<p className="text-sm text-gray-600">Advanced phase detection with Savitzky-Golay smoothing and HMM</p>
						</div>
						<Badge tone="success" size="sm">🎯 P9</Badge>
					</div>
					
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium text-gray-900">Enable Enhanced Detection</h4>
								<p className="text-sm text-gray-600">Use advanced signal processing to reduce noise and improve phase detection accuracy</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input 
									type="checkbox" 
									checked={enhancedPhaseDetectionEnabled}
									onChange={(e) => handleEnhancedPhaseDetectionToggle(e.target.checked)}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
							</label>
						</div>
						
						<div className="bg-green-50 border border-green-200 rounded-lg p-3">
							<div className="flex items-start gap-2">
								<div className="text-green-600 text-sm">✨</div>
								<div className="text-sm text-green-800">
									<p className="font-medium">Advanced Signal Processing</p>
									<p>Uses Savitzky-Golay smoothing to reduce noise and Hidden Markov Models (HMM) for robust phase detection. This helps with wobbly mid-range movements and slow, controlled reps.</p>
								</div>
							</div>
						</div>
						
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
							<div className="flex items-start gap-2">
								<div className="text-blue-600 text-sm">🎯</div>
								<div className="text-sm text-blue-800">
									<p className="font-medium">Benefits</p>
									<p>• Reduces false phase changes from noise<br/>• Better detection of slow, controlled movements<br/>• More stable rep counting<br/>• Improved accuracy for borderline cases</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}