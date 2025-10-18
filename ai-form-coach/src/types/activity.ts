export interface ActivityFeedItem {
  id: string;
  userId: string;
  userName: string;
  type: 'workout' | 'achievement' | 'challenge' | 'milestone';
  description: string;
  timestamp: string;
  metrics?: {
    duration?: string;
    reps?: number;
    calories?: number;
    distance?: number;
    pace?: string;
  };
  likes: number;
  liked: boolean;
  comments: number;
  privacy: 'public' | 'friends' | 'private';
}

export interface ActivityStats {
  totalWorkouts: number;
  totalDuration: number; // in minutes
  totalReps: number;
  totalCalories: number;
  streak: number;
  weeklyGoal: number;
  weeklyProgress: number;
  achievements: number;
  challengesCompleted: number;
}

export interface SocialConnection {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  status: 'following' | 'follower' | 'mutual';
  lastActivity?: string;
  totalWorkouts: number;
  streak: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatar?: string;
  score: number;
  metric: string;
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  isCurrentUser: boolean;
}

export interface ChallengeProgress {
  challengeId: string;
  challengeName: string;
  progress: number;
  target: number;
  unit: string;
  startDate: string;
  endDate: string;
  participants: number;
  userRank?: number;
  isActive: boolean;
}
