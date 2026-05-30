"use client";

import { useState } from "react";

// TEMP (war-room #3 verification). Removed in the teardown task.
export default function SentryCheckButtons() {
  const [serverStatus, setServerStatus] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 420 }}>
      <button
        type="button"
        onClick={() => {
          // Uncaught in an event handler -> captured by Sentry's global handler.
          throw new Error("[sentry-check] Intentional client-side error for Sentry verification");
        }}
        style={{ padding: "0.625rem 1rem", borderRadius: 8, border: "1px solid #334155", cursor: "pointer" }}
      >
        Throw client error
      </button>
      <button
        type="button"
        onClick={async () => {
          setServerStatus("calling /api/sentry-check…");
          const res = await fetch("/api/sentry-check");
          setServerStatus(`server responded: ${res.status}`);
        }}
        style={{ padding: "0.625rem 1rem", borderRadius: 8, border: "1px solid #334155", cursor: "pointer" }}
      >
        Trigger server error
      </button>
      <p style={{ fontSize: "0.875rem", color: "#64748b" }}>{serverStatus}</p>
    </div>
  );
}
