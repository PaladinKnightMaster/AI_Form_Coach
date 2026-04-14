"use client";

import { useEffect } from "react";
import Link from "next/link";
import { initSentry, Sentry } from "@/lib/observability/sentry";
import { Button, Card, Icon } from "@/ui/DS";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    initSentry();
    Sentry.captureException(error);
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center" padding="lg">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <Icon name="alert-triangle" className="w-6 h-6 text-red-600" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h2>

        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          This page encountered an error. Your coaching data is safe — this is a display issue, not a data issue.
        </p>

        <div className="flex gap-3 justify-center">
          <Button variant="primary" size="md" onClick={reset}>
            Try again
          </Button>
          <Button variant="secondary" size="md" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-gray-400 mt-4">
            Error ID: {error.digest}
          </p>
        )}
      </Card>
    </div>
  );
}
