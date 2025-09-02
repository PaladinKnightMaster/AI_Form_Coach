"use client";
import { useEffect, useState } from 'react';

export default function SafetyChecklist({ open, onAgree, onClose }: { open: boolean; onAgree: () => void; onClose: () => void }) {
	const [dontShow, setDontShow] = useState(false);
	if (!open) return null;
	return (
		<div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
			<div className="bg-white text-black rounded-xl p-4 max-w-lg w-full">
				<div className="flex items-center justify-between mb-2"><h2 className="text-lg font-semibold">Quick safety check</h2><button aria-label="Close" onClick={onClose}>×</button></div>
				<ul className="text-sm space-y-1 mb-3 list-disc pl-5">
					<li>Train in a clear space with no trip hazards</li>
					<li>Warm up for 3–5 minutes before heavy sets</li>
					<li>Stop immediately if you feel pain or dizziness</li>
				</ul>
				<label className="text-sm flex items-center gap-2 mb-3"><input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} /> Don’t show again</label>
				<div className="flex items-center gap-2">
					<button className="px-3 py-2 rounded bg-black text-white" onClick={() => { if (dontShow) try { localStorage.setItem('afc_safety_ok', '1'); } catch {}; onAgree(); }}>I understand</button>
					<button className="px-3 py-2 rounded border" onClick={onClose}>Cancel</button>
				</div>
			</div>
		</div>
	);
} 