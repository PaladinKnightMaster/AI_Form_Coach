import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const title = searchParams.get('title') || 'AI Form Coach';
		const subtitle = searchParams.get('subtitle') || 'Real-time AI Form Coaching — right in your browser';

		return new ImageResponse(
			(
				<div
					style={{
						height: '100%',
						width: '100%',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: '#0f172a',
						backgroundImage: 'radial-gradient(circle at 25% 25%, #22c55e22 0%, transparent 50%), radial-gradient(circle at 75% 75%, #3b82f622 0%, transparent 50%)',
					}}
				>
					{/* Main content */}
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							textAlign: 'center',
							maxWidth: '900px',
							padding: '0 60px',
						}}
					>
						{/* Brand wordmark */}
						<h1
							style={{
								fontSize: '72px',
								fontWeight: 800,
								color: '#ffffff',
								margin: '0 0 24px 0',
								letterSpacing: '-0.025em',
								lineHeight: 1.1,
							}}
						>
							{title}
						</h1>

						{/* Value proposition */}
						<p
							style={{
								fontSize: '32px',
								color: '#cbd5e1',
								margin: '0 0 40px 0',
								fontWeight: 400,
								lineHeight: 1.3,
								maxWidth: '800px',
							}}
						>
							{subtitle}
						</p>

						{/* Trust badges */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '32px',
								color: '#22c55e',
								fontSize: '18px',
								fontWeight: 500,
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<div style={{ width: '16px', height: '16px', backgroundColor: '#22c55e', borderRadius: '50%' }} />
								Private by design
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<div style={{ width: '16px', height: '16px', backgroundColor: '#22c55e', borderRadius: '50%' }} />
								Works offline
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<div style={{ width: '16px', height: '16px', backgroundColor: '#22c55e', borderRadius: '50%' }} />
								No video uploads
							</div>
						</div>
					</div>

					{/* Subtle skeleton overlay */}
					<div
						style={{
							position: 'absolute',
							right: '60px',
							bottom: '60px',
							opacity: 0.1,
							display: 'flex',
						}}
					>
						<svg width="120" height="120" viewBox="0 0 120 120" fill="none">
							<circle cx="40" cy="30" r="4" fill="#22c55e" />
							<circle cx="60" cy="50" r="4" fill="#22c55e" />
							<circle cx="80" cy="70" r="4" fill="#22c55e" />
							<circle cx="70" cy="35" r="4" fill="#22c55e" />
							<circle cx="90" cy="55" r="4" fill="#22c55e" />
							<line x1="40" y1="30" x2="60" y2="50" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
							<line x1="60" y1="50" x2="80" y2="70" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
							<line x1="40" y1="30" x2="70" y2="35" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
							<line x1="70" y1="35" x2="90" y2="55" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
						</svg>
					</div>
				</div>
			),
			{
				width: 1200,
				height: 630,
			}
		);
	} catch (e) {
		console.error('Failed to generate OG image:', e);
		return new Response('Failed to generate image', { status: 500 });
	}
} 