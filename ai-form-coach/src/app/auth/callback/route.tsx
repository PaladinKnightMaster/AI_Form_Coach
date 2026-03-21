import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { normalizeAuthNext } from '@/lib/auth/utils';

function getRedirectOrigin(request: NextRequest, origin: string) {
  if (process.env.NODE_ENV === 'development') {
    return origin;
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  if (!forwardedHost) {
    return origin;
  }

  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  return `${forwardedProto}://${forwardedHost}`;
}

function buildErrorRedirect(baseOrigin: string, next: string, reason: string, message?: string | null) {
  const errorUrl = new URL('/auth/auth-code-error', baseOrigin);
  errorUrl.searchParams.set('reason', reason);
  errorUrl.searchParams.set('next', next);

  if (message) {
    errorUrl.searchParams.set('message', message.slice(0, 180));
  }

  return errorUrl.toString();
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = normalizeAuthNext(searchParams.get('next'));
  const redirectOrigin = getRedirectOrigin(request, origin);

  if (!code) {
    return NextResponse.redirect(buildErrorRedirect(redirectOrigin, next, 'missing_code'));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(buildErrorRedirect(redirectOrigin, next, 'exchange_failed', error?.message));
  }

  try {
    const { error: profileError } = await supabase.from('profiles').upsert({ id: data.user.id }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile creation error in callback:', profileError);
    }
  } catch (profileErr) {
    console.error('Unexpected profile error in callback:', profileErr);
  }

  return NextResponse.redirect(`${redirectOrigin}${next}`);
}
