import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'jsdom',
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
		},
		// Exclude CSS processing for tests
		exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],
	},
	// Disable CSS processing for tests
	css: false,
	// Disable PostCSS processing
	esbuild: {
		target: 'node14',
	},
});
