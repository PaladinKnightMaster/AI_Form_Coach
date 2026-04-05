"use client";

import { useState } from "react";
import { Button, Icon } from "@/ui/DS";

interface DeleteAccountModalProps {
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteAccountModal({ onConfirm, onCancel }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmText === "DELETE";

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete account.");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6">
        {/* Close button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          aria-label="Close"
        >
          <Icon name="x" className="w-5 h-5" />
        </button>

        {/* Warning icon */}
        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <Icon name="alert-triangle" className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>

        <h2 id="delete-account-title" className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
          Delete your account?
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-300 text-center mb-4 leading-relaxed">
          This action is <strong>permanent and cannot be undone</strong>. All your data will be deleted immediately:
        </p>

        <ul className="text-sm text-slate-600 dark:text-slate-300 mb-6 space-y-1.5 pl-4">
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">&#x2022;</span>
            Coaching session history and rep data
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">&#x2022;</span>
            Profile and account settings
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">&#x2022;</span>
            Any future subscription or billing data
          </li>
        </ul>

        {/* Confirmation input */}
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Type <span className="font-mono font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
          autoComplete="off"
          disabled={deleting}
        />

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="md"
            className="flex-1"
            onClick={handleDelete}
            disabled={!isConfirmed || deleting}
            loading={deleting}
          >
            Delete account
          </Button>
        </div>
      </div>
    </div>
  );
}
