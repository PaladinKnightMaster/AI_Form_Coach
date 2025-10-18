import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { creatorPacksService } from '@/lib/creator-packs/service';

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServiceClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { packId } = await request.json();
    
    if (!packId) {
      return NextResponse.json({ error: 'Pack ID is required' }, { status: 400 });
    }
    
    // Check if user already purchased this pack
    const hasPurchased = await creatorPacksService.hasUserPurchasedPack(packId, user.id);
    
    if (hasPurchased) {
      return NextResponse.json({ error: 'Pack already purchased' }, { status: 400 });
    }
    
    // Get pack details
    const { data: pack, error: packError } = await supabase
      .from('coach_packs')
      .select('*')
      .eq('id', packId)
      .eq('is_active', true)
      .single();
    
    if (packError || !pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
    }
    
    // Create Stripe checkout session
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: pack.currency.toLowerCase(),
            product_data: {
              name: pack.title,
              description: pack.short_description || pack.description,
            },
            unit_amount: pack.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/creator-packs/${packId}?purchase=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/creator-packs/${packId}?purchase=cancelled`,
      metadata: {
        packId: packId,
        userId: user.id,
        type: 'creator_pack_purchase'
      },
    });
    
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Creator pack purchase API error:', error);
    return NextResponse.json(
      { error: 'Failed to process purchase' },
      { status: 500 }
    );
  }
}
