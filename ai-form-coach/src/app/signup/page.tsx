import { redirect } from 'next/navigation';
import { normalizeAuthNext } from '@/lib/auth/utils';

interface SignUpPageProps {
  searchParams?: Promise<{
    redirect?: string;
  }>;
}

export default async function SignUp({ searchParams }: SignUpPageProps) {
  const params = (await searchParams) ?? {};
  const redirectTarget = normalizeAuthNext(params.redirect);

  redirect(`/signin?mode=signup&redirect=${encodeURIComponent(redirectTarget)}`);
}
