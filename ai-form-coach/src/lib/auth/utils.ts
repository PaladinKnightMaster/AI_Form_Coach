export const DEFAULT_AUTH_NEXT = "/coach?welcome=true";

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

export function getAuthCallbackUrl(origin: string, next?: string | null) {
  const url = new URL("/auth/callback", origin);
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
