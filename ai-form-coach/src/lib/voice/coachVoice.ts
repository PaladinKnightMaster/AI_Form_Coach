let muted = false;
let speechReady = false;
let initAttempted = false;

export function setMuted(isMuted: boolean) {
	muted = isMuted;
}

export function ensureSpeechReady() {
	if (typeof window === 'undefined') return;
	const synth = window.speechSynthesis;
	if (!synth) return;
	if (speechReady) return;
	if (initAttempted) return;
	initAttempted = true;

	const finalize = () => { speechReady = true; };
	try {
		const voices = synth.getVoices();
		if (voices && voices.length > 0) {
			finalize();
			return;
		}
		// Some browsers (Safari/iOS) populate voices asynchronously
		if (typeof synth.addEventListener === 'function') {
			synth.addEventListener('voiceschanged', () => finalize(), { once: true });
		}
		// Warm up with a silent utterance to unlock speech on gesture-gated browsers
		const u = new SpeechSynthesisUtterance(' ');
		u.volume = 0;
		u.rate = 1.0;
		synth.speak(u);
	} catch {
		// ignore — speech may still work without voice list
	}
}

export function speak(text: string) {
	if (muted) return;
	if (typeof window === 'undefined') return;
	const synth = window.speechSynthesis;
	if (!synth) return;

	// Always attempt initialization on first speak
	ensureSpeechReady();

	try {
		const utter = new SpeechSynthesisUtterance(text);
		utter.rate = 1.0;

		// Chrome can stall if the queue backs up — cancel pending speech
		// so the latest cue is always heard promptly
		try {
			if (synth.speaking || synth.pending) {
				synth.cancel();
			}
		} catch {
			// cancel() can throw on some browsers — safe to ignore
		}

		synth.speak(utter);
	} catch {
		// Speech synthesis unavailable — fail silently
	}
}
