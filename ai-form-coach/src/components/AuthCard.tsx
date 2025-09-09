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
					<Link href="/" className="font-extrabold tracking-tight text-2xl">
						AI Form Coach
					</Link>
				</div>
				<div className="card p-8 space-y-6">
					<div className="text-center">
						<h1 className="text-2xl font-semibold mb-2">{title}</h1>
						<p className="text-sm opacity-80">Private, real-time form coaching</p>
					</div>
					{children}
					<div className="text-xs opacity-70 text-center">
						By continuing, you agree to our{' '}
						<Link href="/privacy" className="underline hover:no-underline">Privacy Policy</Link>
						{' '}and{' '}
						<Link href="/terms" className="underline hover:no-underline">Terms of Service</Link>
					</div>
				</div>
			</div>
		</div>
	);
} 