import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getMvpDisabledRedirect, isMvpAuthOnlyPath, isMvpDisabledPage } from "./src/lib/mvp/featureRegistry";
import { isLoopbackHost } from "./src/lib/mvp/e2eAccess";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoopbackAutomationBypass =
    request.nextUrl.searchParams.get("e2e-access") === "1" && isLoopbackHost(request.nextUrl.hostname);

  if (isMvpDisabledPage(pathname)) {
    const redirectUrl = new URL(getMvpDisabledRedirect(pathname, Boolean(user)), request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && isMvpAuthOnlyPath(pathname) && !isLoopbackAutomationBypass) {
    const redirectUrl = new URL("/signin", request.url);
    const intendedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    redirectUrl.searchParams.set("redirect", intendedPath);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
