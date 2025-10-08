'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Icon } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';
import { 
  CALIBRATION_STEPS, 
  type CalibrationStep, 
  type CalibrationData
} from '@/types/calibration';
import { saveUserCalibration, getCalibrationStatus } from '@/lib/calibration/service';
import { getExerciseAngle } from '@/lib/pose/normalize';
import { PoseEngine2 } from '@/lib/pose/engine';
import type { PoseEstimateResult } from '@/lib/pose/engine';
import { logEvent } from '@/lib/observability/events';

interface CalibrationSession {
  steps: CalibrationStep[];
  currentStepIndex: number;
  isActive: boolean;
  collectedData: CalibrationData;
}

function CalibrationContent() {
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToastContext();
  
  const [session, setSession] = useState<CalibrationSession>({
    steps: CALIBRATION_STEPS.map(step => ({ ...step, isCompleted: false, collectedData: [] })),
    currentStepIndex: 0,
    isActive: false,
    collectedData: {},
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [poseEngine, setPoseEngine] = useState<PoseEngine2 | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentAngle, setCurrentAngle] = useState<number | null>(null);
  const [collectedAngles, setCollectedAngles] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isCalibrated, setIsCalibrated] = useState(false);

  // Check if user is already calibrated
  useEffect(() => {
    const checkCalibrationStatus = async () => {
      const status = await getCalibrationStatus();
      setIsCalibrated(status.isCalibrated);
    };
    checkCalibrationStatus();
  }, []);

  // Initialize pose engine
  useEffect(() => {
    const initPoseEngine = async () => {
      try {
        const engine = new PoseEngine2({ smoothingAlpha: 0.4 });
        await engine.init();
        setPoseEngine(engine);
      } catch (error) {
        console.error('Failed to initialize pose engine:', error);
        showError('Initialization Failed', 'Failed to initialize pose detection');
      }
    };
    
    initPoseEngine();
    
    return () => {
      if (poseEngine) {
        poseEngine.dispose();
      }
    };
  }, [showError, poseEngine]);

  const completeCalibration = useCallback(async (data: CalibrationData) => {
    setIsLoading(true);
    
    try {
      const result = await saveUserCalibration(data);
      
      if (result.success) {
        // P2: Log calibration completed event
        logEvent('calibration_completed', {
          squat_full_depth_angle: data.squat_full_depth_angle,
          pushup_elbow_bottom_angle: data.pushup_elbow_bottom_angle,
          bodyline_target: data.bodyline_target,
          stepResults: result.stepResults
        }).catch(() => {});
        
        showSuccess('Calibration Complete!', 'Your personalized thresholds have been saved');
        setIsCalibrated(true);
        setTimeout(() => {
          router.push('/coach');
        }, 2000);
      } else {
        showError('Calibration Failed', result.error || 'Failed to save calibration data');
      }
    } catch (error) {
      console.error('Error completing calibration:', error);
      showError('Calibration Failed', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [showSuccess, showError, router]);

  const startStep = useCallback((stepIndex: number) => {
    const step = session.steps[stepIndex];
    if (!step) return;
    
    setSession(prev => ({
      ...prev,
      currentStepIndex: stepIndex,
    }));
    
    setCollectedAngles([]);
    setTimeRemaining(step.duration);
    setIsDetecting(true);
    
    // Start countdown
    const countdown = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          // Call completeStep directly to avoid circular dependency
          const currentStep = session.steps[stepIndex];
          if (!currentStep || collectedAngles.length === 0) {
            showError('Calibration Failed', 'No data collected for this step');
            return 0;
          }
          
          // Calculate median angle
          const sortedAngles = [...collectedAngles].sort((a, b) => a - b);
          const medianAngle = sortedAngles[Math.floor(sortedAngles.length / 2)];
          
          // Update step with collected data
          const updatedSteps = session.steps.map((s, index) => 
            index === stepIndex 
              ? { 
                  ...s, 
                  isCompleted: true, 
                  collectedData: collectedAngles,
                  finalValue: medianAngle 
                }
              : s
          );
          
          // Update collected data
          const updatedCollectedData = {
            ...session.collectedData,
            [currentStep.targetMetric]: medianAngle,
          };
          
          setSession(prev => ({
            ...prev,
            steps: updatedSteps,
            collectedData: updatedCollectedData,
          }));
          
          setIsDetecting(false);
          setCollectedAngles([]);
          setCurrentAngle(null);
          
          // Move to next step or complete calibration
          if (stepIndex < session.steps.length - 1) {
            setTimeout(() => startStep(stepIndex + 1), 2000);
          } else {
            completeCalibration(updatedCollectedData);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [session.steps, session.collectedData, collectedAngles, showError, completeCalibration]);

  const startCalibration = useCallback(() => {
    // P2: Log calibration started event
    logEvent('calibration_started', {
      totalSteps: session.steps.length,
      exercises: session.steps.map(step => step.id)
    }).catch(() => {});
    
    setSession(prev => ({ ...prev, isActive: true }));
    startStep(0);
  }, [startStep, session.steps]);

  // Pose detection loop
  useEffect(() => {
    if (!isDetecting || !poseEngine || !videoRef) return;
    
    const detectPose = async () => {
      try {
        const result: PoseEstimateResult | null = await poseEngine.estimate(videoRef);
        
        if (result && result.landmarks) {
          const currentStep = session.steps[session.currentStepIndex];
          let angle: number | null = null;
          
          switch (currentStep.id) {
            case 'squat':
              angle = getExerciseAngle(result, 'squat');
              break;
            case 'pushup':
              angle = getExerciseAngle(result, 'pushup');
              break;
            case 'plank':
              angle = getExerciseAngle(result, 'plank');
              break;
          }
          
          if (angle !== null) {
            setCurrentAngle(angle);
            
            // Collect angle data every 500ms
            if (Date.now() % 500 < 100) { // Rough timing
              setCollectedAngles(prev => [...prev, angle!]);
            }
          }
        }
      } catch (error) {
        console.error('Error in pose detection:', error);
      }
      
      if (isDetecting) {
        requestAnimationFrame(detectPose);
      }
    };
    
    detectPose();
  }, [isDetecting, poseEngine, videoRef, session.currentStepIndex, session.steps]);

  const currentStep = session.steps[session.currentStepIndex];

  if (isCalibrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Already Calibrated!</h1>
          <p className="text-gray-600 mb-6">
            Your device is already calibrated with personalized thresholds.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/coach')}
              className="w-full"
            >
              Start Coaching
            </Button>
            <Button
              onClick={() => setIsCalibrated(false)}
              variant="outline"
              className="w-full"
            >
              Recalibrate
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!session.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Device Calibration</h1>
            <p className="text-gray-600 text-lg">
              Let&apos;s personalize your exercise thresholds for more accurate form analysis.
            </p>
          </div>
          
          <div className="space-y-6 mb-8">
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What we&apos;ll measure:</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-center gap-2">
                  <Icon name="check" className="w-4 h-4" />
                  <span>Squat depth - Your natural squat range</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="check" className="w-4 h-4" />
                  <span>Push-up depth - Your comfortable push-up range</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="check" className="w-4 h-4" />
                  <span>Plank alignment - Your natural body line</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4">
              <h3 className="font-semibold text-green-900 mb-2">Benefits:</h3>
              <ul className="space-y-2 text-green-800">
                <li className="flex items-center gap-2">
                  <Icon name="check" className="w-4 h-4" />
                  <span>More accurate rep counting</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="check" className="w-4 h-4" />
                  <span>Personalized form feedback</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="check" className="w-4 h-4" />
                  <span>Better progress tracking</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button
              onClick={() => router.push('/coach')}
              variant="outline"
              className="flex-1"
            >
              Skip for Now
            </Button>
            <Button
              onClick={startCalibration}
              className="flex-1"
              disabled={!poseEngine}
            >
              {!poseEngine ? 'Initializing...' : 'Start Calibration'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {session.currentStepIndex + 1} of {session.steps.length}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(((session.currentStepIndex + 1) / session.steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((session.currentStepIndex + 1) / session.steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentStep.title}</h2>
          <p className="text-gray-600 mb-4">{currentStep.description}</p>
          
          {/* Timer */}
          <div className="text-4xl font-bold text-blue-600 mb-4">
            {timeRemaining}s
          </div>
          
          {/* Current Angle Display */}
          {currentAngle !== null && (
            <div className="text-lg text-gray-700 mb-4">
              Current: {Math.round(currentAngle)}°
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Instructions:</h3>
          <ol className="space-y-2 text-gray-700">
            {currentStep.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                  {index + 1}
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Video Preview */}
        <div className="bg-gray-100 rounded-xl p-4 mb-6 text-center">
          <div className="text-gray-500 mb-2">Camera Preview</div>
          <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center">
            <video
              ref={setVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover rounded-lg"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
        </div>

        {/* Collected Data */}
        {collectedAngles.length > 0 && (
          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">Data Collected:</h3>
            <div className="text-green-800">
              <p>Angles: {collectedAngles.map(a => Math.round(a)).join(', ')}°</p>
              <p>Count: {collectedAngles.length} measurements</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={() => router.push('/coach')}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          {isLoading && (
            <Button disabled className="flex-1">
              Saving...
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CalibratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm opacity-70">Loading calibration...</p>
        </div>
      </div>
    }>
      <CalibrationContent />
    </Suspense>
  );
}