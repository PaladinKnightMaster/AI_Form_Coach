import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AuthCodeErrorPage from '@/app/(marketing)/auth/auth-code-error/page';
import ResetPassword from '@/app/(marketing)/reset-password/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('auth page truth', () => {
  it('renders callback recovery guidance with retry links', async () => {
    const html = renderToStaticMarkup(
      await AuthCodeErrorPage({
        searchParams: Promise.resolve({ reason: 'exchange_failed', next: '/history', message: 'Code expired' }),
      })
    );

    expect(html).toContain('We could not complete your sign in');
    expect(html).toContain('Request a fresh sign-in link and try again.');
    expect(html).toContain('/signin?redirect=%2Fhistory');
    expect(html).toContain('/signin?redirect=%2Fhistory&amp;mode=magic-link');
    expect(html).toContain('Details: Code expired');
  });

  it('keeps reset password copy free of mojibake', () => {
    const html = renderToStaticMarkup(<ResetPassword />);

    // SSR renders the Suspense fallback (title: "Password reset", body: "Loading…")
    expect(html).toContain('Password reset');
    expect(html).not.toContain('â');
    expect(html).not.toContain('ð');
  });
});
