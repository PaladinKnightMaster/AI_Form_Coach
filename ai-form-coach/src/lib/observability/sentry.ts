import * as Sentry from '@sentry/browser';

let initialized = false;

export function initSentry() {
	if (initialized) return;
	const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN as string | undefined;
	if (!dsn) return;
	Sentry.init({
		dsn,
		tracesSampleRate: 0,
		replaysSessionSampleRate: 0,
		replaysOnErrorSampleRate: 0,
		environment: process.env.NODE_ENV,
		release: (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA as string | undefined) || undefined,
	});
	initialized = true;
}

export { Sentry }; 