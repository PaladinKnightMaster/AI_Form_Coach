"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import { Button, Card, Icon } from "@/ui/DS";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const email = user?.email ?? "—";
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (passwordNew.length < 6) {
      setPasswordStatus({ type: "error", message: "Password must be at least 6 characters" });
      return;
    }
    if (passwordNew !== passwordConfirm) {
      setPasswordStatus({ type: "error", message: "Passwords do not match" });
      return;
    }
    setPasswordLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: passwordNew });
      if (error) {
        setPasswordStatus({ type: "error", message: error.message });
        return;
      }
      setPasswordStatus({ type: "success", message: "Password updated successfully" });
      setPasswordNew("");
      setPasswordConfirm("");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const res = await fetch("/api/auth/delete-account", { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(body.error || "Failed to delete account");
    }
    await signOut();
    router.push("/");
  };

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <p className="text-gray-600 dark:text-gray-300 mb-4">You need to be signed in to view settings.</p>
        <Link href="/signin" className="text-sm font-semibold underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="container py-16">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-2">
              <Icon name="chevron-left" className="w-4 h-4" />
              Back
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">Account Settings</h1>
          </div>

          {/* Account Info */}
          <Card padding="default">
            <h2 className="text-lg font-semibold mb-4">Account</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Email</dt>
                <dd className="font-medium">{email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Member since</dt>
                <dd className="font-medium">{createdAt}</dd>
              </div>
            </dl>
          </Card>

          {/* Change Password */}
          <Card padding="default">
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <input
                type="password"
                value={passwordNew}
                onChange={(e) => { setPasswordNew(e.target.value); setPasswordStatus(null); }}
                placeholder="New password (min 6 characters)"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 bg-white text-slate-900 text-sm placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={passwordLoading}
              />
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => { setPasswordConfirm(e.target.value); setPasswordStatus(null); }}
                placeholder="Confirm new password"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 bg-white text-slate-900 text-sm placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={passwordLoading}
              />
              <Button type="submit" variant="primary" size="md" disabled={passwordLoading}>
                {passwordLoading ? "Updating…" : "Update password"}
              </Button>
              {passwordStatus && (
                <p className={`text-sm ${passwordStatus.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {passwordStatus.message}
                </p>
              )}
            </form>
          </Card>

          {/* Danger Zone */}
          <Card padding="default" className="border-red-200 dark:border-red-900/50">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              size="md"
              onClick={() => setShowDeleteModal(true)}
            >
              <Icon name="trash" className="w-4 h-4" />
              Delete account
            </Button>
          </Card>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
