"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import { Button, Card, Icon } from "@/ui/DS";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const email = user?.email ?? "—";
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";

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
