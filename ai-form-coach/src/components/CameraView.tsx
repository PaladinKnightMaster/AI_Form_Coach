"use client";
import { forwardRef } from 'react';

const CameraView = forwardRef<HTMLVideoElement, { className?: string }>(function CameraView({ className }, ref) {
	return (
		<div className={className}>
			<video ref={ref} className="w-full h-full object-contain" playsInline muted />
		</div>
	);
});

export default CameraView; 