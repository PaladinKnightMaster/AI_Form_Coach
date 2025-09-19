import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'jsdom',
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
		},
	},
	css: {
		modules: {
			classNameStrategy: 'non-scoped',
		},
	},
}); 