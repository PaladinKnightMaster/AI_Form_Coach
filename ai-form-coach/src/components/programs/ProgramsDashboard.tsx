"use client";

import { useState, useEffect, useCallback } from 'react';
import { Container, Button, Icon, Badge } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';
import LoadingOverlay from '@/components/LoadingOverlay';

interface Program {
  id: string;
  name: string;
  description: string;
  duration_weeks: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  equipment_required: string[];
  target_goals: string[];
  is_template: boolean;
  created_at: string;
  program_weeks?: ProgramWeek[];
}

interface ProgramWeek {
  id: string;
  week_number: number;
  focus: string;
  notes: string;
  program_days: ProgramDay[];
}

interface ProgramDay {
  id: string;
  day_number: number;
  day_name: string;
  is_rest_day: boolean;
  day_blocks: DayBlock[];
}

interface DayBlock {
  id: string;
  block_order: number;
  block_type: 'warmup' | 'main_workout' | 'cooldown' | 'accessory';
  exercise_type?: 'squat' | 'pushup' | 'plank' | 'custom';
  sets?: number;
  reps?: number;
  duration_seconds?: number;
  rest_seconds?: number;
  intensity?: 'low' | 'moderate' | 'high';
  notes?: string;
}

export default function ProgramsDashboard() {
  const { success: showSuccess, error: showError } = useToastContext();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [userPrograms, setUserPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'my-programs'>('templates');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showProgramDetails, setShowProgramDetails] = useState(false);

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch template programs
      const templatesResponse = await fetch('/api/programs?is_template=true', {
        credentials: 'include',
      });
      
      if (!templatesResponse.ok) {
        throw new Error('Failed to fetch template programs');
      }
      
      const templatesData = await templatesResponse.json();
      setPrograms(templatesData.programs || []);

      // Fetch user programs
      const userResponse = await fetch('/api/programs?is_template=false', {
        credentials: 'include',
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserPrograms(userData.programs || []);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      showError('Load Failed', 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleCreateProgram = async (templateId: string, programName: string) => {
    try {
      const response = await fetch('/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          template_id: templateId,
          name: programName,
          is_template: false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create program');
      }

      await response.json();
      showSuccess('Program Created!', 'Your program has been created successfully');
      fetchPrograms(); // Refresh the list
    } catch (error) {
      console.error('Error creating program:', error);
      showError('Creation Failed', 'Failed to create program');
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const currentPrograms = activeTab === 'templates' ? programs : userPrograms;

  if (loading) {
    return <LoadingOverlay isVisible={true} message="Loading programs..." />;
  }

  return (
    <Container className="py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Workout Programs
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Choose from our featured programs or create your own custom workout plan
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'templates'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Featured Programs
            </button>
            <button
              onClick={() => setActiveTab('my-programs')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'my-programs'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              My Programs
            </button>
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentPrograms.map((program) => (
            <div
              key={program.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {program.name}
                  </h3>
                  <Badge className={getDifficultyColor(program.difficulty_level)}>
                    {program.difficulty_level}
                  </Badge>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {program.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Icon name="calendar" className="w-4 h-4 mr-2" />
                    {program.duration_weeks} weeks
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Icon name="dumbbell" className="w-4 h-4 mr-2" />
                    {program.equipment_required.join(', ') || 'Bodyweight'}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {program.target_goals.map((goal) => (
                    <Badge key={goal} className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs">
                      {goal}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedProgram(program);
                      setShowProgramDetails(true);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                  >
                    <Icon name="search" className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  
                  {activeTab === 'templates' && (
                    <Button
                      onClick={() => handleCreateProgram(program.id, program.name)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Icon name="plus" className="w-4 h-4 mr-2" />
                      Create
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {currentPrograms.length === 0 && (
          <div className="text-center py-12">
            <Icon name="package" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No programs found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === 'templates' 
                ? 'No featured programs available at the moment.'
                : 'You haven\'t created any programs yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Program Details Modal */}
      {showProgramDetails && selectedProgram && (
        <ProgramDetailsModal
          program={selectedProgram}
          isOpen={showProgramDetails}
          onClose={() => {
            setShowProgramDetails(false);
            setSelectedProgram(null);
          }}
          onCreateProgram={activeTab === 'templates' ? () => handleCreateProgram(selectedProgram.id, selectedProgram.name) : undefined}
        />
      )}
    </Container>
  );
}

// Program Details Modal Component
interface ProgramDetailsModalProps {
  program: Program;
  isOpen: boolean;
  onClose: () => void;
  onCreateProgram?: () => void;
}

function ProgramDetailsModal({ program, isOpen, onClose, onCreateProgram }: ProgramDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {program.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {program.description}
              </p>
            </div>
            <Button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
            >
              <Icon name="x" className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Program Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Duration</h4>
              <p className="text-gray-600 dark:text-gray-400">{program.duration_weeks} weeks</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Difficulty</h4>
              <p className="text-gray-600 dark:text-gray-400 capitalize">{program.difficulty_level}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Equipment</h4>
              <p className="text-gray-600 dark:text-gray-400">
                {program.equipment_required.join(', ') || 'Bodyweight'}
              </p>
            </div>
          </div>

          {/* Program Weeks */}
          {program.program_weeks && program.program_weeks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Program Structure
              </h3>
              <div className="space-y-4">
                {program.program_weeks.map((week) => (
                  <div key={week.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Week {week.week_number}: {week.focus}
                    </h4>
                    {week.notes && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        {week.notes}
                      </p>
                    )}
                    
                    {week.program_days && week.program_days.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {week.program_days.map((day) => (
                          <div key={day.id} className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                            <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                              {day.day_name}
                            </h5>
                            {day.is_rest_day ? (
                              <p className="text-gray-500 dark:text-gray-400 text-xs">Rest Day</p>
                            ) : (
                              <p className="text-gray-600 dark:text-gray-400 text-xs">
                                {day.day_blocks.length} blocks
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
            >
              Close
            </Button>
            {onCreateProgram && (
              <Button
                onClick={onCreateProgram}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Icon name="plus" className="w-4 h-4 mr-2" />
                Create Program
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
