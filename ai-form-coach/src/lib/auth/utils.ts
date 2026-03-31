export const DEFAULT_AUTH_NEXT = "/coach?welcome=true";

/**
 * Resolve the canonical site URL using the Supabase-recommended fallback chain.
 *
 * Priority:
 *  1. NEXT_PUBLIC_SITE_URL  — explicitly set per Vercel environment
 *  2. NEXT_PUBLIC_VERCEL_URL — auto-set by Vercel for every deployment
 *  3. localhost fallback     — local development
 *
 * @see https://supabase.com/docs/guides/auth/redirect-urls#vercel-preview-urls
 */
export function getSiteURL(): string {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000/';
  // Ensure https:// when not localhost
  url = url.startsWith('http') ? url : `https://${url}`;
  // Ensure trailing slash
  url = url.endsWith('/') ? url : `${url}/`;
  return url;
}

export interface SignupUserLike {
  identities?: unknown[] | null;
  email_confirmed_at?: string | null;
}

export function normalizeAuthNext(next: string | null | undefined) {
  if (!next || !next.startsWith("/")) {
    return DEFAULT_AUTH_NEXT;
  }

  return next;
}

export function getAuthCallbackUrl(origin?: string, next?: string | null) {
  const url = new URL("/auth/callback", origin || getSiteURL());
  const normalizedNext = normalizeAuthNext(next);

  if (normalizedNext !== DEFAULT_AUTH_NEXT) {
    url.searchParams.set("next", normalizedNext);
  }

  return url.toString();
}

export function buildSigninRedirectUrl(requestUrl: string) {
  const currentUrl = new URL(requestUrl);
  const redirectUrl = new URL('/signin', requestUrl);
  redirectUrl.searchParams.set('redirect', `${currentUrl.pathname}${currentUrl.search}`);
  return redirectUrl.toString();
}

export function isExistingSignupUser(user: SignupUserLike | null | undefined) {
  return Array.isArray(user?.identities) && user.identities.length === 0;
}

export function hasImmediateSessionAccess(user: SignupUserLike | null | undefined) {
  return Boolean(user?.email_confirmed_at);
}
