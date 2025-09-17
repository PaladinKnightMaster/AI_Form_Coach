"use client";
import { ForwardedRef, forwardRef } from 'react';

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
	return <div className={className ? `container ${className}` : 'container'}>{children}</div>;
}

export function Section({ children, className }: { children: React.ReactNode; className?: string }) {
	return <section className={className ? `section ${className}` : 'section'}>{children}</section>;
}

export const Button = forwardRef(function Button(
	{ children, variant = 'primary', className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' },
	ref: ForwardedRef<HTMLButtonElement>
) {
	const base = 'btn inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
	const styles = variant === 'primary' ? 'btn-primary focus-visible:ring-[var(--color-primary)]'
		: variant === 'secondary' ? 'btn-secondary focus-visible:ring-[var(--color-border)]'
		: 'focus-visible:ring-[var(--color-border)]';
	return <button ref={ref} className={className ? `${base} ${styles} ${className}` : `${base} ${styles}`} {...props}>{children}</button>;
});

export function Badge({ children, tone = 'success', className }: { children: React.ReactNode; tone?: 'success'|'warning'; className?: string }) {
	const styles = tone === 'success' ? 'badge badge-success' : 'badge badge-warning';
	return <span className={className ? `${styles} ${className}` : styles}>{children}</span>;
}

export function Icon({ name, className }: { name: 'check'|'alert'|'alert-circle'|'camera'|'moon'|'sun'|'activity'|'message'|'pause'|'chart'|'download'|'chevron-down'|'chevron-up'|'chevron-left'|'chevron-right'|'plus'|'search'|'x'|'target'|'trending-up'|'alert-triangle'|'calendar'|'clock'|'flame'|'zap'|'heart'|'star'|'trophy'|'bell'|'settings'|'user'|'home'|'menu'|'filter'|'edit'|'trash'|'save'|'refresh'|'play'|'stop'|'volume'|'volume-off'; className?: string }) {
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
		'volume-off': 'M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6'
	};
	return (
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className={className} suppressHydrationWarning>
			<path d={paths[name]} strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
} 