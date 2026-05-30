"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#0f172a", color: "#f8fafc" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ maxWidth: "28rem", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              An unexpected error occurred. Your coaching data is safe — this is a display issue, not a data issue.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={reset}
                style={{
                  padding: "0.625rem 1.25rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#fff",
                  background: "linear-gradient(135deg, #059669, #0d9488)",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Global error boundary intentionally uses <a> since the Next.js router may be broken */}
              <a
                href="/"
                style={{
                  padding: "0.625rem 1.25rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#cbd5e1",
                  background: "transparent",
                  border: "1px solid #334155",
                  borderRadius: "0.5rem",
                  textDecoration: "none",
                }}
              >
                Go home
              </a>
            </div>
            {error.digest && (
              <p style={{ fontSize: "0.75rem", color: "#475569", marginTop: "1.5rem" }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
