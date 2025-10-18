/**
 * Verification Service
 * 
 * Client-side service for interacting with verification system
 */

import type {
  VerificationRequest,
  VerificationResponse,
  SessionVerificationSummary,
  VerificationStats
} from '@/types/verification';

export class VerificationService {
  /**
   * Check verification status for a session
   */
  static async checkSession(
    sessionId: string,
    forceRecheck: boolean = false
  ): Promise<VerificationResponse> {
    const response = await fetch('/api/verification/check-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        session_id: sessionId,
        force_recheck: forceRecheck
      } as VerificationRequest)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check session verification');
    }

    return response.json();
  }

  /**
   * Get verification summary for a session
   */
  static async getSessionSummary(
    sessionId: string
  ): Promise<SessionVerificationSummary> {
    const response = await fetch(
      `/api/verification/session-summary?session_id=${sessionId}`,
      {
        credentials: 'include'
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch session summary');
    }

    return response.json();
  }

  /**
   * Get overall verification statistics
   */
  static async getStats(): Promise<VerificationStats> {
    const response = await fetch('/api/verification/stats', {
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch verification stats');
    }

    return response.json();
  }

  /**
   * Trigger verification check after session completion
   * (Usually called automatically by the database trigger,
   *  but this allows manual triggering from client)
   */
  static async triggerVerification(sessionId: string): Promise<void> {
    await this.checkSession(sessionId, false);
  }

  /**
   * Re-run verification checks (for flagged sessions)
   */
  static async recheckSession(sessionId: string): Promise<VerificationResponse> {
    return this.checkSession(sessionId, true);
  }
}

/**
 * React Hook for verification
 */
export function useSessionVerification(sessionId: string | null) {
  const [summary, setSummary] = React.useState<SessionVerificationSummary | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchSummary = React.useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await VerificationService.getSessionSummary(sessionId);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  React.useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const recheck = React.useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);
      await VerificationService.recheckSession(sessionId);
      await fetchSummary(); // Refresh after recheck
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [sessionId, fetchSummary]);

  return {
    summary,
    loading,
    error,
    recheck,
    refresh: fetchSummary
  };
}

// Import React for the hook
import React from 'react';

