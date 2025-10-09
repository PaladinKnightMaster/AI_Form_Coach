// Creator Packs Marketplace Types and Data Structures

export interface CreatorPack {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  duration: number; // in weeks
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  preview: PackPreview;
  price: number; // in cents
  currency: string;
  content: PackContent; // JSON template
  creator: PackCreator;
  tags: string[];
  equipment: string[];
  targetGoals: string[];
  isActive: boolean;
  isFeatured: boolean;
  purchaseCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PackPreview {
  thumbnailUrl?: string;
  videoUrl?: string;
  sampleWorkouts: SampleWorkout[];
  highlights: string[];
  requirements: string[];
}

export interface SampleWorkout {
  id: string;
  title: string;
  duration: number; // in minutes
  exercises: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isUnlocked: boolean; // false for preview, true for purchased
}

export interface PackContent {
  version: string;
  metadata: PackMetadata;
  weeks: PackWeek[];
  resources: PackResource[];
  assessments: PackAssessment[];
}

export interface PackMetadata {
  totalDuration: number; // in weeks
  totalWorkouts: number;
  averageWorkoutDuration: number; // in minutes
  equipmentRequired: string[];
  prerequisites: string[];
  learningObjectives: string[];
}

export interface PackWeek {
  weekNumber: number;
  title: string;
  description: string;
  focus: string;
  workouts: PackWorkout[];
  assessments: string[];
  notes: string;
}

export interface PackWorkout {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: PackExercise[];
  restPeriods: RestPeriod[];
  instructions: string;
  tips: string[];
  variations: ExerciseVariation[];
}

export interface PackExercise {
  id: string;
  name: string;
  type: 'squat' | 'pushup' | 'plank' | 'custom';
  sets: number;
  reps: number | string; // can be "AMRAP" or time-based
  restTime: number; // in seconds
  instructions: string;
  cues: string[];
  modifications: ExerciseModification[];
}

export interface ExerciseModification {
  type: 'easier' | 'harder';
  description: string;
  changes: Record<string, unknown>;
}

export interface ExerciseVariation {
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
}

export interface RestPeriod {
  type: 'between_sets' | 'between_exercises' | 'between_rounds';
  duration: number; // in seconds
  description: string;
}

export interface PackResource {
  id: string;
  type: 'video' | 'image' | 'document' | 'audio';
  title: string;
  description: string;
  url: string;
  duration?: number; // for videos/audio
  size?: number; // in bytes
  isPremium: boolean; // requires purchase
}

export interface PackAssessment {
  id: string;
  type: 'fitness_test' | 'form_check' | 'progress_tracking';
  title: string;
  description: string;
  exercises: string[];
  criteria: AssessmentCriteria[];
  frequency: 'weekly' | 'bi_weekly' | 'monthly';
}

export interface AssessmentCriteria {
  metric: string;
  target: number | string;
  unit: string;
  description: string;
}

export interface PackCreator {
  id: string;
  name: string;
  bio: string;
  avatarUrl?: string;
  credentials: string[];
  experience: string;
  socialLinks: Record<string, string>;
  verified: boolean;
}

export interface PackPurchase {
  id: string;
  userId: string;
  packId: string;
  pack: CreatorPack;
  purchaseDate: string;
  price: number;
  currency: string;
  stripePaymentIntentId?: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
}

export interface PackReview {
  id: string;
  userId: string;
  packId: string;
  rating: number; // 1-5
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  wouldRecommend: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    avatarUrl?: string;
  };
}

export interface PackUploadForm {
  title: string;
  description: string;
  shortDescription: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  currency: string;
  tags: string[];
  equipment: string[];
  targetGoals: string[];
  preview: {
    thumbnailFile?: File;
    videoFile?: File;
    sampleWorkouts: Omit<SampleWorkout, 'id'>[];
    highlights: string[];
    requirements: string[];
  };
  content: Omit<PackContent, 'version'>;
  creator: Omit<PackCreator, 'id' | 'verified'>;
}

export interface PackValidationResult {
  isValid: boolean;
  errors: PackValidationError[];
  warnings: PackValidationWarning[];
}

export interface PackValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface PackValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// API Response Types
export interface PacksListResponse {
  packs: CreatorPack[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PackDetailsResponse {
  pack: CreatorPack;
  isPurchased: boolean;
  userReview?: PackReview;
  relatedPacks: CreatorPack[];
}

export interface PackUploadResponse {
  success: boolean;
  packId?: string;
  errors?: PackValidationError[];
  warnings?: PackValidationWarning[];
}

// Filter and Search Types
export interface PackFilters {
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[];
  duration?: {
    min?: number;
    max?: number;
  };
  price?: {
    min?: number;
    max?: number;
  };
  equipment?: string[];
  targetGoals?: string[];
  tags?: string[];
  rating?: {
    min?: number;
  };
  isFeatured?: boolean;
}

export interface PackSearchParams {
  query?: string;
  filters?: PackFilters;
  sortBy?: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'rating' | 'popularity';
  page?: number;
  limit?: number;
}
