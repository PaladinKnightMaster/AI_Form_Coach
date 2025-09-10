"use client";
import { useEffect, useState } from 'react';
import { Icon } from '@/ui/DS';

interface WelcomeToastProps {
	message: string;
	onClose: () => void;
	duration?: number;
}

export default function WelcomeToast({ message, onClose, duration = 4000 }: WelcomeToastProps) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		// Trigger animation
		const timer = setTimeout(() => setVisible(true), 100);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		if (duration > 0) {
			const timer = setTimeout(() => {
				setVisible(false);
				setTimeout(onClose, 300); // Wait for fade out
			}, duration);
			return () => clearTimeout(timer);
		}
	}, [duration, onClose]);

	const handleClose = () => {
		setVisible(false);
		setTimeout(onClose, 300);
	};

	return (
		<div 
			className={`fixed top-20 right-4 z-50 max-w-sm transition-all duration-300 ${
				visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
			}`}
		>
			<div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
				<Icon name="check" className="flex-shrink-0 mt-0.5" />
				<div className="flex-1">
					<p className="text-sm font-medium">Welcome to AI Form Coach!</p>
					<p className="text-xs opacity-90 mt-1">{message}</p>
				</div>
				<button
					onClick={handleClose}
					className="flex-shrink-0 ml-2 hover:opacity-75 focus:outline-none"
					aria-label="Close notification"
				>
					<span className="text-lg leading-none">×</span>
				</button>
			</div>
		</div>
	);
} 