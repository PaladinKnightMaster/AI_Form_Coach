"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button, Icon } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';
import LoadingOverlay from '@/components/LoadingOverlay';
import { creatorPacksService } from '@/lib/creator-packs/service';
import { getCurrentUserId } from '@/lib/supabase/client';
import type { PackUploadForm, PackValidationResult } from '@/lib/creator-packs/types';

export default function CreatorPackUploadPage() {
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<PackValidationResult | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [form, setForm] = useState<PackUploadForm>({
    title: '',
    description: '',
    shortDescription: '',
    duration: 4,
    difficulty: 'beginner',
    price: 1999, // $19.99
    currency: 'USD',
    tags: [],
    equipment: [],
    targetGoals: [],
    preview: {
      sampleWorkouts: [],
      highlights: [],
      requirements: []
    },
    content: {
      metadata: {
        totalDuration: 4,
        totalWorkouts: 0,
        averageWorkoutDuration: 0,
        equipmentRequired: [],
        prerequisites: [],
        learningObjectives: []
      },
      weeks: [],
      resources: [],
      assessments: []
    },
    creator: {
      name: '',
      bio: '',
      credentials: [],
      experience: '',
      socialLinks: {}
    }
  });

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const userId = await getCurrentUserId();
      if (!userId) {
        router.push('/signin?redirect=/creator-packs/upload');
        return;
      }
      setIsAuthenticated(true);
    };
    checkAuth();
  }, [router]);

  const handleInputChange = (field: string, value: unknown) => {
    setForm(prev => {
      const keys = field.split('.');
      const newForm = { ...prev } as Record<string, unknown>;
      let current: Record<string, unknown> = newForm;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]] = { ...(current[keys[i]] as Record<string, unknown>) };
      }
      
      current[keys[keys.length - 1]] = value;
      return newForm as unknown as PackUploadForm;
    });
  };

  const handleArrayChange = (field: string, value: string[]) => {
    setForm(prev => {
      const keys = field.split('.');
      const newForm = { ...prev } as Record<string, unknown>;
      let current: Record<string, unknown> = newForm;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]] = { ...(current[keys[i]] as Record<string, unknown>) };
      }
      
      current[keys[keys.length - 1]] = value;
      return newForm as unknown as PackUploadForm;
    });
  };

  const addArrayItem = (field: string, value: string) => {
    if (!value.trim()) return;
    
    const currentArray = getNestedValue(form as unknown as Record<string, unknown>, field) || [];
    handleArrayChange(field, [...(currentArray as string[]), value.trim()]);
  };

  const removeArrayItem = (field: string, index: number) => {
    const currentArray = getNestedValue(form as unknown as Record<string, unknown>, field) || [];
    handleArrayChange(field, (currentArray as string[]).filter((_: unknown, i: number) => i !== index));
  };

  const getNestedValue = (obj: Record<string, unknown>, path: string) => {
    return path.split('.').reduce((current: unknown, key: string) => (current as Record<string, unknown>)?.[key], obj);
  };

  const validateForm = () => {
    const result = creatorPacksService.validatePackUpload(form);
    setValidation(result);
    return result.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Validation Failed', 'Please fix the errors before submitting');
      return;
    }

    try {
      setLoading(true);
      
      // Get current user
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('User not authenticated');
      }
      
      const { user } = await response.json();
      
      const result = await creatorPacksService.uploadPack(form, user.id);
      
      if (result.success) {
        showSuccess('Upload Successful!', 'Your pack has been submitted for review');
        // Reset form
        setForm({
          title: '',
          description: '',
          shortDescription: '',
          duration: 4,
          difficulty: 'beginner',
          price: 1999,
          currency: 'USD',
          tags: [],
          equipment: [],
          targetGoals: [],
          preview: {
            sampleWorkouts: [],
            highlights: [],
            requirements: []
          },
          content: {
            metadata: {
              totalDuration: 4,
              totalWorkouts: 0,
              averageWorkoutDuration: 0,
              equipmentRequired: [],
              prerequisites: [],
              learningObjectives: []
            },
            weeks: [],
            resources: [],
            assessments: []
          },
          creator: {
            name: '',
            bio: '',
            credentials: [],
            experience: '',
            socialLinks: {}
          }
        });
        setValidation(null);
      } else {
        showError('Upload Failed', result.errors?.[0]?.message || 'Failed to upload pack');
      }
    } catch (error) {
      console.error('Error uploading pack:', error);
      showError('Upload Failed', 'Failed to upload pack');
    } finally {
      setLoading(false);
    }
  };

  const ArrayInput = ({ field, label, placeholder }: { field: string; label: string; placeholder: string }) => {
    const [inputValue, setInputValue] = useState('');
    const array = getNestedValue(form as unknown as Record<string, unknown>, field) || [];

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addArrayItem(field, inputValue);
                setInputValue('');
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              addArrayItem(field, inputValue);
              setInputValue('');
            }}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(array as string[]).map((item: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
            >
              {item}
              <button
                type="button"
                onClick={() => removeArrayItem(field, index)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <Icon name="x" className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingOverlay isVisible={true} message="Uploading pack..." />;
  }

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return <LoadingOverlay isVisible={true} message="Checking authentication..." />;
  }

  // Redirect if not authenticated (handled in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Upload Creator Pack
          </h1>
          <p className="text-gray-600">
            Create and submit a new workout program for the marketplace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                  placeholder="Enter pack title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (weeks) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={form.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty *
                </label>
                <select
                  value={form.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (cents) *
                </label>
                <input
                  type="number"
                  min="100"
                  max="100000"
                  value={form.price}
                  onChange={(e) => handleInputChange('price', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ${(form.price / 100).toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                placeholder="Detailed description of the pack"
              />
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description *
              </label>
              <input
                type="text"
                value={form.shortDescription}
                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                placeholder="Brief description for previews"
              />
            </div>
          </div>

          {/* Tags and Equipment */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Tags and Equipment
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ArrayInput
                field="tags"
                label="Tags"
                placeholder="Add tags (e.g., strength, cardio, beginner)"
              />
              
              <ArrayInput
                field="equipment"
                label="Equipment Required"
                placeholder="Add equipment (e.g., dumbbells, resistance bands)"
              />
              
              <ArrayInput
                field="targetGoals"
                label="Target Goals"
                placeholder="Add goals (e.g., strength, endurance, weight_loss)"
              />
            </div>
          </div>

          {/* Preview Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Preview Information
            </h2>
            
            <div className="space-y-4">
              <ArrayInput
                field="preview.highlights"
                label="Highlights"
                placeholder="Add key highlights (e.g., No equipment needed, Progressive difficulty)"
              />
              
              <ArrayInput
                field="preview.requirements"
                label="Requirements"
                placeholder="Add requirements (e.g., Basic fitness level, 20 minutes per day)"
              />
            </div>
          </div>

          {/* Creator Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Creator Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Creator Name *
                </label>
                <input
                  type="text"
                  value={form.creator.name}
                  onChange={(e) => handleInputChange('creator.name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                  placeholder="Your name or brand"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience
                </label>
                <input
                  type="text"
                  value={form.creator.experience}
                  onChange={(e) => handleInputChange('creator.experience', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                  placeholder="e.g., 5+ years, Certified Trainer"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={form.creator.bio}
                onChange={(e) => handleInputChange('creator.bio', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                placeholder="Brief bio about yourself"
              />
            </div>
            
            <div className="mt-4">
              <ArrayInput
                field="creator.credentials"
                label="Credentials"
                placeholder="Add credentials (e.g., Certified Personal Trainer, Nutritionist)"
              />
            </div>
          </div>

          {/* Validation Results */}
          {validation && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Validation Results
              </h2>
              
              {validation.errors.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-red-600 mb-2">
                    Errors
                  </h3>
                  <ul className="space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <Icon name="alert-circle" className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-red-600">
                          <strong>{error.field}:</strong> {error.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validation.warnings.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-yellow-600 mb-2">
                    Warnings
                  </h3>
                  <ul className="space-y-1">
                    {validation.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start">
                        <Icon name="alert-triangle" className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-yellow-600">
                          <strong>{warning.field}:</strong> {warning.message}
                          {warning.suggestion && (
                            <span className="block text-sm mt-1">
                              <strong>Suggestion:</strong> {warning.suggestion}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Submit Pack for Review'}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}
