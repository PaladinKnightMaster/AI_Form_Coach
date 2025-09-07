"use client";
import { useEffect, useState } from 'react';

function getSystemPref(): 'light' | 'dark' {
	if (typeof window === 'undefined') return 'light';
	return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function ThemeToggle() {
	const [theme, setTheme] = useState<'light' | 'dark'>('light');
	useEffect(() => {
		try {
			const stored = localStorage.getItem('afc_theme') as 'light' | 'dark' | null;
			const next = stored || getSystemPref();
			setTheme(next);
			const root = document.documentElement; root.dataset.theme = next;
		} catch {}
	}, []);
	useEffect(() => {
		const root = document.documentElement;
		root.dataset.theme = theme;
		try { localStorage.setItem('afc_theme', theme); } catch {}
	}, [theme]);
	useEffect(() => {
		const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
		const handler = () => { try { const stored = localStorage.getItem('afc_theme'); if (!stored) setTheme(getSystemPref()); } catch {} };
		mq?.addEventListener?.('change', handler);
		return () => mq?.removeEventListener?.('change', handler);
	}, []);
	return (
		<button aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-md px-2 py-1 text-sm border">
			{theme === 'dark' ? 'Light' : 'Dark'}
		</button>
	);
} 