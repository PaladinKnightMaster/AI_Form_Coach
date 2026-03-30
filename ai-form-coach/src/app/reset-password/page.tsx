"use client";
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setStatus('');
  }, [password, confirm]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (password.length < 6) {
        setStatus('Password must be at least 6 characters');
        return;
      }
      if (password !== confirm) {
        setStatus('Passwords do not match');
        return;
      }
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setStatus(`Error: ${error.message}`);
        return;
      }
      setStatus('Password updated. Redirecting...');
      setTimeout(() => router.push('/signin'), 1200);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Set a new password</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500"
        />
        <button disabled={loading} className="w-full rounded-md bg-slate-900 text-white py-2 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition-colors disabled:opacity-50">
          {loading ? 'Please wait...' : 'Update password'}
        </button>
        {status && <p className="text-sm text-slate-600 dark:text-slate-300">{status}</p>}
      </form>
    </div>
  );
}
