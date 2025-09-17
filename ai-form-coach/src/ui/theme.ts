export const theme = {
	color: {
		bg: {
			base: 'var(--color-surface)',
			muted: 'color-mix(in oklab, var(--color-surface) 85%, transparent)'
		},
		fg: {
			base: 'var(--color-text)',
			muted: 'color-mix(in oklab, var(--color-text) 60%, transparent)'
		},
		brand: 'var(--color-primary)',
		accent: '#3b82f6',
		border: 'var(--color-border)',
		positive: 'var(--color-success)',
		warning: 'var(--color-warning)',
		critical: '#ef4444'
	},
	type: {
		font: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji"',
		size: {
			sx: 12,
			sm: 14,
			md: 16,
			lg: 18,
			xl: 22,
			'2xl': 28
		},
		weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
		leading: { tight: 1.2, normal: 1.5 }
	},
	space: (n: number) => n * 8,
	radius: { xs: 4, sm: 8, md: 12, lg: 16, full: 999 },
	shadow: {
		sm: '0 1px 2px rgba(0,0,0,0.06)',
		md: '0 4px 16px rgba(0,0,0,0.08)',
		lg: '0 12px 28px rgba(0,0,0,0.12)'
	}
} as const;

export type Theme = typeof theme; 