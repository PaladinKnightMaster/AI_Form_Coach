import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
	try {
		const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
		const body = await req.json().catch(() => ({} as Record<string, unknown>));
		const cycle = (body?.cycle as 'monthly'|'yearly'|undefined) ?? 'monthly';
		const userId = (body?.userId as string | undefined) ?? undefined;
		const explicitPrice = (body?.priceId as string | undefined) ?? undefined;
		const mappedByCycle = cycle === 'yearly' ? (process.env.STRIPE_PRICE_YEARLY_ID || '') : (process.env.STRIPE_PRICE_MONTHLY_ID || '');
		const fallback = process.env.STRIPE_PRICE_ID || '';
		const priceId = explicitPrice || mappedByCycle || fallback;
		if (!process.env.STRIPE_SECRET_KEY || !priceId) {
			return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
		}
		const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

		// Ensure Stripe customer for this user
		let customerId: string | undefined = undefined;
		if (userId && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
			const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
			const { data: prof } = await sb.from('profiles').select('stripe_customer_id').eq('id', userId).maybeSingle();
			customerId = prof?.stripe_customer_id || undefined;
			if (!customerId) {
				const customer = await stripe.customers.create({ metadata: { user_id: userId } });
				customerId = customer.id;
				await sb.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
			}
		}

		const session = await stripe.checkout.sessions.create({
			mode: 'subscription',
			customer: customerId,
			line_items: [{ price: priceId, quantity: 1 }],
			success_url: `${origin}/pricing/success`,
			cancel_url: `${origin}/pricing/cancel`,
			allow_promotion_codes: true,
		});
		return NextResponse.json({ url: session.url });
	} catch (e) {
		return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
	}
} 