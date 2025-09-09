"use client";
import { useEffect, useState } from 'react';
import { Icon } from '@/ui/DS';

interface ToastProps {
	message: string;
	type?: 'error' | 'success' | 'info';
	onClose: () => void;
	duration?: number;
}

export default function Toast({ message, type = 'error', onClose, duration = 5000 }: ToastProps) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		// Trigger animation
		const timer = setTimeout(() => setVisible(true), 10);
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

	const bgColor = {
		error: 'bg-red-600',
		success: 'bg-green-600',
		info: 'bg-blue-600'
	}[type];

	return (
		<div 
			className={`fixed top-4 right-4 z-50 max-w-sm transition-all duration-300 ${
				visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
			}`}
		>
			<div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3`}>
				<Icon name={type === 'error' ? 'alert' : 'check'} className="flex-shrink-0 mt-0.5" />
				<p className="text-sm flex-1">{message}</p>
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