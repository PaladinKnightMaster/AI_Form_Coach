# Stripe Products Setup Guide

## 1. Create Products in Stripe Dashboard

### Pro Monthly Subscription
- **Name**: AI Form Coach Pro (Monthly)
- **Description**: Monthly subscription to AI Form Coach Pro features
- **Price**: $9.99 USD
- **Billing**: Recurring monthly
- **Copy Price ID**: `price_xxxxx`

### Pro Yearly Subscription  
- **Name**: AI Form Coach Pro (Yearly)
- **Description**: Yearly subscription to AI Form Coach Pro features
- **Price**: $99.99 USD
- **Billing**: Recurring yearly
- **Copy Price ID**: `price_xxxxx`

### Founder One-time Payment
- **Name**: AI Form Coach Founder
- **Description**: Lifetime access to all AI Form Coach features
- **Price**: $299.00 USD
- **Billing**: One-time payment
- **Copy Price ID**: `price_xxxxx`

## 2. Set Up Webhook Endpoint

### Webhook URL
```
https://yourdomain.com/api/stripe-webhook
```

### Events to Listen For
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Webhook Secret
Copy the webhook signing secret: `whsec_xxxxx`

## 3. Environment Variables

Add these to your `.env.local`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Price IDs
STRIPE_PRICE_MONTHLY_ID=price_xxxxx
STRIPE_PRICE_YEARLY_ID=price_xxxxx
STRIPE_PRICE_FOUNDER_ID=price_xxxxx
```

## 4. Test the Integration

1. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

2. Test webhook locally with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```

3. Verify subscription status updates in your app
