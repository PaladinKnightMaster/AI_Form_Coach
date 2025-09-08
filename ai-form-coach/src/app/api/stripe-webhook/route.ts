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
	} catch (e) {
		return new NextResponse(`Webhook Error: ${(e as Error).message}`, { status: 400 });
	}
	const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
	try {
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;
				if (session.customer) {
					const customer = typeof session.customer === 'string' ? await stripe.customers.retrieve(session.customer) : session.customer;
					const userId = (customer as Stripe.Customer).metadata?.user_id;
					if (userId) {
						await sb.from('profiles').update({ plan: 'pro' }).eq('id', userId);
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
						const renew = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
						await sb.from('profiles').update({ plan: 'pro', plan_renews_at: renew, stripe_customer_id: customerId }).eq('id', userId);
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
						await sb.from('profiles').update({ plan: 'free', plan_renews_at: null }).eq('id', userId);
					}
				}
				break;
			}
			default:
				break;
		}
		return NextResponse.json({ received: true });
	} catch (e) {
		return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
	}
}

export const config = { api: { bodyParser: false } } as unknown as Record<string, unknown>; 