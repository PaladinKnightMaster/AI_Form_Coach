import { NextResponse } from "next/server";
import { createDisabledApiPathResponse, isMvpDisabledApiPath } from "@/lib/mvp/apiAvailability";

function handle(request: Request) {
  const pathname = new URL(request.url).pathname;

  if (isMvpDisabledApiPath(pathname)) {
    return createDisabledApiPathResponse(pathname);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;