/**
 * Health Data Integration - Official Data Types
 * 
 * Aligned with official Apple HealthKit, Google Fit, and Health Connect schemas:
 * - iOS: HealthKit (HKCategorySample, HKQuantitySample, HKWorkout)
 * - Android: Health Connect (SleepSession, HeartRate, Steps, WorkoutSession)
 * - Web: Web APIs where available
 */

// Official Apple HealthKit Data Types
export interface HKCategorySample {
  value: number;
  startDate: Date;
  endDate: Date;
  sourceName: string;
  metadata?: Record<string, unknown>;
}

export interface HKQuantitySample {
  quantity: number;
  unit: string;
  startDate: Date;
  endDate: Date;
  sourceName: string;
  metadata?: Record<string, unknown>;
}

export interface HKWorkout {
  workoutActivityType: string;
  duration: number; // seconds
  totalEnergyBurned?: number; // kilocalories
  totalDistance?: number; // meters
  startDate: Date;
  endDate: Date;
  sourceName: string;
  metadata?: Record<string, unknown>;
}

// Official Health Connect Data Types
export interface SleepSession {
  startTime: Date;
  endTime: Date;
  stages: SleepStage[];
  sourcePackage: string;
}

export interface SleepStage {
  stage: 'AWAKE' | 'LIGHT' | 'DEEP' | 'REM' | 'OUT_OF_BED';
  startTime: Date;
  endTime: Date;
}

export interface HeartRate {
  time: Date;
  beatsPerMinute: number;
  sourcePackage: string;
}

export interface HeartRateVariability {
  time: Date;
  millis: number; // HRV in milliseconds
  sourcePackage: string;
}

export interface Steps {
  startTime: Date;
  endTime: Date;
  count: number;
  sourcePackage: string;
}

export interface WorkoutSession {
  startTime: Date;
  endTime: Date;
  exerciseType: string;
  totalCalories?: number;
  totalDistance?: number;
  sourcePackage: string;
}

// Official Google Fit Data Types
export interface GoogleFitSession {
  name: string;
  identifier: string;
  description: string;
  startTimeMillis: number;
  endTimeMillis: number;
  activityType: number;
  application: {
    packageName: string;
    version: string;
  };
}

export interface GoogleFitDataPoint {
  startTimeNanos: number;
  endTimeNanos: number;
  dataTypeName: string;
  originDataSourceId: string;
  value: Array<{
    intVal?: number[];
    floatVal?: number[];
    stringVal?: string[];
    mapVal?: Array<{
      key: string;
      value: {
        intVal?: number[];
        floatVal?: number[];
        stringVal?: string[];
      };
    }>;
  }>;
}

// Unified Health Data Interface
export interface HealthData {
  // Sleep data (official types)
  sleepSessions: SleepSession[];
  sleepDuration: number; // hours (calculated from sessions)
  
  // Heart rate data (official types)
  heartRateSamples: HeartRate[];
  restingHeartRate: number; // bpm (calculated from samples)
  
  // HRV data (official types)
  hrvSamples: HeartRateVariability[];
  hrv: number | null; // ms (calculated from samples)
  
  // Activity data (official types)
  stepSamples: Steps[];
  stepCount: number; // steps (calculated from samples)
  
  // Workout data (official types)
  workoutSessions: WorkoutSession[];
  trainingLoad: number; // calculated from workout sessions
  
  // Metadata
  date: Date;
  dataSources: string[];
  lastSync: Date;
}

export interface HealthBaseline {
  // Sleep baseline
  sleepBaseline: number; // hours
  sleepEfficiencyBaseline: number; // percentage
  
  // Heart rate baseline
  restingHRBaseline: number; // bpm
  maxHRBaseline: number; // bpm
  
  // HRV baseline
  hrvBaseline: number | null; // ms
  
  // Activity baseline
  stepBaseline: number; // steps
  activeMinutesBaseline: number; // minutes
  
  // Workout baseline
  weeklyTrainingLoadBaseline: number; // arbitrary units
  
  // Metadata
  lastUpdated: Date;
  dataQuality: 'high' | 'medium' | 'low';
}

export interface HealthPermissions {
  // Sleep permissions
  sleepAnalysis: boolean;
  sleepSessions: boolean;
  
  // Heart rate permissions
  heartRate: boolean;
  heartRateVariability: boolean;
  restingHeartRate: boolean;
  
  // Activity permissions
  steps: boolean;
  activeMinutes: boolean;
  distance: boolean;
  
  // Workout permissions
  workouts: boolean;
  exerciseSessions: boolean;
  
  // Nutrition permissions (for future use)
  nutrition: boolean;
  waterIntake: boolean;
  
  // Body measurements
  bodyMass: boolean;
  bodyFatPercentage: boolean;
  height: boolean;
}

// Health Connect Access Declarations (required for published apps)
export interface HealthConnectAccess {
  permissions: HealthPermission[];
  dataTypes: HealthDataType[];
  purpose: string;
  dataRetentionPeriod: number; // days
}

export interface HealthPermission {
  dataType: string;
  accessTypes: ('read' | 'write')[];
  justification: string;
}

export interface HealthDataType {
  name: string;
  category: 'ACTIVITY' | 'BODY_MEASUREMENTS' | 'NUTRITION' | 'SLEEP' | 'VITALS';
  description: string;
  required: boolean;
}

export class HealthDataManager {
  private baseline: HealthBaseline | null = null;
  private permissions: HealthPermissions = {
    sleepAnalysis: false,
    sleepSessions: false,
    heartRate: false,
    heartRateVariability: false,
    restingHeartRate: false,
    steps: false,
    activeMinutes: false,
    distance: false,
    workouts: false,
    exerciseSessions: false,
    nutrition: false,
    waterIntake: false,
    bodyMass: false,
    bodyFatPercentage: false,
    height: false
  };

  // Health Connect Access Declarations (required for published apps)
  private healthConnectAccess: HealthConnectAccess = {
    permissions: [
      {
        dataType: 'SleepSession',
        accessTypes: ['read'],
        justification: 'Calculate sleep quality and duration for readiness assessment'
      },
      {
        dataType: 'HeartRate',
        accessTypes: ['read'],
        justification: 'Monitor resting heart rate for recovery assessment'
      },
      {
        dataType: 'HeartRateVariability',
        accessTypes: ['read'],
        justification: 'Assess autonomic nervous system recovery'
      },
      {
        dataType: 'Steps',
        accessTypes: ['read'],
        justification: 'Track daily activity levels for readiness calculation'
      },
      {
        dataType: 'WorkoutSession',
        accessTypes: ['read'],
        justification: 'Calculate training load and recovery needs'
      }
    ],
    dataTypes: [
      {
        name: 'SleepSession',
        category: 'SLEEP',
        description: 'Sleep duration and quality data',
        required: true
      },
      {
        name: 'HeartRate',
        category: 'VITALS',
        description: 'Heart rate measurements',
        required: true
      },
      {
        name: 'HeartRateVariability',
        category: 'VITALS',
        description: 'Heart rate variability measurements',
        required: false
      },
      {
        name: 'Steps',
        category: 'ACTIVITY',
        description: 'Daily step count',
        required: true
      },
      {
        name: 'WorkoutSession',
        category: 'ACTIVITY',
        description: 'Exercise and workout sessions',
        required: true
      }
    ],
    purpose: 'AI-powered fitness coaching with personalized readiness assessment based on health metrics',
    dataRetentionPeriod: 90 // days
  };

  constructor() {
    this.loadBaseline();
  }

  /**
   * Check if running on mobile device
   */
  private isMobile(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Check if running on iOS
   */
  private isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  /**
   * Check if running on Android
   */
  private isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  /**
   * Request health data permissions
   */
  async requestPermissions(): Promise<HealthPermissions> {
    if (this.isIOS()) {
      return this.requestIOSPermissions();
    } else if (this.isAndroid()) {
      return this.requestAndroidPermissions();
    } else {
      return this.requestWebPermissions();
    }
  }

  /**
   * Request iOS HealthKit permissions using official data types
   */
  private async requestIOSPermissions(): Promise<HealthPermissions> {
    try {
      // Check if HealthKit is available
      if (typeof (window as { HealthKit?: unknown }).HealthKit === 'undefined') {
        console.warn('HealthKit not available');
        return this.permissions;
      }

      const healthKit = (window as { [key: string]: unknown }).HealthKit;
      
      // Request permissions for official HealthKit data types
      const sleepAnalysisPermission = await healthKit.requestAuthorization(['HKCategoryTypeIdentifierSleepAnalysis']);
      const heartRatePermission = await healthKit.requestAuthorization(['HKQuantityTypeIdentifierHeartRate']);
      const hrvPermission = await healthKit.requestAuthorization(['HKQuantityTypeIdentifierHeartRateVariabilitySDNN']);
      const stepsPermission = await healthKit.requestAuthorization(['HKQuantityTypeIdentifierStepCount']);
      const activeMinutesPermission = await healthKit.requestAuthorization(['HKQuantityTypeIdentifierAppleExerciseTime']);
      const distancePermission = await healthKit.requestAuthorization(['HKQuantityTypeIdentifierDistanceWalkingRunning']);
      const workoutPermission = await healthKit.requestAuthorization(['HKWorkoutTypeIdentifier']);
      const bodyMassPermission = await healthKit.requestAuthorization(['HKQuantityTypeIdentifierBodyMass']);
      const bodyFatPermission = await healthKit.requestAuthorization(['HKQuantityTypeIdentifierBodyFatPercentage']);

      this.permissions = {
        sleepAnalysis: sleepAnalysisPermission,
        sleepSessions: sleepAnalysisPermission, // Derived from sleep analysis
        heartRate: heartRatePermission,
        heartRateVariability: hrvPermission,
        restingHeartRate: heartRatePermission, // Derived from heart rate
        steps: stepsPermission,
        activeMinutes: activeMinutesPermission,
        distance: distancePermission,
        workouts: workoutPermission,
        exerciseSessions: workoutPermission, // Derived from workouts
        nutrition: false, // Not implemented yet
        waterIntake: false, // Not implemented yet
        bodyMass: bodyMassPermission,
        bodyFatPercentage: bodyFatPermission,
        height: false // Not implemented yet
      };

      return this.permissions;
    } catch (error) {
      console.error('Error requesting iOS permissions:', error);
      return this.permissions;
    }
  }

  /**
   * Request Android Health Connect permissions using official data types
   */
  private async requestAndroidPermissions(): Promise<HealthPermissions> {
    try {
      // Check if Health Connect is available
      if (typeof (window as { [key: string]: unknown }).HealthConnect === 'undefined') {
        console.warn('Health Connect not available');
        return this.permissions;
      }

      const healthConnect = (window as { [key: string]: unknown }).HealthConnect;
      
      // Request permissions for official Health Connect data types
      const sleepSessionPermission = await healthConnect.requestPermission('SleepSession');
      const heartRatePermission = await healthConnect.requestPermission('HeartRate');
      const hrvPermission = await healthConnect.requestPermission('HeartRateVariability');
      const stepsPermission = await healthConnect.requestPermission('Steps');
      const activeMinutesPermission = await healthConnect.requestPermission('ActiveMinutes');
      const distancePermission = await healthConnect.requestPermission('Distance');
      const workoutSessionPermission = await healthConnect.requestPermission('WorkoutSession');
      const bodyMassPermission = await healthConnect.requestPermission('BodyMass');
      const bodyFatPermission = await healthConnect.requestPermission('BodyFatPercentage');

      this.permissions = {
        sleepAnalysis: sleepSessionPermission, // Derived from sleep sessions
        sleepSessions: sleepSessionPermission,
        heartRate: heartRatePermission,
        heartRateVariability: hrvPermission,
        restingHeartRate: heartRatePermission, // Derived from heart rate
        steps: stepsPermission,
        activeMinutes: activeMinutesPermission,
        distance: distancePermission,
        workouts: workoutSessionPermission,
        exerciseSessions: workoutSessionPermission,
        nutrition: false, // Not implemented yet
        waterIntake: false, // Not implemented yet
        bodyMass: bodyMassPermission,
        bodyFatPercentage: bodyFatPermission,
        height: false // Not implemented yet
      };

      return this.permissions;
    } catch (error) {
      console.error('Error requesting Android permissions:', error);
      return this.permissions;
    }
  }

  /**
   * Request Web API permissions
   */
  private async requestWebPermissions(): Promise<HealthPermissions> {
    try {
      // Check for Web APIs availability
      const hasWebBluetooth = 'bluetooth' in navigator;
      const hasWebUSB = 'usb' in navigator;
      const hasWebSerial = 'serial' in navigator;

      // For web, we'll primarily rely on manual input
      // but we can try to get some basic data if available
      this.permissions = {
        sleepAnalysis: false, // Manual input required
        sleepSessions: false, // Manual input required
        heartRate: hasWebBluetooth, // Possible with Bluetooth devices
        heartRateVariability: hasWebBluetooth, // Possible with Bluetooth devices
        restingHeartRate: hasWebBluetooth, // Possible with Bluetooth devices
        steps: false, // Manual input required
        activeMinutes: false, // Manual input required
        distance: false, // Manual input required
        workouts: false, // Manual input required
        exerciseSessions: false, // Manual input required
        nutrition: false, // Manual input required
        waterIntake: false, // Manual input required
        bodyMass: false, // Manual input required
        bodyFatPercentage: false, // Manual input required
        height: false // Manual input required
      };

      return this.permissions;
    } catch (error) {
      console.error('Error requesting web permissions:', error);
      return this.permissions;
    }
  }

  /**
   * Fetch health data for a specific date
   */
  async fetchHealthData(date: Date): Promise<HealthData | null> {
    try {
      if (this.isIOS()) {
        return this.fetchIOSHealthData(date);
      } else if (this.isAndroid()) {
        return this.fetchAndroidHealthData(date);
      } else {
        return this.fetchWebHealthData(date);
      }
    } catch (error) {
      console.error('Error fetching health data:', error);
      return null;
    }
  }

  /**
   * Fetch iOS HealthKit data using official data types
   */
  private async fetchIOSHealthData(date: Date): Promise<HealthData | null> {
    try {
      const healthKit = (window as { [key: string]: unknown }).HealthKit;
      if (!healthKit) return null;

      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      // Fetch official HealthKit data types
      const [sleepSamples, heartRateSamples, hrvSamples, stepSamples, workoutSamples] = await Promise.all([
        this.permissions.sleepAnalysis ? healthKit.getSamples('HKCategoryTypeIdentifierSleepAnalysis', startDate, endDate) : null,
        this.permissions.heartRate ? healthKit.getSamples('HKQuantityTypeIdentifierHeartRate', startDate, endDate) : null,
        this.permissions.heartRateVariability ? healthKit.getSamples('HKQuantityTypeIdentifierHeartRateVariabilitySDNN', startDate, endDate) : null,
        this.permissions.steps ? healthKit.getSamples('HKQuantityTypeIdentifierStepCount', startDate, endDate) : null,
        this.permissions.workouts ? healthKit.getSamples('HKWorkoutTypeIdentifier', startDate, endDate) : null
      ]);

      // Convert HealthKit samples to our unified format
      const sleepSessions = this.convertHealthKitSleepSamples(sleepSamples);
      const heartRateData = this.convertHealthKitHeartRateSamples(heartRateSamples);
      const hrvData = this.convertHealthKitHRVSamples(hrvSamples);
      const stepData = this.convertHealthKitStepSamples(stepSamples);
      const workoutData = this.convertHealthKitWorkoutSamples(workoutSamples);

      return {
        sleepSessions,
        sleepDuration: this.calculateSleepDuration(sleepSessions),
        heartRateSamples: heartRateData.samples,
        restingHeartRate: heartRateData.restingHR,
        hrvSamples: hrvData.samples,
        hrv: hrvData.averageHRV,
        stepSamples: stepData.samples,
        stepCount: stepData.totalSteps,
        workoutSessions: workoutData.sessions,
        trainingLoad: this.calculateTrainingLoad(workoutData.sessions),
        date: date,
        dataSources: ['HealthKit'],
        lastSync: new Date()
      };
    } catch (error) {
      console.error('Error fetching iOS health data:', error);
      return null;
    }
  }

  /**
   * Fetch Android Health Connect data using official data types
   */
  private async fetchAndroidHealthData(date: Date): Promise<HealthData | null> {
    try {
      const healthConnect = (window as { [key: string]: unknown }).HealthConnect;
      if (!healthConnect) return null;

      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      // Fetch official Health Connect data types
      const [sleepSessions, heartRateSamples, hrvSamples, stepSamples, workoutSessions] = await Promise.all([
        this.permissions.sleepSessions ? healthConnect.getSleepSessions(startDate, endDate) : null,
        this.permissions.heartRate ? healthConnect.getHeartRate(startDate, endDate) : null,
        this.permissions.heartRateVariability ? healthConnect.getHeartRateVariability(startDate, endDate) : null,
        this.permissions.steps ? healthConnect.getSteps(startDate, endDate) : null,
        this.permissions.workouts ? healthConnect.getWorkoutSessions(startDate, endDate) : null
      ]);

      // Convert Health Connect data to our unified format
      const heartRateData = this.convertHealthConnectHeartRateSamples(heartRateSamples);
      const hrvData = this.convertHealthConnectHRVSamples(hrvSamples);
      const stepData = this.convertHealthConnectStepSamples(stepSamples);

      return {
        sleepSessions: sleepSessions || [],
        sleepDuration: this.calculateSleepDuration(sleepSessions || []),
        heartRateSamples: heartRateData.samples,
        restingHeartRate: heartRateData.restingHR,
        hrvSamples: hrvData.samples,
        hrv: hrvData.averageHRV,
        stepSamples: stepData.samples,
        stepCount: stepData.totalSteps,
        workoutSessions: workoutSessions || [],
        trainingLoad: this.calculateTrainingLoad(workoutSessions || []),
        date: date,
        dataSources: ['Health Connect'],
        lastSync: new Date()
      };
    } catch (error) {
      console.error('Error fetching Android health data:', error);
      return null;
    }
  }

  /**
   * Fetch Web API data (limited)
   */
  private async fetchWebHealthData(date: Date): Promise<HealthData | null> {
    try {
      // For web, we'll primarily return null and rely on manual input
      // But we can try to get some basic data if available
      return {
        sleepSessions: [],
        sleepDuration: 0, // Manual input required
        heartRateSamples: [],
        restingHeartRate: 0, // Manual input required
        hrvSamples: [],
        hrv: null, // Manual input required
        stepSamples: [],
        stepCount: 0, // Manual input required
        workoutSessions: [],
        trainingLoad: 0, // Manual input required
        date: date,
        dataSources: ['Web'],
        lastSync: new Date()
      };
    } catch (error) {
      console.error('Error fetching web health data:', error);
      return null;
    }
  }

  /**
   * Calculate readiness score from health data
   */
  calculateReadinessScore(healthData: HealthData): number {
    if (!this.baseline) {
      // If no baseline, return neutral score
      return 0.5;
    }

    const sleepScore = this.calculateSleepScore(healthData.sleepDuration);
    const heartRateScore = this.calculateHeartRateScore(healthData.restingHeartRate);
    const hrvScore = healthData.hrv ? this.calculateHRVScore(healthData.hrv) : 0.5;
    const stepsScore = this.calculateStepsScore(healthData.stepCount);
    const trainingLoadScore = this.calculateTrainingLoadScore(healthData.trainingLoad);

    // Weighted average
    const weights = {
      sleep: 0.3,
      heartRate: 0.2,
      hrv: 0.2,
      steps: 0.15,
      trainingLoad: 0.15
    };

    return (
      sleepScore * weights.sleep +
      heartRateScore * weights.heartRate +
      hrvScore * weights.hrv +
      stepsScore * weights.steps +
      trainingLoadScore * weights.trainingLoad
    );
  }

  /**
   * Calculate sleep score (0-1)
   */
  private calculateSleepScore(sleepDuration: number): number {
    if (!this.baseline) return 0.5;
    
    const baseline = this.baseline.sleepBaseline;
    const ratio = sleepDuration / baseline;
    
    // Optimal range is 0.9-1.1 of baseline
    if (ratio >= 0.9 && ratio <= 1.1) return 1.0;
    if (ratio >= 0.8 && ratio <= 1.2) return 0.8;
    if (ratio >= 0.7 && ratio <= 1.3) return 0.6;
    return Math.max(0, 1 - Math.abs(ratio - 1) * 2);
  }

  /**
   * Calculate heart rate score (0-1)
   */
  private calculateHeartRateScore(restingHR: number): number {
    if (!this.baseline || restingHR === 0) return 0.5;
    
    const baseline = this.baseline.restingHRBaseline;
    const ratio = restingHR / baseline;
    
    // Lower is better for resting HR
    if (ratio <= 0.95) return 1.0;
    if (ratio <= 1.05) return 0.8;
    if (ratio <= 1.15) return 0.6;
    return Math.max(0, 1 - (ratio - 1) * 3);
  }

  /**
   * Calculate HRV score (0-1)
   */
  private calculateHRVScore(hrv: number): number {
    if (!this.baseline || !this.baseline.hrvBaseline) return 0.5;
    
    const baseline = this.baseline.hrvBaseline;
    const ratio = hrv / baseline;
    
    // Higher is better for HRV
    if (ratio >= 1.1) return 1.0;
    if (ratio >= 1.0) return 0.8;
    if (ratio >= 0.9) return 0.6;
    return Math.max(0, ratio);
  }

  /**
   * Calculate steps score (0-1)
   */
  private calculateStepsScore(stepCount: number): number {
    if (!this.baseline) return 0.5;
    
    const baseline = this.baseline.stepBaseline;
    const ratio = stepCount / baseline;
    
    // Optimal range is 0.8-1.2 of baseline
    if (ratio >= 0.8 && ratio <= 1.2) return 1.0;
    if (ratio >= 0.6 && ratio <= 1.4) return 0.8;
    if (ratio >= 0.4 && ratio <= 1.6) return 0.6;
    return Math.max(0, 1 - Math.abs(ratio - 1) * 1.5);
  }

  /**
   * Calculate training load score (0-1)
   */
  private calculateTrainingLoadScore(trainingLoad: number): number {
    if (!this.baseline) return 0.5;
    
    const baseline = this.baseline.weeklyTrainingLoadBaseline;
    const ratio = trainingLoad / baseline;
    
    // Moderate training load is optimal
    if (ratio >= 0.7 && ratio <= 1.3) return 1.0;
    if (ratio >= 0.5 && ratio <= 1.5) return 0.8;
    if (ratio >= 0.3 && ratio <= 1.7) return 0.6;
    return Math.max(0, 1 - Math.abs(ratio - 1) * 1.2);
  }

  /**
   * Set or update baseline values
   */
  setBaseline(baseline: HealthBaseline): void {
    this.baseline = baseline;
    this.saveBaseline();
  }

  /**
   * Get current baseline
   */
  getBaseline(): HealthBaseline | null {
    return this.baseline;
  }

  /**
   * Load baseline from localStorage
   */
  private loadBaseline(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      
      const stored = localStorage.getItem('health_baseline');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.baseline = {
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated)
        };
      }
    } catch (error) {
      console.error('Error loading health baseline:', error);
    }
  }

  /**
   * Save baseline to localStorage
   */
  private saveBaseline(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      
      if (this.baseline) {
        localStorage.setItem('health_baseline', JSON.stringify(this.baseline));
      }
    } catch (error) {
      console.error('Error saving health baseline:', error);
    }
  }

  /**
   * Get current permissions
   */
  getPermissions(): HealthPermissions {
    return this.permissions;
  }

  /**
   * Check if health data is available
   */
  hasHealthData(): boolean {
    return Object.values(this.permissions).some(permission => permission);
  }

  /**
   * Get Health Connect access declarations (required for published apps)
   */
  getHealthConnectAccess(): HealthConnectAccess {
    return this.healthConnectAccess;
  }

  // Conversion helper methods for HealthKit data
  private convertHealthKitSleepSamples(samples: unknown[]): SleepSession[] {
    if (!samples) return [];
    
    return samples.map(sample => ({
      startTime: new Date(sample.startDate),
      endTime: new Date(sample.endDate),
      stages: [{
        stage: this.mapHealthKitSleepStage(sample.value),
        startTime: new Date(sample.startDate),
        endTime: new Date(sample.endDate)
      }],
      sourcePackage: sample.sourceName || 'HealthKit'
    }));
  }

  private mapHealthKitSleepStage(value: number): 'AWAKE' | 'LIGHT' | 'DEEP' | 'REM' | 'OUT_OF_BED' {
    // HealthKit sleep analysis values: 0 = inBed, 1 = asleep, 2 = awake
    switch (value) {
      case 0: return 'LIGHT'; // inBed
      case 1: return 'DEEP'; // asleep
      case 2: return 'AWAKE'; // awake
      default: return 'AWAKE';
    }
  }

  private convertHealthKitHeartRateSamples(samples: unknown[]): { samples: HeartRate[], restingHR: number } {
    if (!samples) return { samples: [], restingHR: 0 };
    
    const heartRateSamples: HeartRate[] = samples.map(sample => ({
      time: new Date(sample.startDate),
      beatsPerMinute: sample.quantity,
      sourcePackage: sample.sourceName || 'HealthKit'
    }));

    // Calculate resting heart rate (lowest 10% of readings)
    const sortedHR = heartRateSamples.map(hr => hr.beatsPerMinute).sort((a, b) => a - b);
    const restingHR = sortedHR.length > 0 ? 
      sortedHR.slice(0, Math.ceil(sortedHR.length * 0.1)).reduce((a, b) => a + b, 0) / Math.ceil(sortedHR.length * 0.1) : 0;

    return { samples: heartRateSamples, restingHR: Math.round(restingHR) };
  }

  private convertHealthKitHRVSamples(samples: unknown[]): { samples: HeartRateVariability[], averageHRV: number | null } {
    if (!samples) return { samples: [], averageHRV: null };
    
    const hrvSamples: HeartRateVariability[] = samples.map(sample => ({
      time: new Date(sample.startDate),
      millis: sample.quantity,
      sourcePackage: sample.sourceName || 'HealthKit'
    }));

    const averageHRV = hrvSamples.length > 0 ? 
      hrvSamples.reduce((sum, hrv) => sum + hrv.millis, 0) / hrvSamples.length : null;

    return { samples: hrvSamples, averageHRV: averageHRV ? Math.round(averageHRV) : null };
  }

  private convertHealthKitStepSamples(samples: unknown[]): { samples: Steps[], totalSteps: number } {
    if (!samples) return { samples: [], totalSteps: 0 };
    
    const stepSamples: Steps[] = samples.map(sample => ({
      startTime: new Date(sample.startDate),
      endTime: new Date(sample.endDate),
      count: sample.quantity,
      sourcePackage: sample.sourceName || 'HealthKit'
    }));

    const totalSteps = stepSamples.reduce((sum, step) => sum + step.count, 0);

    return { samples: stepSamples, totalSteps };
  }

  private convertHealthKitWorkoutSamples(samples: unknown[]): { sessions: WorkoutSession[] } {
    if (!samples) return { sessions: [] };
    
    const workoutSessions: WorkoutSession[] = samples.map(sample => ({
      startTime: new Date(sample.startDate),
      endTime: new Date(sample.endDate),
      exerciseType: this.mapHealthKitWorkoutType(sample.workoutActivityType),
      totalCalories: sample.totalEnergyBurned,
      totalDistance: sample.totalDistance,
      sourcePackage: sample.sourceName || 'HealthKit'
    }));

    return { sessions: workoutSessions };
  }

  private mapHealthKitWorkoutType(activityType: string): string {
    // Map HealthKit workout activity types to readable names
    const typeMap: Record<string, string> = {
      'HKWorkoutActivityTypeRunning': 'Running',
      'HKWorkoutActivityTypeWalking': 'Walking',
      'HKWorkoutActivityTypeCycling': 'Cycling',
      'HKWorkoutActivityTypeStrengthTraining': 'Strength Training',
      'HKWorkoutActivityTypeYoga': 'Yoga',
      'HKWorkoutActivityTypePilates': 'Pilates',
      'HKWorkoutActivityTypeOther': 'Other'
    };
    
    return typeMap[activityType] || 'Other';
  }

  // Conversion helper methods for Health Connect data
  private convertHealthConnectHeartRateSamples(samples: unknown[]): { samples: HeartRate[], restingHR: number } {
    if (!samples) return { samples: [], restingHR: 0 };
    
    const heartRateSamples: HeartRate[] = samples.map(sample => ({
      time: new Date(sample.time),
      beatsPerMinute: sample.beatsPerMinute,
      sourcePackage: sample.sourcePackage || 'Health Connect'
    }));

    // Calculate resting heart rate (lowest 10% of readings)
    const sortedHR = heartRateSamples.map(hr => hr.beatsPerMinute).sort((a, b) => a - b);
    const restingHR = sortedHR.length > 0 ? 
      sortedHR.slice(0, Math.ceil(sortedHR.length * 0.1)).reduce((a, b) => a + b, 0) / Math.ceil(sortedHR.length * 0.1) : 0;

    return { samples: heartRateSamples, restingHR: Math.round(restingHR) };
  }

  private convertHealthConnectHRVSamples(samples: unknown[]): { samples: HeartRateVariability[], averageHRV: number | null } {
    if (!samples) return { samples: [], averageHRV: null };
    
    const hrvSamples: HeartRateVariability[] = samples.map(sample => ({
      time: new Date(sample.time),
      millis: sample.millis,
      sourcePackage: sample.sourcePackage || 'Health Connect'
    }));

    const averageHRV = hrvSamples.length > 0 ? 
      hrvSamples.reduce((sum, hrv) => sum + hrv.millis, 0) / hrvSamples.length : null;

    return { samples: hrvSamples, averageHRV: averageHRV ? Math.round(averageHRV) : null };
  }

  private convertHealthConnectStepSamples(samples: unknown[]): { samples: Steps[], totalSteps: number } {
    if (!samples) return { samples: [], totalSteps: 0 };
    
    const stepSamples: Steps[] = samples.map(sample => ({
      startTime: new Date(sample.startTime),
      endTime: new Date(sample.endTime),
      count: sample.count,
      sourcePackage: sample.sourcePackage || 'Health Connect'
    }));

    const totalSteps = stepSamples.reduce((sum, step) => sum + step.count, 0);

    return { samples: stepSamples, totalSteps };
  }

  // Calculation helper methods
  private calculateSleepDuration(sleepSessions: SleepSession[]): number {
    if (!sleepSessions || sleepSessions.length === 0) return 0;
    
    const totalSleepMs = sleepSessions.reduce((total, session) => {
      const sessionDuration = session.endTime.getTime() - session.startTime.getTime();
      return total + sessionDuration;
    }, 0);
    
    return totalSleepMs / (1000 * 60 * 60); // Convert to hours
  }

  private calculateTrainingLoad(workoutSessions: WorkoutSession[]): number {
    if (!workoutSessions || workoutSessions.length === 0) return 0;
    
    // Calculate training load based on workout duration and intensity
    return workoutSessions.reduce((total, session) => {
      const durationHours = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60 * 60);
      const calories = session.totalCalories || 0;
      const intensity = calories > 0 ? calories / durationHours : 1; // calories per hour as intensity proxy
      return total + (durationHours * intensity);
    }, 0);
  }
}
