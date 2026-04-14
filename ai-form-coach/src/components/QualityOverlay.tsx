"use client";

interface QualityOverlayProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export default function QualityOverlay({ isVisible, onDismiss }: QualityOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center shadow-xl animate-fade-in">
        <div className="text-6xl mb-4 animate-bounce">📹</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Camera Quality Issue
        </h3>
        <p className="text-gray-600 mb-4">
          I can&apos;t see your full body clearly. Please:
        </p>
        <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Step back to fit your full body in frame
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Improve lighting in your space
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Adjust your camera angle if needed
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Make sure you&apos;re not too close to the camera
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Remove any objects blocking the camera view
          </li>
        </ul>
        <div className="bg-blue-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-blue-700">
            💡 <strong>Pro tip:</strong> Stand 6-8 feet away from your camera for best results
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors w-full"
        >
          I&apos;ve Fixed It - Continue
        </button>
      </div>
    </div>
  );
}
