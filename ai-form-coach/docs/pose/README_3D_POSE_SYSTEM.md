# 3D Pose Analysis System

A comprehensive 3D pose analysis system for professional-grade fitness coaching, similar to Sword Health AI. This system provides real-time 3D pose reconstruction, biomechanical analysis, form scoring, and intelligent feedback.

## 🚀 Features

### Core 3D Analysis
- **3D Pose Reconstruction**: Converts 2D MediaPipe landmarks to full 3D pose analysis
- **Biomechanical Analysis**: Calculates center of mass, balance, stability, and force vectors
- **Joint Angle Analysis**: 3D joint angles with flexion, abduction, and rotation components
- **Body Alignment**: Spinal, pelvic, and shoulder alignment analysis

### Advanced Form Scoring
- **Exercise-Specific Scoring**: Tailored scoring for squats, push-ups, planks, deadlifts, and lunges
- **Multi-Metric Analysis**: Technique, range of motion, stability, alignment, and balance
- **Real-Time Feedback**: Instant corrections and positive reinforcement
- **Progress Tracking**: Session metrics and improvement analysis

### Professional Visualization
- **3D Skeleton Rendering**: Real-time 3D skeleton visualization
- **Form Overlays**: Visual corrections and alignment guides
- **Movement Tracking**: Movement path and phase visualization
- **Progress Visualization**: Score history and improvement indicators

## 📁 File Structure

```
src/lib/pose/
├── pose3D.ts                 # Core 3D pose analysis engine
├── pose3DFeedback.ts         # Real-time feedback system
├── pose3DVisualization.ts    # 3D visualization and rendering
├── pose3DIntegration.ts      # System integration and management
├── pose3DExample.ts          # Usage examples and integration guides
└── README_3D_POSE_SYSTEM.md  # This documentation
```

## 🛠️ Quick Start

### Basic Setup

```typescript
import { createPose3DSystem, createExerciseConfig } from './lib/pose/pose3DIntegration';

// Create 3D pose system
const poseSystem = createPose3DSystem({
  analysisEnabled: true,
  feedbackEnabled: true,
  visualizationEnabled: true,
  exerciseType: 'squat',
  ...createExerciseConfig('squat')
});

// Initialize with canvas
await poseSystem.initialize(canvasElement);
poseSystem.start();

// Process pose frames
const pose3D = poseSystem.processPose(poseResult);
const feedback = poseSystem.getCurrentFeedback();
```

### React Integration

```tsx
import React, { useEffect, useRef } from 'react';
import { createPose3DSystem } from '../lib/pose/pose3DIntegration';

export const Pose3DAnalysis: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseSystemRef = useRef<any>(null);

  useEffect(() => {
    const initializeSystem = async () => {
      if (canvasRef.current) {
        poseSystemRef.current = createPose3DSystem();
        await poseSystemRef.current.initialize(canvasRef.current);
        poseSystemRef.current.start();
      }
    };

    initializeSystem();
    return () => poseSystemRef.current?.dispose();
  }, []);

  return (
    <canvas ref={canvasRef} width={800} height={600} />
  );
};
```

## 🎯 Exercise-Specific Analysis

### Squat Analysis
- **Depth Analysis**: Measures squat depth based on knee angles
- **Knee Tracking**: Ensures knees stay over toes
- **Torso Angle**: Maintains proper back alignment
- **Balance**: Center of mass stability

### Push-up Analysis
- **Depth Analysis**: Measures push-up depth based on elbow angles
- **Body Alignment**: Maintains straight body line
- **Elbow Tracking**: Proper elbow positioning
- **Core Stability**: Core engagement analysis

### Plank Analysis
- **Body Alignment**: Straight line from head to heels
- **Core Stability**: Core muscle engagement
- **Shoulder Stability**: Shoulder position and stability
- **Hip Alignment**: Hip position and alignment

## 📊 Form Scoring System

### Scoring Components
- **Technique (0-1)**: Overall movement quality
- **Range of Motion (0-1)**: Full movement execution
- **Stability (0-1)**: Core and joint stability
- **Alignment (0-1)**: Body alignment and posture
- **Balance (0-1)**: Balance and control

### Overall Score Calculation
```typescript
overall = (technique + rangeOfMotion + stability + alignment + balance) * 20
// Results in 0-100 scale
```

## 🔧 Configuration Options

### Analysis Settings
```typescript
{
  analysisEnabled: true,           // Enable 3D analysis
  feedbackEnabled: true,           // Enable real-time feedback
  visualizationEnabled: true,      // Enable 3D visualization
  feedbackFrequency: 100,          // Feedback update frequency (ms)
  maxCorrections: 3,               // Maximum corrections shown
  showPositives: true,             // Show positive feedback
  showProgress: true,              // Show progress indicators
}
```

### Visualization Settings
```typescript
{
  showSkeleton: true,              // Show 3D skeleton
  showOverlays: true,              // Show form overlays
  showMovement: true,              // Show movement tracking
  showFeedback: true,              // Show feedback indicators
}
```

### Exercise Settings
```typescript
{
  exerciseType: 'squat',           // Current exercise
  targetReps: 12,                  // Target repetitions
  targetSets: 3,                   // Target sets
  smoothingEnabled: true,          // Enable smoothing
  smoothingFactor: 0.7,            // Smoothing intensity
  confidenceThreshold: 0.5,        // Minimum confidence
}
```

## 📈 Session Metrics

### Real-Time Metrics
- **Form Score**: Current form quality (0-100)
- **Movement Phase**: Current phase (setup, eccentric, bottom, concentric, top)
- **Stability Score**: Core stability (0-1)
- **Balance Score**: Balance quality (0-1)

### Session Summary
- **Total Reps**: Completed repetitions
- **Average Form Score**: Session average
- **Best/Worst Form Score**: Performance range
- **Improvement Rate**: Progress over time
- **Session Duration**: Total time

## 🎨 Visualization Features

### 3D Skeleton
- Real-time 3D bone rendering
- Joint confidence visualization
- Body segment highlighting
- Customizable colors and opacity

### Form Overlays
- Alignment guides
- Angle indicators
- Range of motion arcs
- Balance indicators

### Movement Tracking
- Movement path visualization
- Phase indicators
- Velocity vectors
- Acceleration indicators

### Feedback Visualization
- Correction highlights
- Positive feedback animations
- Exercise cues
- Progress indicators

## 🔄 Integration with Existing Systems

### MediaPipe Integration
```typescript
// Your existing MediaPipe setup
const poseResult = await poseLandmarker.detect(videoElement);

// Process through 3D analysis
const pose3D = poseSystem.processPose(poseResult);
```

### PoseEngine2 Integration
```typescript
// Your existing PoseEngine2
const poseResult = await poseEngine.estimate(videoElement);

// Enhanced with 3D analysis
const pose3D = poseSystem.processPose(poseResult);
```

## 🚀 Performance Optimization

### High Performance Configuration
```typescript
const highPerfConfig = {
  feedbackFrequency: 50,           // 20 FPS
  maxCorrections: 2,               // Limit corrections
  showPositives: false,            // Disable positives
  showMovement: false,             // Disable movement tracking
  smoothingFactor: 0.8,            // Higher smoothing
  confidenceThreshold: 0.6,        // Higher threshold
};
```

### Beginner Configuration
```typescript
const beginnerConfig = {
  feedbackFrequency: 300,          // 3.3 FPS
  maxCorrections: 1,               // One correction at a time
  showPositives: true,             // Show encouragement
  smoothingFactor: 0.9,            // High smoothing
  confidenceThreshold: 0.7,        // High reliability
};
```

## 📱 Mobile Optimization

### Touch-Friendly Interface
- Large feedback buttons
- Clear visual indicators
- Simplified corrections
- Voice feedback options

### Performance Considerations
- Reduced visualization complexity
- Lower update frequency
- Optimized rendering
- Battery efficiency

## 🔍 Advanced Features

### Biomechanical Analysis
- **Center of Mass**: Real-time COM calculation
- **Base of Support**: Balance area analysis
- **Joint Forces**: Estimated joint reaction forces
- **Stability Margins**: Balance stability metrics

### Movement Analysis
- **Phase Detection**: Automatic movement phase recognition
- **Quality Metrics**: Smoothness, control, and power
- **Progression Tracking**: Improvement over time
- **Pattern Recognition**: Movement pattern analysis

### Custom Exercise Support
```typescript
// Add custom exercise analysis
const customExercise = {
  exercise: 'custom',
  phase: 'setup',
  cues: ['Custom instruction 1', 'Custom instruction 2'],
  completion: 0.5
};
```

## 🐛 Troubleshooting

### Common Issues

1. **Low Performance**
   - Reduce `feedbackFrequency`
   - Disable `showMovement`
   - Increase `confidenceThreshold`

2. **Inaccurate Analysis**
   - Check camera positioning
   - Ensure good lighting
   - Verify MediaPipe setup

3. **Missing Feedback**
   - Check `feedbackEnabled` setting
   - Verify `maxCorrections` limit
   - Ensure pose detection is working

### Debug Mode
```typescript
const debugConfig = {
  analysisEnabled: true,
  feedbackEnabled: true,
  visualizationEnabled: true,
  feedbackFrequency: 1000,         // 1 FPS for debugging
  maxCorrections: 10,              // Show all corrections
  showPositives: true,
  showProgress: true,
  smoothingEnabled: false,         // No smoothing for debugging
  confidenceThreshold: 0.1,        // Low threshold for testing
};
```

## 📚 API Reference

### Core Classes

#### `Pose3DAnalyzer`
- `analyze(result: PoseEstimateResult): Pose3D`
- Main analysis engine

#### `Pose3DFeedbackEngine`
- `generateFeedback(pose3D: Pose3D, exerciseType: string): PoseFeedback3D`
- Feedback generation

#### `Pose3DVisualizationEngine`
- `render(pose3D: Pose3D, feedback: PoseFeedback3D): void`
- 3D visualization

#### `Pose3DSystemManager`
- `processPose(poseResult: PoseEstimateResult): Pose3D`
- `getCurrentFeedback(): PoseFeedback3D`
- `getSessionData(): SessionData3D`
- System management

### Key Types

#### `Pose3D`
```typescript
interface Pose3D {
  landmarks: Landmark3D[];
  skeleton: Skeleton3D;
  biomechanics: Biomechanics3D;
  formScore: FormScore3D;
  movement: Movement3D;
}
```

#### `PoseFeedback3D`
```typescript
interface PoseFeedback3D {
  overall: FeedbackMessage;
  corrections: Correction3D[];
  positives: FeedbackMessage[];
  exercise: ExerciseFeedback3D;
  phase: PhaseFeedback3D;
  progress: ProgressFeedback3D;
}
```

## 🎯 Best Practices

### Performance
- Use appropriate `feedbackFrequency` for your use case
- Enable smoothing for stability
- Set reasonable `confidenceThreshold`
- Monitor performance metrics

### User Experience
- Show positive feedback regularly
- Limit corrections to avoid overwhelming users
- Use clear, actionable feedback messages
- Provide exercise-specific guidance

### Accuracy
- Ensure good camera positioning
- Maintain consistent lighting
- Use appropriate exercise configurations
- Monitor confidence scores

## 🔮 Future Enhancements

### Planned Features
- **AI-Powered Coaching**: Machine learning-based feedback
- **Multi-Exercise Workouts**: Seamless exercise transitions
- **Social Features**: Sharing and competition
- **Advanced Analytics**: Detailed performance insights
- **Wearable Integration**: Heart rate and biometric data
- **Voice Coaching**: Audio feedback and instructions

### Customization Options
- **Custom Exercise Definitions**: User-defined exercises
- **Personalized Feedback**: Adaptive coaching styles
- **Custom Visualizations**: User-defined overlays
- **Integration APIs**: Third-party service integration

## 📄 License

This 3D Pose Analysis System is part of the AI Form Coach project and follows the same licensing terms.

## 🤝 Contributing

Contributions are welcome! Please see the main project contributing guidelines for details.

## 📞 Support

For support and questions about the 3D Pose Analysis System, please refer to the main project documentation or create an issue in the project repository.
