import { describe, expect, it } from 'vitest';
import {
  DEFAULT_AUTH_NEXT,
  getAuthCallbackUrl,
  hasImmediateSessionAccess,
  isExistingSignupUser,
  normalizeAuthNext,
} from '@/lib/auth/utils';

describe('auth utilities', () => {
  it('normalizes unsafe redirect targets back to the coach default', () => {
    expect(normalizeAuthNext(null)).toBe(DEFAULT_AUTH_NEXT);
    expect(normalizeAuthNext('https://example.com')).toBe(DEFAULT_AUTH_NEXT);
    expect(normalizeAuthNext('/history')).toBe('/history');
  });

  it('builds callback urls that preserve a safe next target', () => {
    expect(getAuthCallbackUrl('https://app.example.com')).toBe('https://app.example.com/auth/callback');
    expect(getAuthCallbackUrl('https://app.example.com', '/history')).toBe(
      'https://app.example.com/auth/callback?next=%2Fhistory'
    );
  });

  it('detects duplicate signup responses without relying on timestamps', () => {
    expect(isExistingSignupUser({ identities: [] })).toBe(true);
    expect(isExistingSignupUser({ identities: [{ id: 'identity-1' }] })).toBe(false);
    expect(isExistingSignupUser(null)).toBe(false);
  });

  it('detects immediate session access for confirmed users', () => {
    expect(hasImmediateSessionAccess({ email_confirmed_at: '2026-03-20T00:00:00.000Z' })).toBe(true);
    expect(hasImmediateSessionAccess({ email_confirmed_at: null })).toBe(false);
    expect(hasImmediateSessionAccess(undefined)).toBe(false);
  });
});
