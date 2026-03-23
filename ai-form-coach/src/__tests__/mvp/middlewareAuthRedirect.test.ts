import { describe, expect, it } from 'vitest';
import { buildSigninRedirectUrl } from '@/lib/auth/utils';

describe('auth redirect helper', () => {
  it('preserves the intended auth-only destination on signin redirects', () => {
    expect(buildSigninRedirectUrl('http://127.0.0.1:3100/history')).toBe(
      'http://127.0.0.1:3100/signin?redirect=%2Fhistory'
    );
  });

  it('keeps query params when building the signin redirect target', () => {
    expect(buildSigninRedirectUrl('http://127.0.0.1:3100/session/abc?tab=summary')).toBe(
      'http://127.0.0.1:3100/signin?redirect=%2Fsession%2Fabc%3Ftab%3Dsummary'
    );
  });
});
