import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
	const sig = req.headers.get('stripe-signature') as string;
	const secret = process.env.STRIPE_WEBHOOK_SECRET as string;
	if (!secret || !process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
		return NextResponse.json({ error: 'Not configured' }, { status: 400 });
	}
	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
	const raw = await req.text();
	let event: Stripe.Event;
	try {
		event = stripe.webhooks.constructEvent(raw, sig, secret);
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
	}
	const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
	try {
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;
				if (session.customer) {
					const customer = typeof session.customer === 'string' ? await stripe.customers.retrieve(session.customer) : session.customer;
					const userId = (customer as Stripe.Customer).metadata?.user_id;
					if (userId) {
						// Check if this is a Creator Pack purchase
						if (session.metadata?.type === 'creator_pack_purchase') {
							const packId = session.metadata?.packId;
							if (packId) {
								// Record the Creator Pack purchase
								await sb.from('coach_pack_purchases').insert({
									user_id: userId,
									coach_pack_id: packId,
									amount: session.amount_total || 0,
									currency: session.currency || 'usd',
									stripe_payment_intent_id: session.payment_intent as string,
									status: 'completed'
								});
							}
						} else {
							// Handle subscription purchases
							const tier = session.metadata?.tier || 'pro';
							
							// Insert or update user subscription
							await sb.from('user_subscriptions').upsert({
								user_id: userId,
								tier: tier,
								status: 'active',
								stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
								current_period_start: new Date().toISOString(),
								current_period_end: tier === 'founder' ? null : new Date(Date.now() + (tier === 'pro' ? 30 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000)).toISOString()
							}, {
								onConflict: 'user_id'
							});
						}
					}
				}
				break;
			}
			case 'customer.subscription.updated':
			case 'customer.subscription.created': {
				const sub = event.data.object as Stripe.Subscription;
				const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
				if (customerId) {
					const customer = await stripe.customers.retrieve(customerId);
					const userId = (customer as Stripe.Customer).metadata?.user_id;
					if (userId) {
						// Update user subscription
						await sb.from('user_subscriptions').upsert({
							user_id: userId,
							tier: 'pro',
							status: sub.status,
							stripe_subscription_id: sub.id,
							stripe_customer_id: customerId,
							current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
							current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
							cancel_at_period_end: sub.cancel_at_period_end
						}, {
							onConflict: 'user_id'
						});
					}
				}
				break;
			}
			case 'customer.subscription.deleted': {
				const sub = event.data.object as Stripe.Subscription;
				const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
				if (customerId) {
					const customer = await stripe.customers.retrieve(customerId);
					const userId = (customer as Stripe.Customer).metadata?.user_id;
					if (userId) {
						// Update subscription status to canceled
						await sb.from('user_subscriptions').update({
							status: 'canceled',
							current_period_end: new Date().toISOString()
						}).eq('user_id', userId);
					}
				}
				break;
			}
			default:
				break;
		}
		return NextResponse.json({ received: true });
	} catch (err) {
		console.error('Webhook handler error:', err);
		return NextResponse.json({ 
			error: 'Handler failed',
			details: process.env.NODE_ENV === 'development' ? String(err) : undefined
		}, { status: 500 });
	}
}

// Config for webhook body parsing
export const runtime = 'nodejs'; 