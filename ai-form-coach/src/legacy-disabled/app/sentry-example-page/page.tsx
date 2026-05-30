"use client";
import * as Sentry from '@sentry/nextjs';

export default function SentryExamplePage() {
	function triggerError() {
		Sentry.captureException(new Error('Sentry example page test error'));
		alert('Sent a test error to Sentry');
	}
	return (
		<div className="p-6 space-y-3">
			<h1 className="text-2xl font-semibold">Sentry Example Page</h1>
			<p className="opacity-80">Click the button to send a test error to Sentry.</p>
			<button onClick={triggerError} className="px-3 py-2 rounded bg-black text-white">Trigger test error</button>
		</div>
	);
} 