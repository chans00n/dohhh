# Cart to Checkout Integration Documentation

## Overview
This document describes the integration between the Shopify cart and the custom Stripe checkout component. The integration replaces the default "Continue to checkout" flow with a custom Stripe-powered checkout for campaign products.

## Architecture

### Component Structure
```
app/components/
├── CartMain.tsx                    # Main cart component (modified)
├── CartWithStripeCheckout.tsx      # Enhanced cart summary with Stripe
├── CartLineItem.tsx                # Cart line items (unchanged)
├── checkout/
│   ├── CheckoutModal.tsx           # Stripe checkout modal
│   ├── StripeCheckout.tsx          # Main checkout component
│   └── StripeProvider.tsx          # Stripe context provider

app/lib/
├── cart-helpers.ts                 # Cart utility functions
└── stripe-fetch.server.ts          # Stripe API client
```

## Key Changes

### 1. CartMain Component
**File**: `app/components/CartMain.tsx`

Changed from:
```tsx
import {CartSummary} from './CartSummary';
// ...
{cartHasItems && <CartSummary cart={cart} layout={layout} />}
```

To:
```tsx
import {CartWithStripeCheckout} from './CartWithStripeCheckout';
// ...
{cartHasItems && <CartWithStripeCheckout cart={cart} layout={layout} />}
```

### 2. Enhanced Cart Summary
**File**: `app/components/CartWithStripeCheckout.tsx`

Key features:
- Detects campaign products automatically
- Shows "Back this Campaign" for campaign items
- Falls back to Shopify checkout for non-campaign items
- Handles checkout success and cart clearing

## Campaign Detection

The system automatically detects campaign products using:

```typescript
function getCampaignFromCart(cart) {
  // Look for campaign items in cart
  const campaignItem = cart.lines.nodes.find(line => {
    const product = line.merchandise.product;
    
    // Check product tags for campaign indicator
    const isCampaign = product.tags?.some(tag => 
      tag.toLowerCase().includes('campaign')
    );
    
    return isCampaign;
  });
  
  if (!campaignItem) return null;
  
  return {
    id: product.id,
    name: product.title,
    image: product.image?.url,
  };
}
```

### Campaign Product Requirements
For a product to be recognized as a campaign:
1. Must have a tag containing "campaign" (case-insensitive)
2. OR have campaign metafields

## Data Flow

### 1. Cart to Checkout
```
Cart Component
    ↓
CartWithStripeCheckout
    ↓
Transform cart items to checkout format
    ↓
CheckoutModal opens with:
- Campaign ID
- Campaign Name
- Items array
- Callbacks
```

### 2. Checkout to Payment
```
CheckoutModal
    ↓
StripeCheckout Component
    ↓
Create Payment Intent (API)
    ↓
Collect Customer Info
    ↓
Process Payment (Stripe)
    ↓
Create Shopify Order (API)
```

### 3. Success Flow
```
Payment Success
    ↓
onSuccess Callback
    ↓
Clear Cart Items
    ↓
Show Success Message
    ↓
Close Modal/Cart
```

## Implementation Details

### Cart Data Transformation
Cart items are transformed to the checkout format:

```typescript
const checkoutItems = cart.lines.nodes.map(line => ({
  id: line.merchandise.id,
  variantId: line.merchandise.id,
  productId: line.merchandise.product.id,
  name: line.merchandise.product.title,
  price: parseFloat(line.merchandise.price.amount),
  quantity: line.quantity || 1,
  image: line.merchandise.image?.url,
}));
```

### Cart Clearing
After successful checkout, the cart is cleared using Shopify's CartForm:

```typescript
fetcher.submit(
  {
    action: CartForm.ACTIONS.LinesRemove,
    linesIds: lineIds,
  },
  {method: 'POST', action: '/cart'}
);
```

### Environment Variables
The Stripe publishable key is passed to the client:

```typescript
// In root.tsx loader
return {
  env: {
    STRIPE_PUBLISHABLE_KEY: context.env.STRIPE_PUBLISHABLE_KEY,
  },
};

// Available in client as:
window.ENV.STRIPE_PUBLISHABLE_KEY
```

## User Experience

### For Campaign Products
1. User adds campaign items to cart
2. Opens cart (slide-out or page)
3. Sees "Back this Campaign" button
4. Clicks button → Stripe checkout modal opens
5. Completes checkout form
6. Payment processes
7. Cart clears automatically
8. Success message displays

### For Regular Products
1. User adds regular items to cart
2. Opens cart
3. Sees "Continue to Checkout" button
4. Clicks button → Redirects to Shopify checkout
5. Standard Shopify checkout flow

### Mixed Cart
If cart contains both campaign and regular products:
- System prioritizes campaign checkout
- Consider implementing cart splitting in future

## Error Handling

### Payment Failures
```typescript
const handleCheckoutError = (error: Error) => {
  // Show error message
  // Keep cart intact
  // Allow retry
};
```

### Network Errors
- Checkout modal remains open
- Error message displays
- User can retry payment

### Cart Clearing Failures
- Payment still succeeds
- Manual cart clear option
- Error logged for support

## Testing

### Test Page
Access the test page at: `/test-checkout-integration`

Features:
- Mock cart with campaign items
- Test card numbers
- Integration verification
- Debug information

### Test Flow
1. Add campaign product to cart
2. Open cart
3. Click "Back this Campaign"
4. Fill checkout form:
   - Email: test@example.com
   - Name: Test User
   - Card: 4242 4242 4242 4242
   - Expiry: Any future date
   - CVC: Any 3 digits
5. Complete payment
6. Verify cart clears
7. Check Shopify order created

## Customization

### Button Text
Change in `CartWithStripeCheckout.tsx`:
```tsx
// Line ~160
'Back this Campaign →'  // Change this text
```

### Campaign Detection Logic
Modify in `cart-helpers.ts`:
```typescript
// Customize how campaigns are detected
const isCampaign = product.tags?.some(tag => 
  tag.toLowerCase().includes('campaign') ||
  tag.toLowerCase().includes('fundraiser')  // Add more conditions
);
```

### Checkout Modal Behavior
Configure in `CartWithStripeCheckout.tsx`:
```typescript
// Control when to show Stripe vs Shopify checkout
if (!campaignInfo || someOtherCondition) {
  // Use Shopify checkout
  window.location.href = cart.checkoutUrl;
}
```

## Troubleshooting

### Checkout Not Opening
1. Check campaign detection:
   - Verify product has "campaign" tag
   - Check console for errors
2. Verify Stripe key is set:
   - Check `window.ENV.STRIPE_PUBLISHABLE_KEY`
   - Verify .env file has key

### Cart Not Clearing
1. Check network tab for cart clear request
2. Verify line IDs are correct
3. Check for CartForm errors

### Payment Fails
1. Check Stripe Dashboard for errors
2. Verify API routes are accessible
3. Check browser console for errors

## Security Considerations

### Client-Side
- Only publishable key exposed to client
- No sensitive data in window.ENV
- Payment details handled by Stripe Elements

### Server-Side
- Secret keys only in server environment
- Webhook signatures verified
- Payment amounts validated server-side

## Performance

### Optimizations
- Checkout component lazy loaded
- Cart calculations memoized
- Stripe library loaded on demand

### Bundle Size
- Stripe React: ~50KB gzipped
- Checkout components: ~20KB
- Total overhead: ~70KB (loaded on demand)

## Future Enhancements

### Planned Features
1. **Multi-Campaign Support**: Handle carts with multiple campaigns
2. **Express Checkout**: Apple Pay/Google Pay integration
3. **Saved Cards**: Return customer card storage
4. **Subscription Support**: Recurring campaign backing
5. **Cart Splitting**: Separate campaign/regular checkouts

### Potential Improvements
- Progressive checkout form
- Address autocomplete
- International shipping
- Multiple currency support
- Discount code integration

## Migration Guide

### From Standard Cart
1. Replace `CartSummary` import with `CartWithStripeCheckout`
2. Ensure products have campaign tags
3. Set Stripe environment variables
4. Test checkout flow

### Rollback Procedure
If issues occur:
1. Revert `CartMain.tsx` to use `CartSummary`
2. Remove `CartWithStripeCheckout` import
3. Standard Shopify checkout resumes

## API Reference

### CartWithStripeCheckout Props
```typescript
interface Props {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: 'page' | 'aside';
}
```

### CheckoutModal Props
```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName: string;
  campaignImage?: string;
  items: CampaignOrderItem[];
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}
```

### Helper Functions
```typescript
// Get campaign from cart
getCampaignFromCart(cart): CampaignInfo | null

// Transform cart items
transformCartToCheckoutItems(cart): CampaignOrderItem[]

// Calculate totals
calculateCartTotals(cart): {subtotal, total, itemCount}

// Check if campaign only
isCartCampaignOnly(cart): boolean
```

## Support

### Common Issues
- **Q**: Checkout button not changing?
  **A**: Verify product has "campaign" tag

- **Q**: Payment succeeds but cart doesn't clear?
  **A**: Check cart permissions and fetcher implementation

- **Q**: Stripe not loading?
  **A**: Verify STRIPE_PUBLISHABLE_KEY in environment

### Contact
For implementation support:
1. Check test page at `/test-checkout-integration`
2. Review browser console for errors
3. Check server logs for API errors
4. Verify Stripe Dashboard for payment status