// Form Report Types and Data Structures

export interface SessionReportData {
  // Session metadata
  sessionId: string;
  exercise: 'squat' | 'pushup' | 'plank';
  startedAt: string;
  endedAt: string | null;
  duration: number; // in seconds
  totalReps: number;
  
  // Performance metrics
  correctRate: number; // 0-1
  avgQualityScore: number; // 0-100
  integrityScore: number; // 0-1
  avgRomScore: number; // 0-100
  
  // Rep details
  reps: RepReportData[];
  
  // Analysis insights
  insights: ReportInsight[];
  nextFocus: string[];
  
  // User info
  userId: string;
  generatedAt: string;
}

export interface RepReportData {
  idx: number;
  startMs: number;
  endMs: number;
  duration: number; // in ms
  isCorrect: boolean | null;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | null;
  qualityScore: number | null;
  peakDepth: number | null;
  romScore: number | null;
  tempo: 'fast' | 'normal' | 'slow' | null;
  errors: RepError[] | null;
  confidence: number | null;
}

export interface RepError {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  duration: number;
}

export interface ReportInsight {
  type: 'strength' | 'improvement' | 'consistency' | 'form' | 'tempo';
  title: string;
  description: string;
  severity: 'positive' | 'neutral' | 'negative';
  recommendation?: string;
}

export interface ReportOptions {
  includeWatermark: boolean;
  includeDetailedReps: boolean;
  includeInsights: boolean;
  includeNextFocus: boolean;
  format: 'pdf' | 'png';
  quality: 'standard' | 'high';
}

export interface ReportGenerationResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

// Report template data for rendering
export interface ReportTemplateData {
  session: SessionReportData;
  options: ReportOptions;
  branding: {
    logoUrl?: string;
    companyName: string;
    primaryColor: string;
    secondaryColor: string;
  };
  isProUser: boolean;
}
