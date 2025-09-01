"use client";
import { useEffect } from 'react';

export default function LogSilencer() {
	useEffect(() => {
		const block = (msg?: unknown) => typeof msg === 'string' && msg.includes('TensorFlow Lite XNNPACK delegate');
		const orig = { info: console.info, warn: console.warn, error: console.error };
		console.info = (...a: unknown[]) => { if (!block(a[0])) orig.info(...(a as [])); };
		console.warn = (...a: unknown[]) => { if (!block(a[0])) orig.warn(...(a as [])); };
		console.error = (...a: unknown[]) => { if (!block(a[0])) orig.error(...(a as [])); };
		return () => { console.info = orig.info; console.warn = orig.warn; console.error = orig.error; };
	}, []);
	return null;
} 