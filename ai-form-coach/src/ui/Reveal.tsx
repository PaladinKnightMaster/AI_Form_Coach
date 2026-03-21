"use client";
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';

export default function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
	const ref = useRef<HTMLDivElement>(null);
	const reduceMotion = useReducedMotion();
	const [visible, setVisible] = useState(reduceMotion);

	useEffect(() => {
		if (reduceMotion) { setVisible(true); return; }
		const el = ref.current; if (!el) return;
		const io = new IntersectionObserver((entries) => {
			entries.forEach((e) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } });
		}, { threshold: 0.15 });
		io.observe(el);
		return () => io.disconnect();
	}, [reduceMotion]);

	if (reduceMotion) {
		return <div ref={ref}>{children}</div>;
	}

	return (
		<div ref={ref} style={{ transition: 'opacity 600ms ease, transform 600ms ease', transitionDelay: `${delay}ms`, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0px)' : 'translateY(12px)'}}>
			{children}
		</div>
	);
}
