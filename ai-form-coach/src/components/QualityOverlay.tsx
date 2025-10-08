"use client";

interface QualityOverlayProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export default function QualityOverlay({ isVisible, onDismiss }: QualityOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 text-center shadow-xl">
        <div className="text-6xl mb-4">📹</div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Camera Quality Issue
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          I can&apos;t see your full body clearly. Please:
        </p>
        <ul className="text-left text-sm text-gray-600 dark:text-gray-300 space-y-2 mb-6">
          <li>• Step back a bit to fit your full body in frame</li>
          <li>• Improve lighting in your space</li>
          <li>• Adjust your camera angle if needed</li>
          <li>• Make sure you&apos;re not too close to the camera</li>
        </ul>
        <button
          onClick={onDismiss}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          I&apos;ve Fixed It - Continue
        </button>
      </div>
    </div>
  );
}
