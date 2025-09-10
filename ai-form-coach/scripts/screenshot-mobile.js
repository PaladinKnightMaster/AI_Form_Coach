/**
 * Mobile Screenshot Automation Script
 * 
 * This script helps automate mobile screenshot capture for visual QA.
 * Run with: node scripts/screenshot-mobile.js
 * 
 * Requirements:
 * - npm install puppeteer
 * - Local development server running (npm run dev)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BREAKPOINTS = [
	{ name: 'mobile-portrait', width: 375, height: 667, device: 'iPhone SE' },
	{ name: 'mobile-landscape', width: 667, height: 375, device: 'iPhone SE Landscape' },
	{ name: 'large-mobile', width: 414, height: 896, device: 'iPhone 11 Pro' },
	{ name: 'tablet-portrait', width: 768, height: 1024, device: 'iPad' },
	{ name: 'tablet-landscape', width: 1024, height: 768, device: 'iPad Landscape' },
	{ name: 'desktop', width: 1280, height: 800, device: 'Desktop' }
];

const PAGES_TO_TEST = [
	{ path: '/', name: 'landing' },
	{ path: '/signin', name: 'signin' },
	{ path: '/signup', name: 'signup' },
	{ path: '/coach', name: 'coach' },
	{ path: '/demo', name: 'component-demo' }
];

async function captureScreenshots() {
	const browser = await puppeteer.launch({ 
		headless: false, // Set to true for CI/automated runs
		defaultViewport: null 
	});
	
	const outputDir = path.join(__dirname, '..', 'screenshots');
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	console.log('🚀 Starting screenshot capture...');

	for (const page of PAGES_TO_TEST) {
		console.log(`\n📱 Capturing ${page.name} page...`);
		
		for (const breakpoint of BREAKPOINTS) {
			console.log(`  📸 ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`);
			
			const browserPage = await browser.newPage();
			await browserPage.setViewport({
				width: breakpoint.width,
				height: breakpoint.height,
				deviceScaleFactor: 1
			});

			try {
				// Navigate to page
				await browserPage.goto(`http://localhost:3000${page.path}`, {
					waitUntil: 'networkidle0',
					timeout: 10000
				});

				// Wait for any animations to complete
				await browserPage.waitForTimeout(1000);

				// Take screenshot
				const filename = `${page.name}_${breakpoint.name}.png`;
				const filepath = path.join(outputDir, filename);
				
				await browserPage.screenshot({
					path: filepath,
					fullPage: true
				});

				console.log(`    ✅ Saved: ${filename}`);
			} catch (error) {
				console.log(`    ❌ Failed: ${error.message}`);
			}

			await browserPage.close();
		}
	}

	await browser.close();
	console.log('\n🎉 Screenshot capture complete!');
	console.log(`📁 Screenshots saved to: ${outputDir}`);
}

// Run if called directly
if (require.main === module) {
	captureScreenshots().catch(console.error);
}

module.exports = { captureScreenshots, BREAKPOINTS, PAGES_TO_TEST };
