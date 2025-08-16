# Production Stripe Setup Guide for Hydrogen

## Required Environment Variables

You need to set the following environment variables in your production deployment platform (Railway, Vercel, Cloudflare, etc.):

### 1. Stripe Keys (REQUIRED)
```bash
# Stripe Live Keys - Get these from https://dashboard.stripe.com/apikeys
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx

# Stripe Webhook Secret - Get this after creating webhook endpoint
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

### 2. Shopify Admin API (REQUIRED for order creation)
```bash
# These should already be set if Shopify integration is working
SHOPIFY_ADMIN_API_VERSION=2024-07
PRIVATE_ADMIN_API_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxx
```

## Step-by-Step Setup

### Step 1: Configure Stripe Webhook Endpoint

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.com/webhooks/stripe`
4. Select the following events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed` (optional, for future use)
5. Click "Add endpoint"
6. Copy the "Signing secret" that starts with `whsec_` - this is your `STRIPE_WEBHOOK_SECRET`

### Step 2: Set Environment Variables in Your Deployment Platform

#### For Railway:
1. Go to your Railway project
2. Click on your service
3. Go to "Variables" tab
4. Add each environment variable:
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

#### For Cloudflare Workers:
1. In your `wrangler.toml` file, add:
```toml
[vars]
# Don't put actual secrets here, use wrangler secret for sensitive data

# Use wrangler secret for these:
# wrangler secret put STRIPE_SECRET_KEY
# wrangler secret put STRIPE_WEBHOOK_SECRET
# wrangler secret put PRIVATE_ADMIN_API_ACCESS_TOKEN
```

2. Run these commands to set secrets:
```bash
wrangler secret put STRIPE_PUBLISHABLE_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

#### For Vercel:
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add each variable with "Production" environment selected

### Step 3: Verify Shopify Admin API Access

Ensure your Shopify Admin API token has the following permissions:
- `write_orders` - To create orders
- `read_products` - To fetch product information
- `write_draft_orders` (optional) - For draft order creation

You can verify this in your Shopify Admin:
1. Go to Settings > Apps and sales channels
2. Click on your private app
3. Check "Admin API permissions"

### Step 4: Test the Integration

After deployment, test the following:

1. **Test Stripe Connection:**
   - Add an item to cart
   - Go through checkout flow
   - Check that Stripe Elements loads properly

2. **Test Payment Processing:**
   - Use Stripe test cards in production (they'll fail but show connection works):
     - `4242 4242 4242 4242` - Should show "Test card detected"

3. **Test with Real Card:**
   - Make a small purchase with a real card
   - Verify:
     - Payment processes successfully
     - Order appears in Shopify admin
     - Customer receives order confirmation
     - Webhook creates proper order

### Step 5: Monitor and Debug

#### Check Webhook Delivery:
1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your endpoint
3. View "Webhook attempts" to see if events are being delivered
4. Check response codes (should be 200)

#### Common Issues and Solutions:

**Issue: "Stripe publishable key is missing"**
- Solution: Ensure `STRIPE_PUBLISHABLE_KEY` is set in environment variables
- Verify it starts with `pk_live_` for production

**Issue: Webhook returns 401/403**
- Solution: Check `STRIPE_WEBHOOK_SECRET` matches the one from Stripe dashboard
- Ensure it starts with `whsec_`

**Issue: Orders not appearing in Shopify**
- Solution: Check `PRIVATE_ADMIN_API_ACCESS_TOKEN` has write_orders permission
- Verify `SHOPIFY_ADMIN_API_VERSION` is set (use `2024-07` or latest)

**Issue: Payment succeeds but order fails**
- Check server logs for errors in `/api/stripe/process-order`
- Verify all Shopify environment variables are set correctly

### Step 6: Security Checklist

- [ ] Using LIVE keys (not test keys) in production
- [ ] Webhook endpoint is HTTPS only
- [ ] Webhook secret is properly configured
- [ ] Content Security Policy allows Stripe domains
- [ ] No keys are exposed in client-side code or git repository

## Environment Variable Reference

| Variable | Description | Where to Find | Example |
|----------|-------------|---------------|---------|
| `STRIPE_PUBLISHABLE_KEY` | Public key for Stripe.js | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) | `pk_live_51ABC...` |
| `STRIPE_SECRET_KEY` | Secret API key | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) | `sk_live_51ABC...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Webhook endpoint settings | `whsec_abc123...` |
| `PRIVATE_ADMIN_API_ACCESS_TOKEN` | Shopify Admin API token | Shopify Admin > Apps | `shpat_abc123...` |
| `SHOPIFY_ADMIN_API_VERSION` | API version to use | Use latest stable | `2024-07` |

## Testing Checklist

Before going fully live:

- [ ] Test checkout flow end-to-end
- [ ] Verify Stripe webhook is receiving events
- [ ] Confirm orders appear in Shopify admin
- [ ] Test with different payment methods
- [ ] Verify cart clears after successful payment
- [ ] Check order confirmation emails are sent
- [ ] Test on mobile devices
- [ ] Verify all prices are correct (especially $8 shipping)
- [ ] Test both campaign and regular products

## Support

- Stripe Support: https://support.stripe.com/
- Stripe API Docs: https://stripe.com/docs/api
- Shopify Admin API: https://shopify.dev/docs/api/admin
- Hydrogen Docs: https://shopify.dev/docs/custom-storefronts/hydrogen