import Link from 'next/link';
import AuthCard from '@/components/AuthCard';
import { normalizeAuthNext } from '@/lib/auth/utils';

interface AuthCodeErrorPageProps {
  searchParams?: Promise<{
    message?: string;
    next?: string;
    reason?: string;
  }>;
}

function getReasonCopy(reason: string | undefined) {
  switch (reason) {
    case 'missing_code':
      return {
        title: 'Missing sign-in code',
        body: 'The confirmation link was incomplete or already consumed. Start again from the sign-in screen and request a fresh email.',
      };
    case 'exchange_failed':
      return {
        title: 'We could not complete your sign in',
        body: 'The confirmation link could not be exchanged for a session. Request a fresh sign-in link and try again.',
      };
    default:
      return {
        title: 'Sign in was interrupted',
        body: 'We could not finish the authentication step. Return to sign in and try again.',
      };
  }
}

export default async function AuthCodeErrorPage({ searchParams }: AuthCodeErrorPageProps) {
  const params = (await searchParams) ?? {};
  const next = normalizeAuthNext(params.next);
  const copy = getReasonCopy(params.reason);
  const signinHref = `/signin?redirect=${encodeURIComponent(next)}`;

  return (
    <AuthCard title={copy.title}>
      <div className="space-y-5 text-sm opacity-90">
        <p>{copy.body}</p>
        {params.message ? <p className="rounded-lg border border-amber-300/40 bg-amber-100/40 px-3 py-2 text-xs">Details: {params.message}</p> : null}
        <div className="space-y-3">
          <Link href={signinHref} className="w-full btn btn-primary text-center">
            Try sign in again
          </Link>
          <Link href={`${signinHref}&mode=magic-link`} className="w-full btn btn-secondary text-center">
            Send a fresh magic link
          </Link>
          <Link href="/" className="block text-center text-sm opacity-70 hover:opacity-100 underline">
            Return to home
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}
