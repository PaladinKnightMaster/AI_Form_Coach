"use client";
import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AuthCard from '@/components/AuthCard';
import { useToastContext } from '@/components/ToastProvider';
import LoadingButton from '@/components/LoadingButton';

export default function SignIn() {
	const { success: showSuccess, error: showError } = useToastContext();
	const [mode, setMode] = useState<'signin'|'signup'|'reset-request'|'magic-link'>('signin');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [resendCountdown, setResendCountdown] = useState(0);
	const router = useRouter();

	useEffect(() => {
		if (resendCountdown > 0) {
			const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [resendCountdown]);

	useEffect(() => { 
		if (mode !== 'signup') { setConfirm(''); } 
		if (mode !== 'magic-link') { setSuccess(false); setResendCountdown(0); }
	}, [mode]);

	async function ensureProfile(userId: string) {
		try {
			const supabase = getSupabaseClient();
			
			// Check if profile already exists
			const { data: existingProfile } = await supabase
				.from('profiles')
				.select('id')
				.eq('id', userId)
				.single();
			
			if (existingProfile) {
				// Profile already exists, no need to create
				return;
			}
			
			// Create new profile
			const { error } = await supabase
				.from('profiles')
				.insert({ id: userId });
			
			if (error) {
				console.error('Profile creation error:', {
					error: error.message,
					code: error.code,
					details: error.details,
					hint: error.hint,
					userId
				});
			}
		} catch (err) {
			console.error('Unexpected profile error:', {
				error: err,
				userId
			});
		}
	}

	async function sendMagicLink() {
		if (!email) {
			showError('Email Required', 'Please enter your email address');
			return;
		}

		setLoading(true);
		const supabase = getSupabaseClient();
		try {
			const { error } = await supabase.auth.signInWithOtp({
				email,
				options: {
					emailRedirectTo: `${window.location.origin}/auth/callback`
				}
			});

			if (error) {
				showError('Magic Link Failed', error.message);
				return;
			}

			setSuccess(true);
			setResendCountdown(60);
		} finally {
			setLoading(false);
		}
	}

	async function handleResend() {
		if (resendCountdown > 0) return;
		await sendMagicLink();
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault(); 
		setLoading(true);
		
		const supabase = getSupabaseClient();
		try {
			if (mode === 'magic-link') {
				await sendMagicLink();
				return;
			}
			
			if (mode === 'signup') {
				if (!email || !password) { showError('Validation Error', 'Enter email and password'); return; }
				if (password.length < 6) { showError('Password Too Short', 'Password must be at least 6 characters'); return; }
				if (password !== confirm) { showError('Password Mismatch', 'Passwords do not match'); return; }
				
				// Check if user already exists before attempting signup
				try {
					// First check if user is already signed in
					const { data: existingUser } = await supabase.auth.getUser();
					if (existingUser.user && existingUser.user.email === email) {
						showError('Account Already Exists', 'You are already signed in with this email address.');
						return;
					}
					
					// Then check if any user exists with this email in the database
					const { data: userExists } = await supabase.rpc('check_user_exists', { p_email: email });
					if (userExists) {
						showError('Account Already Exists', 'An account with this email address already exists. Please sign in instead or use a different email address.');
						setMode('signin');
						return;
					}
				} catch (error) {
					// If RPC function doesn't exist yet, continue with signup
					console.log('RPC function not available, continuing with signup:', error);
				}
				const { data, error } = await supabase.auth.signUp({ 
					email, 
					password,
					options: {
						emailRedirectTo: `${window.location.origin}/auth/callback`
					}
				});
				
				// Debug: Log the response to understand the structure
				console.log('Signup response:', { data, error });
				
				if (error) {
					const msg = error.message.toLowerCase();
					const errorCode = error.code || '';
					
					// Check for various "account already exists" scenarios
					if (error.status === 422 || 
						errorCode === 'user_already_registered' ||
						msg.includes('registered') || 
						msg.includes('already') ||
						msg.includes('exists') ||
						msg.includes('duplicate') ||
						msg.includes('taken')) {
						showError('Account Already Exists', 'An account with this email address already exists. Please sign in instead or use a different email address.');
						setMode('signin');
					} else if (msg.includes('invalid') && msg.includes('email')) {
						showError('Invalid Email', 'Please enter a valid email address.');
					} else if (msg.includes('password') && msg.includes('weak')) {
						showError('Weak Password', 'Please choose a stronger password with at least 6 characters.');
					} else if (msg.includes('rate limit') || msg.includes('too many')) {
						showError('Too Many Attempts', 'Please wait a moment before trying again.');
					} else {
						showError('Signup Failed', `Unable to create account: ${error.message}`);
					}
					return;
				}
				
				// Check if signup was successful but user already exists
				// For existing users, Supabase might return the user but with different properties
				if (data.user) {
					// Check if this is a new user or existing user
					// If user already exists, Supabase might not send a confirmation email
					// We can detect this by checking if the user was created recently
					const userCreatedAt = new Date(data.user.created_at);
					const now = new Date();
					const timeDiff = now.getTime() - userCreatedAt.getTime();
					const isRecentSignup = timeDiff < 5000; // Less than 5 seconds ago
					
					if (!isRecentSignup) {
						// User already exists (created more than 5 seconds ago)
						showError('Account Already Exists', 'An account with this email address already exists. Please sign in instead or use a different email address.');
						setMode('signin');
						return;
					}
					
					// Check if email confirmation is required
					if (!data.user.email_confirmed_at) {
						showSuccess('Account Created!', 'Please check your email and click the confirmation link to activate your account. Check your spam folder if you don\'t see it.');
						// Profile will be created after email confirmation
					} else {
						// User is already confirmed (shouldn't happen for new signups)
						showSuccess('Account Created!', 'Your account has been created successfully!');
						await ensureProfile(data.user.id);
						router.push('/coach');
					}
				} else {
					// No user returned (shouldn't happen with successful signup)
					showError('Signup Failed', 'Unable to create account. Please try again.');
				}
				return;
			}
			
			if (mode === 'reset-request') {
				if (!email) { showError('Email Required', 'Enter your email'); return; }
				const redirectTo = typeof window !== 'undefined' ? `${location.origin}/reset-password` : undefined;
				const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
				if (error) { showError('Reset Failed', error.message); return; }
				showSuccess('Reset Link Sent', 'Check your email for a reset link');
				return;
			}
			
			// Sign in with password
			const { data, error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) {
				const msg = error.message.toLowerCase();
				
				if (msg.includes('invalid') || msg.includes('wrong') || msg.includes('credentials')) {
					showError('Invalid Credentials', 'Invalid email or password. Please check your credentials and try again.');
				} else if (msg.includes('email not confirmed') || msg.includes('confirm')) {
					showError('Email Not Confirmed', 'Please check your email and click the confirmation link before signing in.');
				} else if (msg.includes('user not found') || msg.includes('does not exist')) {
					showError('Account Not Found', 'No account found with this email address. Please sign up first.');
					setMode('signup');
				} else if (msg.includes('rate limit') || msg.includes('too many')) {
					showError('Too Many Attempts', 'Please wait a moment before trying again.');
				} else {
					showError('Sign In Failed', `Unable to sign in: ${error.message}`);
				}
				return;
			}
			if (data.user) {
				await ensureProfile(data.user.id);
				router.push('/coach?welcome=true');
			}
		} finally {
			setLoading(false);
		}
	}

	// Check for auth changes
	useEffect(() => {
		const supabase = getSupabaseClient();
		const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
			if (event === 'SIGNED_IN' && session?.user) {
				await ensureProfile(session.user.id);
				router.push('/coach?welcome=true');
			}
		});

		return () => subscription.unsubscribe();
	}, [router]);

	if (success && mode === 'magic-link') {
		return (
			<AuthCard title="Check your email">
				<div className="text-center space-y-4">
					<div className="text-6xl">📧</div>
					<div>
						<p className="text-sm opacity-80 mb-4">
							We&apos;ve sent a magic link to <strong>{email}</strong>
						</p>
						<p className="text-xs opacity-70 mb-6">
							Click the link in your email to sign in. The link will expire in 60 minutes.
						</p>
					</div>
					<div className="space-y-3">
						<button
							onClick={handleResend}
							disabled={resendCountdown > 0}
							className="w-full btn btn-secondary disabled:opacity-50"
						>
							{resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend magic link'}
						</button>
						<button
							onClick={() => { setSuccess(false); setMode('signin'); }}
							className="w-full text-sm opacity-70 hover:opacity-100"
						>
							Back to sign in
						</button>
					</div>
				</div>
			</AuthCard>
		);
	}

	const getTitle = () => {
		switch (mode) {
			case 'signup': return 'Create your account';
			case 'reset-request': return 'Reset password';
			case 'magic-link': return 'Sign in with magic link';
			default: return 'Sign in';
		}
	};

	const getButtonText = () => {
		if (loading) {
			switch (mode) {
				case 'magic-link': return 'Sending magic link...';
				case 'reset-request': return 'Sending reset link...';
				default: return 'Please wait...';
			}
		}
		switch (mode) {
			case 'signup': return 'Create account';
			case 'reset-request': return 'Send reset link';
			case 'magic-link': return 'Send magic link';
			default: return 'Sign in';
		}
	};

	return (
		<>
			<AuthCard title={getTitle()}>
				<div className="flex items-center gap-2 text-xs mb-4 overflow-x-auto">
					<button type="button" className={`px-2 py-1 rounded whitespace-nowrap ${mode==='signin'?'bg-black text-white':'hover:bg-gray-100'}`} onClick={() => setMode('signin')}>Sign in</button>
					<button type="button" className={`px-2 py-1 rounded whitespace-nowrap ${mode==='signup'?'bg-black text-white':'hover:bg-gray-100'}`} onClick={() => setMode('signup')}>Sign up</button>
					<button type="button" className={`px-2 py-1 rounded whitespace-nowrap ${mode==='reset-request'?'bg-black text-white':'hover:bg-gray-100'}`} onClick={() => setMode('reset-request')}>Forgot password</button>
				</div>
				
				<form onSubmit={onSubmit} className="space-y-4">
					<div>
						<input
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
							className="w-full rounded-md border px-3 py-3 bg-white dark:bg-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							disabled={loading}
						/>
					</div>
					
					{mode !== 'reset-request' && mode !== 'magic-link' && (
						<div>
							<input
								type="password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Password"
								className="w-full rounded-md border px-3 py-3 bg-white dark:bg-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								disabled={loading}
							/>
						</div>
					)}
					
					{mode === 'signup' && (
						<div>
							<input
								type="password"
								required
								value={confirm}
								onChange={(e) => setConfirm(e.target.value)}
								placeholder="Confirm password"
								className="w-full rounded-md border px-3 py-3 bg-white dark:bg-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								disabled={loading}
							/>
						</div>
					)}
					
					<LoadingButton
						type="submit"
						loading={loading}
						loadingText={getButtonText()}
						className="w-full btn btn-primary py-3"
					>
						{getButtonText()}
					</LoadingButton>
				</form>
				
				{mode === 'signin' && (
					<div className="text-center space-y-3">
						<div className="flex items-center gap-3">
							<hr className="flex-1" />
							<span className="text-xs opacity-50">OR</span>
							<hr className="flex-1" />
						</div>
						<button
							type="button"
							onClick={() => setMode('magic-link')}
							className="w-full btn btn-secondary py-2 text-sm"
						>
							Sign in with magic link
						</button>
					</div>
				)}
				
				{mode === 'magic-link' && (
					<div className="text-center">
						<button
							type="button"
							onClick={() => setMode('signin')}
							className="text-sm opacity-70 hover:opacity-100 underline"
						>
							Back to password sign in
						</button>
					</div>
				)}
			</AuthCard>

		</>
	);
} 