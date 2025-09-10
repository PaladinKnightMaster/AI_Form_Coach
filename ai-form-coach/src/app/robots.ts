import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aiformcoach.com';
	
	return {
		rules: {
			userAgent: '*',
			allow: '/',
			disallow: [
				'/account',
				'/auth/',
				'/api/',
				'/reset-password',
				'/_next/',
				'/admin/',
			],
		},
		sitemap: `${baseUrl}/sitemap.xml`,
	};
} 