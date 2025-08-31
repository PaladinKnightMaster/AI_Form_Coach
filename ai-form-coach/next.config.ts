import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	headers: async () => [
		{
			source: '/manifest.webmanifest',
			headers: [{ key: 'Content-Type', value: 'application/manifest+json' }],
		},
	],
};

export default nextConfig;
