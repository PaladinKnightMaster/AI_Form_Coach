// Lightweight analytics wrapper for Umami and custom event tracking
type EventData = Record<string, string | number | boolean>;

interface UmamiWindow extends Window {
	umami?: ((eventName: string, eventData?: EventData) => void) & {
		track?: (eventName: string, eventData?: EventData) => void;
	};
}

declare const window: UmamiWindow;

// Page visit tracking
export function trackPageView(path: string, title?: string) {
	try {
		// Umami automatically tracks page views, but we can send custom data
		if (typeof window !== 'undefined' && window.umami) {
			const eventData: EventData = { path };
			if (title) eventData.title = title;
			
			if (typeof window.umami === 'function') {
				window.umami('page-view', eventData);
			}
		}
	} catch (error) {
		console.debug('Analytics tracking failed:', error);
	}
}

// Custom event tracking
export function trackEvent(eventName: string, properties?: EventData) {
	try {
		if (typeof window !== 'undefined' && window.umami) {
			if (typeof window.umami === 'function') {
				window.umami(eventName, properties);
			}
		}
		
		// Also log to console in development
		if (process.env.NODE_ENV === 'development') {
			console.debug('📊 Event:', eventName, properties);
		}
	} catch (error) {
		console.debug('Analytics tracking failed:', error);
	}
}

// Specific event trackers for common actions
export const analytics = {
	// Landing page interactions
	landingView: () => trackEvent('landing-view'),
	ctaClick: (location: string) => trackEvent('cta-click', { location }),
	
	// Authentication flows
	signInAttempt: (method: 'password' | 'magic-link') => trackEvent('signin-attempt', { method }),
	signInSuccess: (method: 'password' | 'magic-link') => trackEvent('signin-success', { method }),
	signUpAttempt: (method: 'password' | 'magic-link') => trackEvent('signup-attempt', { method }),
	signUpSuccess: (method: 'password' | 'magic-link') => trackEvent('signup-success', { method }),
	
	// Core app usage
	coachSessionStart: (exercise: string) => trackEvent('coach-session-start', { exercise }),
	coachSessionEnd: (exercise: string, reps: number, duration: number) => 
		trackEvent('coach-session-end', { exercise, reps, duration }),
	historyView: () => trackEvent('history-view'),
	dataExport: (format: string) => trackEvent('data-export', { format }),
	
	// Pricing and subscriptions
	pricingView: () => trackEvent('pricing-view'),
	checkoutStart: (plan: string) => trackEvent('checkout-start', { plan }),
	subscriptionSuccess: (plan: string) => trackEvent('subscription-success', { plan }),
	
	// Feature usage
	calibrationOpen: () => trackEvent('calibration-open'),
	voiceToggle: (enabled: boolean) => trackEvent('voice-toggle', { enabled }),
	themeToggle: (theme: string) => trackEvent('theme-toggle', { theme }),
	
	// Help and support
	faqExpand: (question: string) => trackEvent('faq-expand', { question }),
	privacyView: () => trackEvent('privacy-view'),
	termsView: () => trackEvent('terms-view'),
};

// Hook for page view tracking in React components
export function usePageTracking(pageName: string) {
	if (typeof window !== 'undefined') {
		trackPageView(window.location.pathname, pageName);
	}
} 