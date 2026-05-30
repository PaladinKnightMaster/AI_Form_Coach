import SentryCheckButtons from "./SentryCheckButtons";

// TEMP (war-room #3 verification). Removed in the teardown task.
export const dynamic = "force-dynamic";

export default function SentryCheckPage() {
  if (process.env.VERCEL_ENV === "production") {
    return <main style={{ padding: "2rem" }}>Not available.</main>;
  }
  return (
    <main style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Sentry verification</h1>
      <p style={{ fontSize: "0.875rem", color: "#64748b", maxWidth: 480 }}>
        Temporary page for war-room #3. Click each button on a preview deploy, then confirm
        the two issues appear in Sentry with readable stack traces.
      </p>
      <SentryCheckButtons />
    </main>
  );
}
