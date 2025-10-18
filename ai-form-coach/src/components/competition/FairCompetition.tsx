"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button, Icon, Badge } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';
import type { LeaderboardEntry, ChallengeProgress } from '@/types/activity';

interface FairCompetitionProps {
  className?: string;
  exercise?: 'squat' | 'pushup' | 'plank';
  period?: 'daily' | 'weekly' | 'monthly';
}

export default function FairCompetition({ 
  className = '', 
  exercise = 'squat',
  period = 'weekly' 
}: FairCompetitionProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [challenges, setChallenges] = useState<ChallengeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'challenges'>('leaderboard');
  const { success: showSuccess, error: showError } = useToastContext();

  const fetchCompetitionData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch leaderboard data
      const leaderboardResponse = await fetch(
        `/api/competition/leaderboard?exercise=${exercise}&period=${period}`,
        { credentials: 'include' }
      );
      
      if (leaderboardResponse.ok) {
        const leaderboardData = await leaderboardResponse.json();
        setLeaderboard(leaderboardData.entries || []);
      }

      // Fetch active challenges
      const challengesResponse = await fetch('/api/challenges/active', {
        credentials: 'include'
      });
      
      if (challengesResponse.ok) {
        const challengesData = await challengesResponse.json();
        setChallenges(challengesData.challenges || []);
      }
    } catch (error) {
      console.error('Error fetching competition data:', error);
      showError('Failed to load competition data', 'Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [exercise, period, showError]);

  useEffect(() => {
    fetchCompetitionData();
  }, [exercise, period, fetchCompetitionData]);

  const joinChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/join`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        showSuccess('Challenge joined!', 'You\'re now competing in this challenge.');
        fetchCompetitionData(); // Refresh data
      } else {
        showError('Failed to join challenge', 'Please try again.');
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      showError('Failed to join challenge', 'Please try again.');
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600 dark:text-yellow-400';
      case 2: return 'text-gray-500 dark:text-gray-400';
      case 3: return 'text-amber-600 dark:text-amber-400';
      default: return 'text-gray-700 dark:text-gray-300';
    }
  };

  const formatScore = (score: number, metric: string) => {
    switch (metric) {
      case 'reps': return `${score} reps`;
      case 'duration': return `${Math.floor(score / 60)}:${(score % 60).toString().padStart(2, '0')}`;
      case 'calories': return `${score} cal`;
      case 'form_score': return `${Math.round(score * 100)}%`;
      default: return score.toString();
    }
  };

  const getProgressPercentage = (progress: number, target: number) => {
    return Math.min((progress / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fair Competition
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Compete fairly with users of similar fitness levels
          </p>
        </div>
        <Button variant="secondary" onClick={fetchCompetitionData}>
          <Icon name="refresh" className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'leaderboard'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Icon name="trophy" className="w-4 h-4 mr-2 inline" />
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'challenges'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Icon name="target" className="w-4 h-4 mr-2 inline" />
          Challenges
        </button>
      </div>

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {exercise.charAt(0).toUpperCase() + exercise.slice(1)} Leaderboard
              </h3>
              <Badge tone="info" size="sm">
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="p-4">
            {leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="trophy" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No data yet
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Complete a workout to appear on the leaderboard
                </p>
                <Button asChild>
                  <a href="/coach">Start Workout</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center space-x-4 p-3 rounded-lg ${
                      entry.isCurrentUser
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        entry.rank <= 3
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}>
                        {getRankIcon(entry.rank)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${
                          entry.isCurrentUser
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {entry.userName}
                        </span>
                        {entry.isCurrentUser && (
                          <Badge tone="info" size="sm">You</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatScore(entry.score, entry.metric)}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <span className={`text-lg font-bold ${getRankColor(entry.rank)}`}>
                        {entry.rank}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          {challenges.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="target" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No active challenges
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Check back later for new challenges
              </p>
            </div>
          ) : (
            challenges.map((challenge) => (
              <div
                key={challenge.challengeId}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {challenge.challengeName}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center">
                        <Icon name="user" className="w-4 h-4 mr-1" />
                        {challenge.participants} participants
                      </span>
                      <span className="flex items-center">
                        <Icon name="calendar" className="w-4 h-4 mr-1" />
                        {new Date(challenge.endDate).toLocaleDateString()}
                      </span>
                      {challenge.userRank && (
                        <span className="flex items-center">
                          <Icon name="trophy" className="w-4 h-4 mr-1" />
                          Rank #{challenge.userRank}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge tone={challenge.isActive ? 'success' : 'neutral'} size="sm">
                    {challenge.isActive ? 'Active' : 'Ended'}
                  </Badge>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{challenge.progress} / {challenge.target} {challenge.unit}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(challenge.progress, challenge.target)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {challenge.isActive ? (
                      <span>
                        {Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                      </span>
                    ) : (
                      <span>Challenge ended</span>
                    )}
                  </div>
                  {challenge.isActive && (
                    <Button
                      size="sm"
                      onClick={() => joinChallenge(challenge.challengeId)}
                    >
                      <Icon name="plus" className="w-4 h-4 mr-2" />
                      Join Challenge
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
