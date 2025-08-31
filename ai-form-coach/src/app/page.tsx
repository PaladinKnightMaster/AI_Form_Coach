import Link from 'next/link';

export default function Home() {
	return (
		<main className="min-h-screen grid place-items-center p-8">
			<div className="text-center space-y-6">
				<h1 className="text-5xl font-extrabold">AI Form Coach</h1>
				<p className="opacity-80 max-w-xl mx-auto">Real-time, private, in-browser form feedback using MediaPipe Pose. Choose an exercise and start a guided session with rep counting and cues.</p>
				<div className="flex items-center justify-center gap-3">
					<Link href="/coach" className="rounded-lg bg-black text-white px-6 py-3 text-lg">Start Session</Link>
					<Link href="/history" className="rounded-lg border px-6 py-3 text-lg">History</Link>
				</div>
			</div>
		</main>
	);
}
