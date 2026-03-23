export interface PublicHistorySession {
  id: string;
  started_at: string;
  is_demo?: boolean | null;
}

export function getPublicHistorySessions<T extends PublicHistorySession>(sessions: T[]): T[] {
  return [...sessions]
    .filter((session) => !session.is_demo)
    .sort((left, right) => new Date(right.started_at).getTime() - new Date(left.started_at).getTime());
}
