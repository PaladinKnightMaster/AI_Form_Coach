import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'cdn.pixabay.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'pixabay.com',
				port: '',
				pathname: '/**',
			},
		],
	},
	headers: async () => [
		{
			source: '/manifest.webmanifest',
			headers: [{ key: 'Content-Type', value: 'application/manifest+json' }],
		},
	],
};

export default nextConfig;
