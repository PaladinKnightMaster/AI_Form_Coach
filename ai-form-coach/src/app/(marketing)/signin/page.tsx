"use client";
import { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthCard from '@/components/AuthCard';
import { useToastContext } from '@/components/ToastProvider';
import LoadingButton from '@/components/LoadingButton';
import {
  DEFAULT_AUTH_NEXT,
  getAuthCallbackUrl,
  getSiteURL,
  hasImmediateSessionAccess,
  isExistingSignupUser,
  normalizeAuthNext,
} from '@/lib/auth/utils';
import { recordConsent } from '@/lib/legal/consent';
import { signupConsentLabel } from '@/lib/legal/legalContent';

type AuthMode = 'signin' | 'signup' | 'reset-request' | 'magic-link';

function SignInContent() {
  const { success: showSuccess, error: showError } = useToastContext();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode');
  const redirectTarget = normalizeAuthNext(searchParams.get('redirect'));
  const [mode, setMode] = useState<AuthMode>(
    initialMode === 'signup' || initialMode === 'reset-request' || initialMode === 'magic-link'
      ? initialMode
      : 'signin'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
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
    if (mode !== 'signup') {
      setConfirm('');
    }
    if (mode !== 'magic-link') {
      setSuccess(false);
      setResendCountdown(0);
    }
    setAgreed(false);
  }, [mode]);

  const ensureProfile = useCallback(async (userId: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', userId).single();

      if (existingProfile) {
        return;
      }

      const { error } = await supabase.from('profiles').insert({ id: userId });

      if (error) {
        console.error('Profile creation error:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          userId,
        });
      }
    } catch (err) {
      console.error('Unexpected profile error:', {
        error: err,
        userId,
      });
    }
  }, []);

  const finishAuth = useCallback(() => {
    router.replace(redirectTarget || DEFAULT_AUTH_NEXT);
  }, [redirectTarget, router]);

  function getCallbackUrl() {
    return getAuthCallbackUrl(undefined, redirectTarget);
  }

  async function sendMagicLink() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      showError('Email Required', 'Please enter your email address');
      return;
    }

    setLoading(true);
    const supabase = getSupabaseClient();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: getCallbackUrl(),
        },
      });

      if (error) {
        showError('Magic Link Failed', error.message);
        return;
      }

      setEmail(normalizedEmail);
      setSuccess(true);
      setResendCountdown(60);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCountdown > 0) {
      return;
    }

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
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail || !password) {
          showError('Validation Error', 'Enter email and password');
          return;
        }
        if (password.length < 6) {
          showError('Password Too Short', 'Password must be at least 6 characters');
          return;
        }
        if (password !== confirm) {
          showError('Password Mismatch', 'Passwords do not match');
          return;
        }

        if (!agreed) {
          showError('Please agree to continue', 'You must confirm you are 18+ and accept the Terms, Privacy Policy, and Medical Disclaimer to create an account.');
          return;
        }

        const {
          data: { user: existingUser },
        } = await supabase.auth.getUser();
        if (existingUser?.email?.toLowerCase() === normalizedEmail) {
          showError('Account Already Exists', 'You are already signed in with this email address.');
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: getCallbackUrl(),
          },
        });

        if (error) {
          const msg = error.message.toLowerCase();
          const errorCode = error.code || '';

          if (
            error.status === 422 ||
            errorCode === 'user_already_registered' ||
            msg.includes('registered') ||
            msg.includes('already') ||
            msg.includes('exists') ||
            msg.includes('duplicate') ||
            msg.includes('taken')
          ) {
            showError(
              'Account Already Exists',
              'An account with this email address already exists. Please sign in instead or reset your password.'
            );
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

        if (!data.user) {
          showError('Signup Failed', 'Unable to create account. Please try again.');
          return;
        }

        if (isExistingSignupUser(data.user)) {
          showError(
            'Account Already Exists',
            'An account with this email address already exists. Please sign in instead or reset your password.'
          );
          setMode('signin');
          return;
        }

        if (data.session || hasImmediateSessionAccess(data.user)) {
          showSuccess('Account Created!', 'Your account has been created successfully.');
          await ensureProfile(data.user.id);
          await recordConsent(supabase, data.user.id, 'signup');
          finishAuth();
          return;
        }

        showSuccess(
          'Account Created!',
          'Please check your email and click the confirmation link to activate your account. Check your spam folder if you do not see it.'
        );
        setEmail(normalizedEmail);
        setPassword('');
        setConfirm('');
        return;
      }

      if (mode === 'reset-request') {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
          showError('Email Required', 'Enter your email');
          return;
        }
        const redirectTo = `${getSiteURL()}reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
        if (error) {
          showError('Reset Failed', error.message);
          return;
        }
        showSuccess('Reset Link Sent', 'Check your email for a reset link');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
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
        finishAuth();
      }
    } finally {
      setLoading(false);
    }
  }

  // Listen for auth state changes from OAuth/magic-link callbacks only.
  // Email/password sign-in calls finishAuth() directly in onSubmit —
  // this listener handles async flows where the redirect comes later.
  useEffect(() => {
    const supabase = getSupabaseClient();
    let didRedirect = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (didRedirect) return;
      if (event === 'SIGNED_IN' && session?.user) {
        didRedirect = true;
        await ensureProfile(session.user.id);
        finishAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [ensureProfile, finishAuth]);

  if (success && mode === 'magic-link') {
    return (
      <AuthCard title="Check your email">
        <div className="text-center space-y-4">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">Email link</div>
          <div>
            <p className="text-sm text-slate-300 mb-4">
              We&apos;ve sent a magic link to <strong className="text-white">{email}</strong>
            </p>
            <p className="text-xs text-slate-500 mb-6">
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
              onClick={() => {
                setSuccess(false);
                setMode('signin');
              }}
              className="w-full text-sm font-medium text-slate-400 hover:text-white transition-colors"
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
      case 'signup':
        return 'Create your account';
      case 'reset-request':
        return 'Reset password';
      case 'magic-link':
        return 'Sign in with magic link';
      default:
        return 'Sign in';
    }
  };

  const getButtonText = () => {
    if (loading) {
      switch (mode) {
        case 'magic-link':
          return 'Sending magic link...';
        case 'reset-request':
          return 'Sending reset link...';
        default:
          return 'Please wait...';
      }
    }
    switch (mode) {
      case 'signup':
        return 'Create account';
      case 'reset-request':
        return 'Send reset link';
      case 'magic-link':
        return 'Send magic link';
      default:
        return 'Sign in';
    }
  };

  return (
    <AuthCard title={getTitle()}>
      <div className="flex w-full items-center rounded-xl bg-slate-950/50 p-1 mb-6 border border-slate-800">
        <button
          type="button"
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${mode === 'signin' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          onClick={() => setMode('signin')}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${mode === 'signup' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          onClick={() => setMode('signup')}
        >
          Sign up
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${mode === 'reset-request' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          onClick={() => setMode('reset-request')}
        >
          Reset
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="auth-email" className="sr-only">Email</label>
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
            disabled={loading}
          />
        </div>

        {mode !== 'reset-request' && mode !== 'magic-link' && (
          <div>
            <label htmlFor="auth-password" className="sr-only">Password</label>
            <input
              id="auth-password"
              type="password"
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              disabled={loading}
            />
          </div>
        )}

        {mode === 'signup' && (
          <div>
            <label htmlFor="auth-confirm" className="sr-only">Confirm password</label>
            <input
              id="auth-confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              disabled={loading}
            />
          </div>
        )}

        {mode === 'signup' && (
          <div className="space-y-1">
            <label htmlFor="auth-agree" className="flex items-start gap-2 text-xs leading-5 text-slate-300">
              <input
                id="auth-agree"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={loading}
                aria-required="true"
                className="mt-0.5 shrink-0"
              />
              <span>{signupConsentLabel}</span>
            </label>
            <p className="pl-6 text-[11px] text-slate-400">
              Read:{" "}
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="underline">Terms</Link>
              {" · "}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</Link>
              {" · "}
              <Link href="/medical-disclaimer" target="_blank" rel="noopener noreferrer" className="underline">Medical Disclaimer</Link>
            </p>
            {!agreed && (
              <p className="pl-6 text-[11px] text-slate-500">Required to create your account.</p>
            )}
          </div>
        )}

        <LoadingButton
          type="submit"
          loading={loading}
          loadingText={getButtonText()}
          disabled={mode === 'signup' && !agreed}
          className="w-full py-3"
        >
          {getButtonText()}
        </LoadingButton>
      </form>

      {mode === 'signin' && (
        <div className="text-center space-y-3">
          <div className="flex items-center gap-3">
            <hr className="flex-1 border-slate-800" />
            <span className="text-xs text-slate-500">OR</span>
            <hr className="flex-1 border-slate-800" />
          </div>
          <button type="button" onClick={() => setMode('magic-link')} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700">
            Sign in with magic link
          </button>
        </div>
      )}

      {mode === 'magic-link' && (
        <div className="text-center">
          <button type="button" onClick={() => setMode('signin')} className="text-sm text-slate-400 hover:text-white transition-colors underline decoration-slate-600 hover:decoration-white">
            Back to password sign in
          </button>
        </div>
      )}
    </AuthCard>
  );
}

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Sign in">
          <div className="p-8 text-center opacity-50">Loading...</div>
        </AuthCard>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
