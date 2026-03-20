import { NextResponse } from "next/server";

export function GET(request: Request) {
  const url = new URL("/opengraph-image", request.url);
  return NextResponse.redirect(url, 308);
}