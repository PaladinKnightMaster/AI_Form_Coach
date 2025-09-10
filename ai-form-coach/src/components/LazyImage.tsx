"use client";
import { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
	src: string;
	alt: string;
	className?: string;
	width?: number;
	height?: number;
	placeholder?: string;
}

export default function LazyImage({ src, alt, className, width, height, placeholder }: LazyImageProps) {
	const [isLoaded, setIsLoaded] = useState(false);
	const [isInView, setIsInView] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsInView(true);
					observer.disconnect();
				}
			},
			{ rootMargin: '50px' }
		);

		if (imgRef.current) {
			observer.observe(imgRef.current);
		}

		return () => observer.disconnect();
	}, []);

	return (
		<div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
			{/* Placeholder */}
			{!isLoaded && (
				<div 
					className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center"
					style={{ backgroundColor: placeholder || 'var(--color-border)' }}
				>
					<span className="text-sm opacity-50">Loading...</span>
				</div>
			)}
			
			{/* Actual image */}
			<img
				ref={imgRef}
				src={isInView ? src : undefined}
				alt={alt}
				className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
				onLoad={() => setIsLoaded(true)}
				loading="lazy"
				width={width}
				height={height}
			/>
		</div>
	);
} 