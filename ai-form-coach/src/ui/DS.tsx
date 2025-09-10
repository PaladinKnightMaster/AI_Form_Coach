"use client";
import { ForwardedRef, forwardRef } from 'react';

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
	return <div className={`container ${className ?? ''}`}>{children}</div>;
}

export function Section({ children, className }: { children: React.ReactNode; className?: string }) {
	return <section className={`section ${className ?? ''}`}>{children}</section>;
}

export const Button = forwardRef(function Button(
	{ children, variant = 'primary', className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' },
	ref: ForwardedRef<HTMLButtonElement>
) {
	const base = 'btn inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
	const styles = variant === 'primary' ? 'btn-primary focus-visible:ring-[var(--color-primary)]'
		: variant === 'secondary' ? 'btn-secondary focus-visible:ring-[var(--color-border)]'
		: 'focus-visible:ring-[var(--color-border)]';
	return <button ref={ref} className={`${base} ${styles} ${className ?? ''}`} {...props}>{children}</button>;
});

export function Badge({ children, tone = 'success', className }: { children: React.ReactNode; tone?: 'success'|'warning'; className?: string }) {
	const styles = tone === 'success' ? 'badge badge-success' : 'badge badge-warning';
	return <span className={`${styles} ${className ?? ''}`}>{children}</span>;
}

export function Icon({ name, className }: { name: 'check'|'alert'|'moon'|'sun'|'activity'|'message'|'pause'|'chart'|'download'|'chevron-down'|'chevron-up'|'chevron-left'|'chevron-right'|'plus'|'search'|'x'; className?: string }) {
	const paths: Record<string, string> = {
		check: 'M5 13l4 4L19 7',
		alert: 'M12 9v4m0 4h.01M10.29 3.86l-7.98 13.8A2 2 0 004 20h16a2 2 0 001.69-3.14l-7.98-13.8a2 2 0 00-3.42 0z',
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
		x: 'M18 6L6 18M6 6l12 12'
	};
	return (
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
			<path d={paths[name]} strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
} 