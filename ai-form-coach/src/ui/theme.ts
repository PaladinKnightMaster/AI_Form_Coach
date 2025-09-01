export const theme = {
	color: {
		bg: {
			base: 'var(--bg)',
			muted: 'var(--bg-muted)'
		},
		fg: {
			base: 'var(--fg)',
			muted: 'var(--fg-muted)'
		},
		brand: 'var(--brand)',
		accent: 'var(--accent)',
		border: 'var(--border)',
		positive: '#16a34a',
		warning: '#f59e0b',
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