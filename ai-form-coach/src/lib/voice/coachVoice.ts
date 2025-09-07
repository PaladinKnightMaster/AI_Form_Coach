let muted = false;
let speechReady = false;

export function setMuted(isMuted: boolean) {
	muted = isMuted;
}

export function ensureSpeechReady() {
	if (typeof window === 'undefined') return;
	const synth = window.speechSynthesis;
	if (!synth) return;
	if (speechReady) return;
	const finalize = () => { speechReady = true; };
	try {
		// Attempt to load voices list
		const voices = synth.getVoices();
		if (voices && voices.length > 0) {
			finalize();
			return;
		}
		// Some browsers (Safari/iOS) require an event before voices populate
		synth.addEventListener?.('voiceschanged', () => finalize(), { once: true } as unknown as boolean);
		// Warm up with a silent utterance to unlock speech in some browsers
		const u = new SpeechSynthesisUtterance(' ');
		u.volume = 0;
		u.rate = 1.0;
		synth.speak(u);
	} catch {
		// ignore
	}
}

export function speak(text: string) {
	if (muted) return;
	if (typeof window === 'undefined') return;
	const synth = window.speechSynthesis;
	if (!synth) return;
	ensureSpeechReady();
	try {
		const utter = new SpeechSynthesisUtterance(text);
		utter.rate = 1.0;
		// Cancel any long queue so cues remain timely
		if ((synth as unknown as { pending?: boolean }).pending) {
			synth.cancel();
		}
		synth.speak(utter);
	} catch {
		// ignore
	}
} 