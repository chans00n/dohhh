# API Routes JSON Import Fix

## Problem
When clicking "Back this Campaign" button, the payment intent creation failed with:
```
TypeError: (0 , __vite_ssr_import_0__.json) is not a function
```

## Root Cause
The Stripe API routes were importing `json` from `@shopify/remix-oxygen`, but this helper function doesn't exist in the current Hydrogen/Remix setup.

## Solution
Replaced the `json` import with a custom `jsonResponse` helper function in all Stripe API routes.

### Custom JSON Response Helper
```typescript
function jsonResponse(data: any, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...init?.headers,
      'Content-Type': 'application/json',
    },
  });
}
```

### Files Fixed
1. `/app/routes/api.stripe.create-payment-intent.tsx`
2. `/app/routes/api.stripe.process-order.tsx`
3. `/app/routes/api.stripe.confirm-payment.tsx`

### Changes Made
- Removed: `import {json} from '@shopify/remix-oxygen'`
- Added: Custom `jsonResponse` helper function
- Replaced: All `return json(...)` with `return jsonResponse(...)`

## Result
✅ API routes now return proper JSON responses
✅ Payment intent creation works
✅ Stripe checkout flow can proceed

## Testing
1. Go to http://localhost:3000/campaigns/lift-for-texas-cash
2. Add items to cart
3. Open cart
4. Click "Back this Campaign"
5. The checkout modal should open without errors
6. Fill in test card: 4242 4242 4242 4242
7. Complete the checkout