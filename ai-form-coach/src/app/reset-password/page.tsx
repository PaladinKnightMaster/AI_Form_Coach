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
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 bg-gray-100 dark:bg-gray-900 p-6 rounded-xl border">
        <h1 className="text-2xl font-semibold">Set a new password</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="w-full rounded-md border px-3 py-2 bg-white dark:bg-black"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          className="w-full rounded-md border px-3 py-2 bg-white dark:bg-black"
        />
        <button disabled={loading} className="w-full rounded-md bg-black text-white py-2">
          {loading ? 'Please wait...' : 'Update password'}
        </button>
        <p className="text-sm opacity-80">{status}</p>
      </form>
    </div>
  );
}
