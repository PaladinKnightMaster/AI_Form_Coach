"use client";
import { useEffect, useRef, useState } from 'react';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
	return <section className={`rounded-xl border bg-white/80 dark:bg-white/5 ${className ?? ''}`}>{children}</section>;
}

export function Button({ children, onClick, variant = 'primary', className, ariaLabel }: { children: React.ReactNode; onClick?: () => void; variant?: 'primary'|'secondary'|'ghost'; className?: string; ariaLabel?: string }) {
	const base = 'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
	const styles = variant === 'primary' ? 'bg-black text-white hover:bg-gray-800 focus-visible:ring-black' : variant === 'secondary' ? 'bg-gray-200 hover:bg-gray-300 text-black focus-visible:ring-gray-400' : 'hover:bg-gray-100 text-black focus-visible:ring-gray-300';
	return <button aria-label={ariaLabel} onClick={onClick} className={`${base} ${styles} ${className ?? ''}`}>{children}</button>;
}

export function Input({ label, id, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
	return (
		<label className="grid gap-1 text-sm" htmlFor={id}>
			<span>{label}</span>
			<input id={id} {...props} className={`rounded-md border px-3 py-2 ${props.className ?? ''}`} />
		</label>
	);
}

export function Table({ columns, rows }: { columns: { key: string; header: string }[]; rows: Record<string, React.ReactNode>[] }) {
	return (
		<table className="w-full text-sm">
			<thead>
				<tr>{columns.map(c => <th key={c.key} scope="col" className="text-left py-2 border-b">{c.header}</th>)}</tr>
			</thead>
			<tbody>
				{rows.map((r, i) => (
					<tr key={i} className="border-b last:border-b-0">
						{columns.map(c => <td key={c.key} className="py-2">{r[c.key]}</td>)}
					</tr>
				))}
			</tbody>
		</table>
	);
}

export function Tabs({ items, active, onChange }: { items: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
	return (
		<div role="tablist" aria-label="Tabs" className="flex gap-2 border-b">
			{items.map(t => (
				<button key={t.id} role="tab" aria-selected={active===t.id} className={`px-3 py-2 text-sm ${active===t.id?'border-b-2 border-black font-medium':''}`} onClick={() => onChange(t.id)}>{t.label}</button>
			))}
		</div>
	);
}

export function Dialog({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: React.ReactNode }) {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => { if (!open) return; const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [open, onClose]);
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 grid place-items-center bg-black/60" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
			<div ref={ref} className="bg-white rounded-xl max-w-lg w-full p-4">
				<div className="flex items-center justify-between mb-2">
					<h2 id="dialog-title" className="text-lg font-semibold">{title}</h2>
					<button aria-label="Close" className="text-sm" onClick={onClose}>×</button>
				</div>
				{children}
			</div>
		</div>
	);
}

export function Drawer({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: React.ReactNode }) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
			<div className="absolute inset-0 bg-black/60" onClick={onClose} />
			<aside className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl p-4">
				<div className="flex items-center justify-between mb-2"><h2 className="text-lg font-semibold">{title}</h2><button aria-label="Close" onClick={onClose}>×</button></div>
				{children}
			</aside>
		</div>
	);
}

export function Toast({ message }: { message: string }) { return <div role="status" className="fixed bottom-4 right-4 bg-black text-white px-3 py-2 rounded-md shadow-lg">{message}</div>; }

export function EmptyState({ title, body, cta }: { title: string; body: string; cta?: React.ReactNode }) {
	return (
		<div className="border rounded-xl p-6 text-center">
			<h3 className="text-lg font-semibold mb-1">{title}</h3>
			<p className="opacity-80 mb-3">{body}</p>
			{cta}
		</div>
	);
}

export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
	return (
		<nav className="flex items-center gap-2" aria-label="Pagination">
			<Button variant="secondary" onClick={() => onPage(Math.max(1, page-1))} ariaLabel="Previous">Prev</Button>
			<span className="text-sm">{page} / {totalPages}</span>
			<Button variant="secondary" onClick={() => onPage(Math.min(totalPages, page+1))} ariaLabel="Next">Next</Button>
		</nav>
	);
} 