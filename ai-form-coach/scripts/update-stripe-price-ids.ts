#!/usr/bin/env tsx

/**
 * Update Stripe Price IDs in subscription plans
 * Run this after setting up your Stripe products to link them to your database
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateStripePriceIds() {
  console.log('🔄 Updating Stripe Price IDs in subscription plans...\n');

  try {
    // Update Pro Monthly plan with Stripe Price ID
    const monthlyPriceId = process.env.STRIPE_PRICE_MONTHLY_ID;
    if (monthlyPriceId) {
      const { error: monthlyError } = await supabase
        .from('subscription_plans')
        .update({ stripe_price_id_monthly: monthlyPriceId })
        .eq('tier', 'pro')
        .eq('price_monthly', 799); // $7.99

      if (monthlyError) {
        console.error('❌ Error updating monthly price ID:', monthlyError);
      } else {
        console.log('✅ Updated Pro Monthly plan with Price ID:', monthlyPriceId);
      }
    } else {
      console.log('⚠️  STRIPE_PRICE_MONTHLY_ID not found in environment variables');
    }

    // Update Pro Yearly plan with Stripe Price ID
    const yearlyPriceId = process.env.STRIPE_PRICE_YEARLY_ID;
    if (yearlyPriceId) {
      const { error: yearlyError } = await supabase
        .from('subscription_plans')
        .update({ stripe_price_id_yearly: yearlyPriceId })
        .eq('tier', 'pro')
        .eq('price_yearly', 7999); // $79.99

      if (yearlyError) {
        console.error('❌ Error updating yearly price ID:', yearlyError);
      } else {
        console.log('✅ Updated Pro Yearly plan with Price ID:', yearlyPriceId);
      }
    } else {
      console.log('⚠️  STRIPE_PRICE_YEARLY_ID not found in environment variables');
    }

    // Update Founder plan with Stripe Price ID
    const founderPriceId = process.env.STRIPE_PRICE_FOUNDER_ID;
    if (founderPriceId) {
      const { error: founderError } = await supabase
        .from('subscription_plans')
        .update({ 
          stripe_price_id_monthly: founderPriceId, // Using monthly field for one-time payment
          price_monthly: 19900 // $199.00 in cents
        })
        .eq('tier', 'founder');

      if (founderError) {
        console.error('❌ Error updating founder price ID:', founderError);
      } else {
        console.log('✅ Updated Founder plan with Price ID:', founderPriceId);
      }
    } else {
      console.log('⚠️  STRIPE_PRICE_FOUNDER_ID not found in environment variables');
    }

    // Verify the updates
    console.log('\n📋 Current subscription plans:');
    const { data: plans, error: fetchError } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('tier');

    if (fetchError) {
      console.error('❌ Error fetching plans:', fetchError);
    } else {
      plans?.forEach(plan => {
        console.log(`\n${plan.name} (${plan.tier}):`);
        if (plan.price_monthly !== null) {
          console.log(`  Monthly: $${(plan.price_monthly || 0) / 100} - ${plan.stripe_price_id_monthly || 'No Price ID'}`);
        }
        if (plan.price_yearly !== null) {
          console.log(`  Yearly: $${(plan.price_yearly || 0) / 100} - ${plan.stripe_price_id_yearly || 'No Price ID'}`);
        }
        if (plan.tier === 'founder' && plan.stripe_price_id_monthly) {
          console.log(`  One-time: $199 - ${plan.stripe_price_id_monthly}`);
        }
      });
    }

    console.log('\n🎉 Stripe Price ID update completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Test subscription checkout flow');
    console.log('   2. Verify webhook handling');
    console.log('   3. Test subscription status API');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the update
updateStripePriceIds();
