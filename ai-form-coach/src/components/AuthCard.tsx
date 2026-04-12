import Link from 'next/link';

interface AuthCardProps {
	title: string;
	children: React.ReactNode;
}

export default function AuthCard({ title, children }: AuthCardProps) {
	return (
		<div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
			<div className="w-full max-w-md">
				<div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-2xl space-y-6">
					<div className="text-center">
						<h1 className="text-3xl font-bold tracking-tight text-white mb-2">{title}</h1>
						<p className="text-sm font-medium text-slate-400">Private, real-time form coaching</p>
					</div>
					{children}
					<div className="text-xs text-slate-500 text-center pt-2">
						By continuing, you agree to our{' '}
						<Link href="/privacy" className="text-slate-400 hover:text-white transition-colors underline decoration-slate-600 hover:decoration-white">Privacy Policy</Link>
						{' '}and{' '}
						<Link href="/terms" className="text-slate-400 hover:text-white transition-colors underline decoration-slate-600 hover:decoration-white">Terms of Service</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
