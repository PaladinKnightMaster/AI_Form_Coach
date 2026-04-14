"use client";
import { useState } from 'react';
import { Icon } from '@/ui/DS';

interface FirstRunTutorialProps {
	open: boolean;
	onClose: () => void;
	onComplete: () => void;
}

const tutorialSteps = [
	{
		title: "Perfect Your Lighting",
		content: "Position yourself facing a window or bright light source. Avoid backlighting (light behind you) as it makes pose detection difficult.",
		icon: "sun" as const,
		tip: "💡 Natural light works best, but any bright, even lighting will do."
	},
	{
		title: "Camera Position",
		content: "Place your camera at chest height, about 6-8 feet away. Make sure your entire body is visible in the frame from head to toe.",
		icon: "activity" as const,
		tip: "📱 Use landscape mode on mobile for the best experience."
	},
	{
		title: "Ready, Set, Go!",
		content: "When you start a session, you'll see a 3-2-1 countdown. Use this time to get into position and prepare for your first rep.",
		icon: "pause" as const,
		tip: "⏱️ The countdown gives you time to step back and get ready."
	}
];

export default function FirstRunTutorial({ open, onClose, onComplete }: FirstRunTutorialProps) {
	const [currentStep, setCurrentStep] = useState(0);

	if (!open) return null;

	const isLastStep = currentStep === tutorialSteps.length - 1;
	const step = tutorialSteps[currentStep];

	const handleNext = () => {
		if (isLastStep) {
			onComplete();
			onClose();
		} else {
			setCurrentStep(currentStep + 1);
		}
	};

	const handlePrevious = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleSkip = () => {
		onComplete();
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" aria-labelledby="tutorial-title">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/60" onClick={handleSkip} aria-hidden="true" />
			
			{/* Modal */}
			<div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-6">
				{/* Progress indicator */}
				<div className="flex items-center justify-between">
					<div className="flex space-x-2">
						{tutorialSteps.map((_, i) => (
							<div
								key={i}
								className={`h-2 w-8 rounded-full transition-colors ${
									i <= currentStep ? 'bg-green-500' : 'bg-gray-200'
								}`}
							/>
						))}
					</div>
					<button
						onClick={handleSkip}
						className="text-sm opacity-70 hover:opacity-100 underline"
					>
						Skip tutorial
					</button>
				</div>

				{/* Content */}
				<div className="text-center space-y-4">
					<div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
						<Icon name={step.icon} className="w-8 h-8 text-green-600" />
					</div>
					
					<div>
						<h2 id="tutorial-title" className="text-xl font-semibold mb-2">{step.title}</h2>
						<p className="text-gray-600 leading-relaxed">{step.content}</p>
					</div>
					
					<div className="bg-blue-50 rounded-lg p-3">
						<p className="text-sm text-blue-800">{step.tip}</p>
					</div>
				</div>

				{/* Navigation */}
				<div className="flex items-center justify-between">
					<button
						onClick={handlePrevious}
						disabled={currentStep === 0}
						className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Previous
					</button>
					
					<span className="text-sm opacity-70">
						{currentStep + 1} of {tutorialSteps.length}
					</span>
					
					<button
						onClick={handleNext}
						className="btn btn-primary"
					>
						{isLastStep ? "Let's start!" : 'Next'}
					</button>
				</div>
			</div>
		</div>
	);
} 