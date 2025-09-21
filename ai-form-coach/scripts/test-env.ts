#!/usr/bin/env tsx

/**
 * Simple script to test if environment variables are loading correctly
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

console.log('🔍 Testing Environment Variables...\n');

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_PRICE_MONTHLY_ID',
  'STRIPE_PRICE_YEARLY_ID',
  'STRIPE_PRICE_FOUNDER_ID'
];

let allPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NOT FOUND`);
    allPresent = false;
  }
});

console.log(`\n${allPresent ? '🎉 All environment variables are loaded!' : '⚠️  Some environment variables are missing.'}`);

if (allPresent) {
  console.log('\n💡 You can now run: npm run update:stripe-ids');
} else {
  console.log('\n💡 Please check your .env.local file and ensure all required variables are present.');
}
