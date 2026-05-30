import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// TEMP (war-room #3 verification). Removed in the teardown task once the
// preview-deploy verification has confirmed errors reach Sentry.
export function GET() {
  if (process.env.VERCEL_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }
  throw new Error("[sentry-check] Intentional server-side error for Sentry verification");
}
