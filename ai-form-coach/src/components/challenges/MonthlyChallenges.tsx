"use client";

import { useState, useEffect } from 'react';
import { Container, Button, Icon, Badge } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';
import FeatureGate from '@/components/FeatureGate';
import LoadingOverlay from '@/components/LoadingOverlay';
import type { MonthlyChallenge, ChallengeParticipation } from '@/lib/subscription/types';

export default function MonthlyChallenges() {
  const { success: showSuccess, error: showError, info: showInfo } = useToastContext();
  const [challenge, setChallenge] = useState<MonthlyChallenge | null>(null);
  const [participation, setParticipation] = useState<ChallengeParticipation | null>(null);
  const [leaderboard, setLeaderboard] = useState<ChallengeParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchChallengeData();
  }, []);

  const fetchChallengeData = async () => {
    try {
      setLoading(true);
      
      const [challengeRes, participationRes, leaderboardRes] = await Promise.all([
        fetch('/api/challenges/active', { credentials: 'include' }),
        fetch('/api/challenges/participation', { credentials: 'include' }),
        fetch('/api/challenges/leaderboard', { credentials: 'include' })
      ]);

      if (challengeRes.ok) {
        const challengeData = await challengeRes.json();
        setChallenge(challengeData.challenge);
      }

      if (participationRes.ok) {
        const participationData = await participationRes.json();
        setParticipation(participationData.participation);
      }

      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json();
        setLeaderboard(leaderboardData.leaderboard || []);
      }
    } catch (error) {
      console.error('Error fetching challenge data:', error);
      showError('Load Failed', 'Failed to load challenge data');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async () => {
    if (!challenge) return;

    try {
      setJoining(true);
      
      const response = await fetch('/api/challenges/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ challengeId: challenge.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to join challenge');
      }

      const data = await response.json();
      setParticipation(data.participation);
      showSuccess('Challenge Joined!', 'You\'re now participating in the monthly challenge');
      fetchChallengeData(); // Refresh data
    } catch (error) {
      console.error('Error joining challenge:', error);
      showError('Join Failed', 'Failed to join challenge');
    } finally {
      setJoining(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'reps': return 'target';
      case 'time': return 'clock';
      case 'consistency': return 'calendar';
      case 'improvement': return 'trending-up';
      default: return 'trophy';
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading challenges..." />;
  }

  return (
    <Container className="py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Monthly Challenges
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Compete with the community and push your limits
          </p>
        </div>

        {/* Pro Access Gate */}
        <FeatureGate 
          feature="monthly_challenges"
          fallback={
            <div className="text-center py-12">
              <Icon name="lock" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Pro Feature
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Monthly challenges are available with a Pro subscription
              </p>
              <Button variant="primary" asChild>
                <a href="/pricing">Upgrade to Pro</a>
              </Button>
            </div>
          }
        >
          {challenge ? (
            <div className="space-y-8">
              {/* Current Challenge */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {challenge.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {challenge.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name={getChallengeIcon(challenge.challenge_type) as any} className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      {challenge.challenge_type}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {challenge.target_value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Target {challenge.target_unit}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {challenge.participant_count}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Participants
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {formatDate(challenge.end_date)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Ends
                    </div>
                  </div>
                </div>

                {participation ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Your Progress
                      </h3>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {Math.round(participation.completion_percentage)}%
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(participation.completion_percentage)}`}
                        style={{ width: `${Math.min(participation.completion_percentage, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>{participation.progress_value} / {challenge.target_value} {challenge.target_unit}</span>
                      {participation.is_completed && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          <Icon name="check" className="w-3 h-3 mr-1" />
                          Completed!
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Button
                      onClick={handleJoinChallenge}
                      disabled={joining}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3"
                    >
                      {joining ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Joining...
                        </div>
                      ) : (
                        <>
                          <Icon name="plus" className="w-4 h-4 mr-2" />
                          Join Challenge
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Leaderboard */}
              {leaderboard.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    Leaderboard
                  </h3>
                  
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          index < 3 
                            ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800' 
                            : 'bg-gray-50 dark:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-500 text-white' :
                            'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {entry.profiles?.display_name || 'Anonymous'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {entry.progress_value} {challenge.target_unit}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {Math.round(entry.completion_percentage)}%
                          </div>
                          {entry.is_completed && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs">
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon name="calendar" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Active Challenge
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Check back soon for the next monthly challenge
              </p>
            </div>
          )}
        </FeatureGate>
      </div>
    </Container>
  );
}
