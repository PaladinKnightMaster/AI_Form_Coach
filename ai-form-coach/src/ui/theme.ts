/**
 * @deprecated Design tokens now live in globals.css @theme block (Tailwind v4 CSS-first).
 * This file is kept for backward compatibility with components that import it directly.
 * New code should use Tailwind classes: bg-surface, text-brand, rounded-token-md, shadow-lg, etc.
 * See docs/design/DESIGN_SYSTEM.md for the full token reference.
 *
 * Carriage v2 — legacy literals updated to brand range (malachite + oxblood).
 */
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
		accent: '#0E6F5C',          // was '#3b82f6' · now Carriage malachite
		border: 'var(--color-border)',
		positive: 'var(--color-success)',
		warning: 'var(--color-warning)',
		critical: '#5A1F24'         // was '#ef4444' · now Carriage oxblood
	},
	type: {
		font: 'var(--font-sans), system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
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
