import Link from 'next/link';
import { Container, Button } from '@/ui/DS';

export default function FinalCTA() {
	return (
		<section className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
			<Container>
				<div className="section text-center space-y-6">
					<h2 className="font-extrabold text-white" style={{ fontSize: 'var(--step-3)' }}>
						Ready to improve your form?
					</h2>
					<p className="opacity-90 max-w-2xl mx-auto">
						Join thousands getting instant coaching without sharing video. Begin your first workout in seconds.
					</p>
					<div className="flex flex-wrap items-center justify-center gap-4">
							<Link href="/signin">
								<Button variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg">
									Start training
								</Button>
							</Link>
							<Link href="/signin">
								<Button variant="primary" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900">
									Sign in
								</Button>
							</Link>
					</div>
					<div className="text-sm opacity-80">
						No credit card required • Works offline • Privacy first
					</div>
				</div>
			</Container>
		</section>
	);
} 