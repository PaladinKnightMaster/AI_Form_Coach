"use client";
import React, { ForwardedRef, forwardRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

export function Container({ children, className, maxWidth = '7xl' }: {
	children: React.ReactNode;
	className?: string;
	maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}) {
	const maxWidthClass = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		'2xl': 'max-w-2xl',
		'3xl': 'max-w-3xl',
		'4xl': 'max-w-4xl',
		'5xl': 'max-w-5xl',
		'6xl': 'max-w-6xl',
		'7xl': 'max-w-7xl',
	}[maxWidth];
	return (
		<div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClass} ${className || ''}`}>
			{children}
		</div>
	);
}

export function Section({ children, className, padding = 'default' }: { 
	children: React.ReactNode; 
	className?: string;
	padding?: 'none' | 'sm' | 'default' | 'lg' | 'xl';
}) {
	const paddingClass = {
		none: '',
		sm: 'py-8 sm:py-12',
		default: 'py-12 sm:py-16 lg:py-20',
		lg: 'py-16 sm:py-20 lg:py-24',
		xl: 'py-20 sm:py-24 lg:py-32'
	}[padding];
	
	return (
		<section className={`${paddingClass} ${className || ''}`}>
			{children}
		</section>
	);
}

export const Button = forwardRef(function Button(
	{ children, variant = 'primary', size = 'md', className, loading = false, asChild = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
		variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
		size?: 'sm' | 'md' | 'lg' | 'xl';
		loading?: boolean;
		asChild?: boolean;
	},
	ref: ForwardedRef<HTMLButtonElement>
) {
	const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
	
	const variants = {
		primary: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl focus-visible:ring-emerald-500',
		secondary: 'bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-600 backdrop-blur-sm focus-visible:ring-slate-500',
		ghost: 'hover:bg-slate-800 text-slate-300 focus-visible:ring-slate-500',
		outline: 'border border-slate-600 hover:bg-slate-800 text-slate-300 focus-visible:ring-slate-500',
		destructive: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl focus-visible:ring-red-500'
	};
	
	const sizes = {
		sm: 'px-3 py-1.5 text-sm rounded-md',
		md: 'px-4 py-2 text-sm rounded-lg',
		lg: 'px-6 py-3 text-base rounded-lg',
		xl: 'px-8 py-4 text-lg rounded-xl'
	};
	
	const buttonClasses = twMerge(`${base} ${variants[variant]} ${sizes[size]}`, className);
	
	if (asChild && React.isValidElement(children)) {
		// eslint-disable-next-line react-hooks/refs -- ref forwarding via cloneElement is intentional for polymorphic component
		return React.cloneElement(children, {
			className: `${buttonClasses} ${(children.props as { className?: string }).className || ''}`,
			ref,
			...props
		} as React.HTMLAttributes<HTMLElement>);
	}
	
	return (
		<button 
			ref={ref} 
			className={buttonClasses}
			disabled={loading || props.disabled}
			aria-disabled={loading || props.disabled}
			aria-label={props['aria-label'] || (typeof children === 'string' ? children : undefined)}
			{...props}
		>
			{loading && (
				<svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
					<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
					<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
				</svg>
			)}
			{children}
		</button>
	);
});

export function Badge({ children, tone = 'success', size = 'md', className }: { 
	children: React.ReactNode; 
	tone?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}) {
	const base = 'inline-flex items-center font-medium rounded-full';
	
	const tones = {
		success: 'bg-green-900/20 text-green-300 border border-green-800',
		warning: 'bg-yellow-900/20 text-yellow-300 border border-yellow-800',
		error: 'bg-red-900/20 text-red-300 border border-red-800',
		info: 'bg-blue-900/20 text-blue-300 border border-blue-800',
		neutral: 'bg-gray-900/20 text-gray-300 border border-gray-800'
	};
	
	const sizes = {
		sm: 'px-2 py-0.5 text-xs',
		md: 'px-2.5 py-1 text-sm',
		lg: 'px-3 py-1.5 text-base'
	};
	
	return (
		<span className={twMerge(`${base} ${tones[tone]} ${sizes[size]}`, className)}>
			{children}
		</span>
	);
}

export function Icon({ name, className }: { name: 'check'|'alert'|'alert-circle'|'camera'|'moon'|'sun'|'activity'|'message'|'pause'|'chart'|'download'|'chevron-down'|'chevron-up'|'chevron-left'|'chevron-right'|'plus'|'search'|'x'|'target'|'trending-up'|'alert-triangle'|'calendar'|'clock'|'flame'|'zap'|'heart'|'star'|'trophy'|'bell'|'settings'|'user'|'home'|'menu'|'filter'|'edit'|'trash'|'save'|'refresh'|'play'|'stop'|'volume'|'volume-off'|'link'|'bar-chart-2'|'cpu'|'lock'|'lightbulb'|'award'|'arrow-right'|'check-circle'|'external-link'|'dumbbell'|'package'; className?: string }) {
	const paths: Record<string, string> = {
		check: 'M5 13l4 4L19 7',
		alert: 'M12 9v4m0 4h.01M10.29 3.86l-7.98 13.8A2 2 0 004 20h16a2 2 0 001.69-3.14l-7.98-13.8a2 2 0 00-3.42 0z',
		'alert-circle': 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
		camera: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11zM12 17a4 4 0 100-8 4 4 0 000 8z',
		moon: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
		sun: 'M12 2v2m0 16v2m10-10h-2M6 12H4m15.364 6.364l-1.414-1.414M6.05 6.05L4.636 4.636m12.728 0l1.414 1.414M6.05 17.95l-1.414 1.414',
		activity: 'M22 12H18L15 21L9 3L6 12H2',
		message: 'M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z',
		pause: 'M10 4h4v16h-4zM4 4h4v16H4zM16 4h4v16h-4z',
		chart: 'M3 3v18h18M7 13v4M11 9v8M15 5v12',
		download: 'M12 3v12m0 0l-4-4m4 4l4-4M5 21h14',
		'chevron-down': 'M6 9l6 6 6-6',
		'chevron-up': 'M18 15l-6-6-6 6',
		'chevron-left': 'M15 18l-6-6 6-6',
		'chevron-right': 'M9 18l6-6-6-6',
		plus: 'M12 5v14m-7-7h14',
		search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
		x: 'M18 6L6 18M6 6l12 12',
		target: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z',
		'trending-up': 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z',
		'alert-triangle': 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01',
		calendar: 'M8 2v3m8-3v3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
		clock: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z',
		flame: 'M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm6 7c-.1 0-.2 0-.3.1-.4.2-.6.5-.6.9 0 .3.1.6.3.8.2.2.5.3.8.3.4 0 .7-.2.9-.6.1-.1.1-.2.1-.3 0-.1 0-.2-.1-.3-.2-.4-.5-.6-.9-.6zM6 9c-.4 0-.7.2-.9.6-.1.1-.1.2-.1.3 0 .1 0 .2.1.3.2.4.5.6.9.6.3 0 .6-.1.8-.3.2-.2.3-.5.3-.8 0-.4-.2-.7-.6-.9-.1-.1-.2-.1-.3-.1z',
		zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
		heart: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
		star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
		trophy: 'M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v2a7 7 0 01-7 7v1h2a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1v-2a1 1 0 011-1h2v-1a7 7 0 01-7-7V5a1 1 0 011-1h3z',
		bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 01-3.46 0',
		settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
		user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z',
		home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
		menu: 'M3 12h18M3 6h18M3 18h18',
		filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
		edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
		trash: 'M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6',
		save: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8',
		refresh: 'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15',
		play: 'M8 5v14l11-7z',
		stop: 'M6 6h12v12H6z',
		volume: 'M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07',
		'volume-off': 'M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6',
		link: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
		'bar-chart-2': 'M18 20V10M12 20V4M6 20v-6',
		cpu: 'M9 3v2M15 3v2M9 19v2M15 19v2M20 9h2M20 14h2M4 9H2M4 14H2M18 8h2a1 1 0 011 1v6a1 1 0 01-1 1h-2M6 8H4a1 1 0 00-1 1v6a1 1 0 001 1h2M9 7h6v10H9V7z',
		lock: 'M12 15v2M6 21h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM7 10V7a5 5 0 1110 0v3',
		lightbulb: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zM12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z',
		award: 'M12 15l-3-3h6l-3 3zM12 2l3 3h-6l3-3zM2 12l3-3v6l-3-3zM22 12l-3-3v6l3-3zM12 22l-3-3h6l-3 3z',
		'arrow-right': 'M5 12h14M12 5l7 7-7 7',
		'check-circle': 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
		'external-link': 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
		dumbbell: 'M6.5 6.5h11v11h-11zM4 10.5h2v3H4zM18 10.5h2v3h-2zM8.5 4v2M15.5 4v2M8.5 18v2M15.5 18v2',
		package: 'M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12'
	};
	return (
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className={className} suppressHydrationWarning>
			<path d={paths[name]} strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

// Advanced UI Components
export function Card({ children, className, hover = false, padding = 'default' }: {
	children: React.ReactNode;
	className?: string;
	hover?: boolean;
	padding?: 'none' | 'sm' | 'default' | 'lg';
}) {
	const paddingClass = {
		none: '',
		sm: 'p-4',
		default: 'p-6',
		lg: 'p-8'
	}[padding];
	
	return (
		<div className={twMerge(`bg-slate-900 rounded-xl shadow-lg border border-slate-700 ${paddingClass} ${hover ? 'hover:shadow-xl transition-shadow duration-200' : ''}`, className)}>
			{children}
		</div>
	);
}

export function LoadingSpinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
	const sizeClass = {
		sm: 'h-4 w-4',
		md: 'h-6 w-6',
		lg: 'h-8 w-8'
	}[size];
	
	return (
		<svg className={`animate-spin ${sizeClass} ${className || ''}`} fill="none" viewBox="0 0 24 24">
			<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
			<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
		</svg>
	);
}

export function ProgressBar({ value, max = 100, size = 'md', className, showLabel = false }: {
	value: number;
	max?: number;
	size?: 'sm' | 'md' | 'lg';
	className?: string;
	showLabel?: boolean;
}) {
	const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
	
	const sizeClass = {
		sm: 'h-1',
		md: 'h-2',
		lg: 'h-3'
	}[size];
	
	return (
		<div className={`w-full ${className || ''}`}>
			{showLabel && (
				<div className="flex justify-between text-sm text-slate-400 mb-1">
					<span>Progress</span>
					<span>{Math.round(percentage)}%</span>
				</div>
			)}
			<div className={`w-full bg-slate-700 rounded-full overflow-hidden ${sizeClass}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
				<div 
					className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500 ease-out"
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}

export function Tooltip({ children, content, position = 'top' }: {
	children: React.ReactNode;
	content: string;
	position?: 'top' | 'bottom' | 'left' | 'right';
}) {
	const [isVisible, setIsVisible] = useState(false);
	
	const positionClasses = {
		top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
		bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
		left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
		right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
	};
	
	return (
		<div 
			className="relative inline-block"
			onMouseEnter={() => setIsVisible(true)}
			onMouseLeave={() => setIsVisible(false)}
		>
			{children}
			{isVisible && (
				<div className={`absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap ${positionClasses[position]}`}>
					{content}
					<div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
						position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
						position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
						position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
						'right-full top-1/2 -translate-y-1/2 -mr-1'
					}`} />
				</div>
			)}
		</div>
	);
} 