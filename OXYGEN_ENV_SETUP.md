# Oxygen Environment Variables - Complete Setup

## Required Environment Variables for Production

Add these in your Shopify Admin > Hydrogen > Environments and variables:

### Core Shopify Variables (Usually Pre-configured)
```
PUBLIC_STOREFRONT_API_TOKEN=<your-token>
PUBLIC_STORE_DOMAIN=www.dohhh.shop
PUBLIC_CHECKOUT_DOMAIN=checkout.dohhh.shop
PUBLIC_STOREFRONT_ID=<your-storefront-id>
SESSION_SECRET=<your-session-secret>
```

### Shopify Admin API (For Order Creation)
```
PRIVATE_ADMIN_API_ACCESS_TOKEN=shpat_xxxxx
SHOPIFY_ADMIN_API_VERSION=2024-10
SHOPIFY_WEBHOOK_SECRET=<your-shopify-webhook-secret>
```

### Stripe Configuration
```
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx (or pk_test_xxxxx for testing)
STRIPE_SECRET_KEY=sk_live_xxxxx (or sk_test_xxxxx for testing)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

## How to Find Missing Values

### PUBLIC_CHECKOUT_DOMAIN
This is your Shopify checkout domain. It's typically:
- Format: `checkout.your-store.com` or `your-store.myshopify.com`
- For your store: likely `checkout.dohhh.shop` or `dohhh.myshopify.com`

### PUBLIC_STOREFRONT_ID
1. Go to Shopify Admin > Settings > Apps and sales channels
2. Click on "Hydrogen" 
3. The Storefront ID will be displayed there

### SESSION_SECRET
If not already set, generate a secure random string:
```bash
openssl rand -base64 32
```

## Verification Steps

After adding all variables:

1. **Trigger a new deployment** in Oxygen
2. **Check the logs** for any missing variable warnings
3. **Test a purchase** to ensure everything works

## Your Current Status

✅ Stripe payments working
✅ Shopify orders being created
✅ Webhooks functioning
⚠️ Missing PUBLIC_CHECKOUT_DOMAIN (analytics warning only)

The checkout and order creation are working perfectly! The PUBLIC_CHECKOUT_DOMAIN variable is only needed for analytics tracking, not core functionality.