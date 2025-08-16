# Content Security Policy Fix for Stripe

## Problem
When clicking "Back this Campaign" in the cart, users saw:
- Error message: "Failed to load payment system. Please refresh and try again."
- Console error: Script blocked by Content Security Policy (CSP)
- Stripe.js couldn't load from `https://js.stripe.com`

## Root Cause
The Content Security Policy (CSP) headers were blocking Stripe's JavaScript because Stripe domains weren't in the allowed sources list.

## Solution
Modified `/app/entry.server.tsx` to add Stripe domains to the CSP configuration:

```typescript
const {nonce, header, NonceProvider} = createContentSecurityPolicy({
  shop: {
    checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
    storeDomain: context.env.PUBLIC_STORE_DOMAIN,
  },
  // Add Stripe domains to CSP
  scriptSrc: [
    "'self'",
    'https://js.stripe.com',
    'https://checkout.stripe.com',
  ],
  frameSrc: [
    "'self'",
    'https://js.stripe.com',
    'https://checkout.stripe.com',
  ],
  connectSrc: [
    "'self'",
    'https://api.stripe.com',
    'https://checkout.stripe.com',
  ],
});
```

## What Each Directive Does
- **scriptSrc**: Allows loading JavaScript from Stripe's CDN
- **frameSrc**: Allows Stripe to create iframes for secure payment forms
- **connectSrc**: Allows API calls to Stripe's servers

## Result
✅ Stripe.js now loads successfully
✅ Payment form appears when clicking "Back this Campaign"
✅ No more CSP errors in the console

## Testing
1. Go to http://localhost:3000/campaigns/lift-for-texas-cash
2. Add items to cart
3. Open cart (click cart icon)
4. Click "Back this Campaign" button
5. Stripe checkout modal should open with payment form

## Security Note
These CSP additions are safe because:
- They only allow specific Stripe domains
- Stripe is a trusted payment processor
- The domains are using HTTPS
- No unsafe-inline or unsafe-eval directives were added