import Link from 'next/link';

interface AuthCardProps {
	title: string;
	children: React.ReactNode;
}

export default function AuthCard({ title, children }: AuthCardProps) {
	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<Link href="/" className="font-extrabold tracking-tight text-2xl text-slate-900 dark:text-white">
						AI Form Coach
					</Link>
				</div>
				<div className="rounded-xl border border-slate-200 bg-white p-8 shadow-lg space-y-6 dark:border-slate-700 dark:bg-slate-900">
					<div className="text-center">
						<h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">{title}</h1>
						<p className="text-sm text-slate-500 dark:text-slate-400">Private, real-time form coaching</p>
					</div>
					{children}
					<div className="text-xs text-slate-400 dark:text-slate-500 text-center">
						By continuing, you agree to our{' '}
						<Link href="/privacy" className="underline hover:no-underline text-slate-500 dark:text-slate-400">Privacy Policy</Link>
						{' '}and{' '}
						<Link href="/terms" className="underline hover:no-underline text-slate-500 dark:text-slate-400">Terms of Service</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
