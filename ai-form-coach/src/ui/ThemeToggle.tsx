"use client";
import { useEffect, useState } from 'react';

function getSystemPref(): 'light' | 'dark' {
	if (typeof window === 'undefined') return 'light';
	return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function ThemeToggle() {
	const [theme, setTheme] = useState<'light' | 'dark'>('light');
	const [mounted, setMounted] = useState(false);

	// Initialize theme on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem('afc_theme') as 'light' | 'dark' | null;
			const next = stored || getSystemPref();
			setTheme(next);
			applyTheme(next);
		} catch {}
		setMounted(true);
	}, []);

	// Apply theme changes
	useEffect(() => {
		if (mounted) {
			applyTheme(theme);
			try { 
				localStorage.setItem('afc_theme', theme); 
			} catch {}
		}
	}, [theme, mounted]);

	// Listen for system theme changes
	useEffect(() => {
		if (!mounted) return;
		
		const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
		const handler = () => { 
			try { 
				const stored = localStorage.getItem('afc_theme'); 
				if (!stored) {
					const systemTheme = getSystemPref();
					setTheme(systemTheme);
					applyTheme(systemTheme);
				}
			} catch {} 
		};
		mq?.addEventListener?.('change', handler);
		return () => mq?.removeEventListener?.('change', handler);
	}, [mounted]);

	const applyTheme = (newTheme: 'light' | 'dark') => {
		const root = document.documentElement;
		root.dataset.theme = newTheme;
		root.classList.remove('light', 'dark');
		root.classList.add(newTheme);
	};

	const toggleTheme = () => {
		const newTheme = theme === 'dark' ? 'light' : 'dark';
		setTheme(newTheme);
	};

	// Prevent hydration mismatch
	if (!mounted) {
		return (
			<button className="rounded-md px-2 py-1 text-sm border bg-gray-100 dark:bg-gray-800">
				Theme
			</button>
		);
	}

	return (
		<button 
			aria-label="Toggle theme" 
			onClick={toggleTheme} 
			className="rounded-md px-2 py-1 text-sm border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
		>
			{theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
		</button>
	);
} 