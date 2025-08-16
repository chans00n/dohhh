# Stripe React Components SSR Fix

## Problem
The Stripe React components (`@stripe/react-stripe-js`) were causing SSR (Server-Side Rendering) errors in the Cloudflare Workers environment:
```
ReferenceError: require is not defined
    at node_modules/prop-types/index.js:9:17
```

This happened because:
1. Stripe React components depend on `prop-types` which uses CommonJS `require()`
2. Cloudflare Workers doesn't support CommonJS modules
3. The components were being imported and rendered on the server

## Solution
Made all Stripe-related components client-side only using React's lazy loading and dynamic imports.

### Implementation Strategy

1. **Client-Side Wrappers**: Created `.client.tsx` files that only render on the client
2. **Lazy Loading**: Used React.lazy() to dynamically import Stripe components
3. **Suspense Boundaries**: Added loading states while components load
4. **Client Check**: Added `typeof window !== 'undefined'` checks

### Files Created/Modified

#### New Client-Side Components
- `CheckoutModalWrapper.client.tsx` - Wrapper for checkout modal
- `StripeProvider.client.tsx` - Client-only Stripe provider
- `StripeCheckout.client.tsx` - Client-only checkout form wrapper

#### Modified Components
- `CartWithStripeCheckout.tsx` - Uses lazy loading for checkout modal
- `CheckoutModal.tsx` - Uses Suspense for Stripe components
- `test-checkout-integration.tsx` - Client-side only test components

### Key Changes

1. **Dynamic Imports**
```tsx
// Instead of direct import
import {CheckoutModal} from './CheckoutModal';

// Use lazy loading
const CheckoutModalWrapper = lazy(() => 
  import('./CheckoutModalWrapper.client').then(m => ({
    default: m.CheckoutModalWrapper
  }))
);
```

2. **Client-Side Check**
```tsx
// Only render on client
{typeof window !== 'undefined' && (
  <Suspense fallback={<LoadingSpinner />}>
    <CheckoutModalWrapper {...props} />
  </Suspense>
)}
```

3. **Loading States**
```tsx
<Suspense fallback={
  <div className="flex items-center gap-3">
    <Spinner />
    <span>Loading checkout...</span>
  </div>
}>
  <StripeComponents />
</Suspense>
```

## Benefits

1. **No SSR Errors**: Stripe components only load in the browser
2. **Better Performance**: Components are lazy-loaded when needed
3. **Progressive Enhancement**: Page loads fast, checkout loads on demand
4. **Graceful Degradation**: Loading states while components initialize

## Testing

The fix has been verified:
- Server starts without errors ✅
- Campaign pages load successfully ✅
- Cart functionality works ✅
- Checkout modal opens on client-side ✅
- No `require is not defined` errors ✅

## Usage Notes

### For New Stripe Components
Always follow this pattern:
1. Create a `.client.tsx` wrapper
2. Use dynamic imports
3. Add client-side checks
4. Include loading states

### Example Template
```tsx
// MyStripeComponent.client.tsx
import {lazy, Suspense} from 'react';

const ActualComponent = lazy(() => 
  import('./ActualComponent').then(m => ({
    default: m.ActualComponent
  }))
);

export function MyStripeComponent(props) {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return (
    <Suspense fallback={<Loading />}>
      <ActualComponent {...props} />
    </Suspense>
  );
}
```

## Troubleshooting

If you encounter SSR errors with Stripe:
1. Check if component is wrapped in client-side wrapper
2. Verify lazy loading is implemented
3. Ensure Suspense boundaries are in place
4. Check for `typeof window` guards
5. Look for direct imports that should be dynamic

## Performance Considerations

- Initial page load is faster (no Stripe JS)
- Stripe loads on-demand when checkout opens
- ~70KB loaded only when needed
- Loading states provide good UX during initialization