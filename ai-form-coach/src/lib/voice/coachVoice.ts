let muted = false;

export function setMuted(isMuted: boolean) {
	muted = isMuted;
}

export function speak(text: string) {
	if (muted) return;
	if (typeof window === 'undefined') return;
	const synth = window.speechSynthesis;
	if (!synth) return;
	const utter = new SpeechSynthesisUtterance(text);
	utter.rate = 1.0;
	synth.cancel();
	synth.speak(utter);
} 