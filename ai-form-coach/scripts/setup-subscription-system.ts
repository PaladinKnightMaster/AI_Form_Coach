#!/usr/bin/env tsx

/**
 * Setup script for the complete subscription system
 * Run with: npm run setup:subscription
 */

import { getSupabaseServiceClient } from '../src/lib/supabase/server';

async function setupSubscriptionSystem() {
  console.log('🚀 Setting up AI Form Coach Subscription System...\n');

  try {
    const supabase = getSupabaseServiceClient();

    // 1. Check if subscription tables exist
    console.log('1. Checking subscription tables...');
    const { data: _tables, error: tablesError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .limit(1);

    if (tablesError && tablesError.code === '42P01') {
      console.log('❌ Subscription tables do not exist');
      console.log('   Please run the migration: supabase/migrations/08_analytics_monitoring.sql');
      return;
    }
    console.log('✅ Subscription tables exist');

    // 2. Check if default plans exist
    console.log('\n2. Checking subscription plans...');
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*');

    if (plansError) {
      console.log('❌ Error fetching subscription plans:', plansError);
      return;
    }

    console.log(`✅ Found ${plans?.length || 0} subscription plans:`);
    plans?.forEach(plan => {
      console.log(`   - ${plan.name} (${plan.tier}): $${(plan.price_monthly || 0) / 100}/month, $${(plan.price_yearly || 0) / 100}/year`);
    });

    // 3. Check environment variables
    console.log('\n3. Checking environment variables...');
    const requiredEnvVars = [
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PRICE_MONTHLY_ID',
      'STRIPE_PRICE_YEARLY_ID',
      'STRIPE_PRICE_FOUNDER_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('❌ Missing environment variables:');
      missingVars.forEach(varName => console.log(`   - ${varName}`));
      console.log('\n   Please add these to your .env.local file');
    } else {
      console.log('✅ All required environment variables are set');
    }

    // 4. Test subscription service
    console.log('\n4. Testing subscription service...');
    try {
      const { subscriptionService } = await import('../src/lib/subscription/subscriptionService');
      
      // Test feature access for different tiers
      const freeFeatures = subscriptionService.getFeatureAccess('free');
      const proFeatures = subscriptionService.getFeatureAccess('pro');
      const founderFeatures = subscriptionService.getFeatureAccess('founder');
      
      console.log('✅ Subscription service working');
      console.log(`   Free features: ${Object.values(freeFeatures).filter(Boolean).length} enabled`);
      console.log(`   Pro features: ${Object.values(proFeatures).filter(Boolean).length} enabled`);
      console.log(`   Founder features: ${Object.values(founderFeatures).filter(Boolean).length} enabled`);
    } catch (error) {
      console.log('❌ Subscription service error:', error);
    }

    // 5. Check webhook endpoint
    console.log('\n5. Checking webhook configuration...');
    const webhookUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log(`   Webhook URL: ${webhookUrl}/api/stripe-webhook`);
    console.log('   Make sure this URL is configured in your Stripe Dashboard');

    console.log('\n🎉 Subscription system setup check completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Create products in Stripe Dashboard (see scripts/setup-stripe-products.md)');
    console.log('2. Set up webhook endpoint in Stripe Dashboard');
    console.log('3. Add environment variables to .env.local');
    console.log('4. Test with Stripe test cards');
    console.log('5. Deploy and test in production');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupSubscriptionSystem().catch(console.error);
