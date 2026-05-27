#!/usr/bin/env tsx

/**
 * Test script to verify subscription features are working correctly
 * Run with: npm run test:subscription
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { getSupabaseServiceClient } from '../src/lib/supabase/server';
import { subscriptionService } from '../src/lib/subscription/subscriptionService';

async function testSubscriptionFeatures() {
  console.log('🧪 Testing Subscription Features...\n');

  try {
    const supabase = getSupabaseServiceClient();

    // Test 1: Check if activity_likes table exists
    console.log('1. Testing activity_likes table...');
    const { data: _likesTable, error: likesError } = await supabase
      .from('activity_likes')
      .select('*')
      .limit(1);
    
    if (likesError && likesError.code === '42P01') {
      console.log('❌ activity_likes table does not exist');
      console.log('   Run the migration: supabase/migrations/05_social_community.sql');
    } else {
      console.log('✅ activity_likes table exists');
    }

    // Test 2: Check if activity_comments table exists
    console.log('\n2. Testing activity_comments table...');
    const { data: _commentsTable, error: commentsError } = await supabase
      .from('activity_comments')
      .select('*')
      .limit(1);
    
    if (commentsError && commentsError.code === '42P01') {
      console.log('❌ activity_comments table does not exist');
      console.log('   Run the migration: supabase/migrations/05_social_community.sql');
    } else {
      console.log('✅ activity_comments table exists');
    }

    // Test 3: Check if database functions exist
    console.log('\n3. Testing database functions...');
    const { data: _likeCount, error: likeCountError } = await supabase
      .rpc('get_activity_like_count', { activity_id_param: 'test-123' });
    
    if (likeCountError && likeCountError.code === '42883') {
      console.log('❌ get_activity_like_count function does not exist');
      console.log('   Run the migration: supabase/migrations/add_activity_social_features.sql');
    } else {
      console.log('✅ get_activity_like_count function exists');
    }

    // Test 4: Check subscription service
    console.log('\n4. Testing subscription service...');
    try {
      const freeFeatures = subscriptionService.getFeatureAccess('free');
      const proFeatures = subscriptionService.getFeatureAccess('pro');
      
      console.log('✅ Subscription service working');
      console.log(`   Free features: ${Object.values(freeFeatures).filter(Boolean).length} enabled`);
      console.log(`   Pro features: ${Object.values(proFeatures).filter(Boolean).length} enabled`);
    } catch (error) {
      console.log('❌ Subscription service error:', error);
    }

    // Test 5: Check if sessions table has required columns
    console.log('\n5. Testing sessions table columns...');
    const { data: _sessionColumns, error: sessionError } = await supabase
      .from('sessions')
      .select('is_public, quality_score')
      .limit(1);
    
    if (sessionError && sessionError.message.includes('column') && sessionError.message.includes('does not exist')) {
      console.log('❌ Sessions table missing required columns (is_public, quality_score)');
      console.log('   Run the migration: supabase/migrations/add_activity_social_features.sql');
    } else {
      console.log('✅ Sessions table has required columns');
    }

    console.log('\n🎉 Subscription features test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Run the database migration if any tables/functions are missing');
    console.log('2. Test the API endpoints manually or with the app');
    console.log('3. Verify Form IQ features show correct subscription status');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSubscriptionFeatures().catch(console.error);
