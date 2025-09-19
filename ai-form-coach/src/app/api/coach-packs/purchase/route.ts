import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packId } = await req.json();

    if (!packId) {
      return NextResponse.json({ error: 'Pack ID is required' }, { status: 400 });
    }

    // Get coach pack details
    const { data: coachPack, error: packError } = await supabase
      .from('coach_packs')
      .select('*')
      .eq('id', packId)
      .eq('is_active', true)
      .single();

    if (packError || !coachPack) {
      return NextResponse.json({ error: 'Coach pack not found' }, { status: 404 });
    }

    // Check if user already owns this pack
    const { data: existingPurchase } = await supabase
      .from('coach_pack_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('coach_pack_id', packId)
      .single();

    if (existingPurchase) {
      return NextResponse.json({ error: 'You already own this coach pack' }, { status: 400 });
    }

    // Initialize Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });

    // Get or create Stripe customer
    let customerId: string;
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create Stripe checkout session
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: coachPack.currency.toLowerCase(),
            product_data: {
              name: coachPack.name,
              description: coachPack.description,
            },
            unit_amount: coachPack.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/coach-packs/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/coach-packs`,
      metadata: {
        user_id: user.id,
        coach_pack_id: packId,
        type: 'coach_pack_purchase',
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Coach pack purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase session' },
      { status: 500 }
    );
  }
}
