# Stripe SDK Cloudflare Workers Fix

## Problem
The Stripe Node.js SDK uses CommonJS modules and `require()` which aren't available in Cloudflare Workers environment that Shopify Hydrogen uses. This caused the error:
```
ReferenceError: require is not defined
```

## Solution
Created a fetch-based Stripe API client that works in Workers environment.

### Files Changed

1. **Created `app/lib/stripe-fetch.server.ts`**
   - Implements Stripe API calls using native fetch
   - Handles payment intent creation, retrieval, and updates
   - Includes webhook signature verification
   - Works in Cloudflare Workers environment

2. **Updated API Routes**
   - `app/routes/api.stripe.create-payment-intent.tsx`
   - `app/routes/api.stripe.confirm-payment.tsx`
   - `app/routes/api.stripe.process-order.tsx`
   - `app/routes/webhooks.stripe.tsx`
   
   Changed imports from `stripe.server.ts` to `stripe-fetch.server.ts`

### Key Changes

#### Before (SDK-based):
```typescript
import Stripe from 'stripe';
const stripe = new Stripe(secretKey);
const paymentIntent = await stripe.paymentIntents.create({...});
```

#### After (Fetch-based):
```typescript
import {createPaymentIntent} from '~/lib/stripe-fetch.server';
const paymentIntent = await createPaymentIntent({...});
```

## Benefits
- Works in Cloudflare Workers environment
- No CommonJS/require issues
- Lighter bundle size (no full SDK)
- Direct API calls with fetch

## Testing
The server now starts successfully and can handle Stripe API calls:
- Payment intent creation works
- Webhook processing works
- Order creation after payment works

## Note
The fetch-based implementation covers the essential Stripe operations needed for the checkout flow. If additional Stripe features are needed in the future, they can be added to `stripe-fetch.server.ts`.