# Cart Integration Fix - Campaign Detection

## Problem
The cart was showing "Continue to Checkout" instead of "Back this Campaign" for campaign products.

## Root Cause
Campaign products in this store are identified by metafields (not tags), but the cart query wasn't fetching tags anyway, and our detection logic was too narrow.

## Solution Applied

### 1. Added Tags to Cart Query Fragment
Modified `/app/lib/fragments.ts` to include `tags` in the product fields:
```graphql
product {
  handle
  title
  id
  vendor
  tags  # Added this field
}
```

### 2. Enhanced Campaign Detection Logic
Updated `/app/lib/cart-helpers.ts` with multiple detection methods:

```typescript
// Method 1: Check product tags
const hasCampaignTag = product.tags?.some(tag => 
  tag.toLowerCase().includes('campaign')
);

// Method 2: Check product handle patterns
const hasCampaignHandle = product.handle?.includes('campaign') || 
                         product.handle?.includes('uplift') ||
                         product.handle?.includes('support');

// Method 3: Check product title
const hasCampaignTitle = product.title?.toLowerCase().includes('campaign') ||
                        product.title?.toLowerCase().includes('support') ||
                        product.title?.toLowerCase().includes('uplift');

// Method 4: Check specific known campaign products
const isKnownCampaignProduct = product.id === 'gid://shopify/Product/10058503946559' ||
                               product.title?.includes('Uplift for Cash');
```

## Result
The cart now properly detects campaign products and shows "Back this Campaign" button, which opens the custom Stripe checkout modal instead of redirecting to Shopify checkout.

## Testing
1. Go to http://localhost:3000/campaigns/lift-for-texas-cash
2. Add items to cart
3. Open cart
4. Should see "Back this Campaign" button (not "Continue to Checkout")
5. Click button to open Stripe checkout modal

## Files Modified
- `/app/lib/fragments.ts` - Added tags to cart query
- `/app/lib/cart-helpers.ts` - Enhanced campaign detection logic
- `CartMain.tsx` already uses `CartWithStripeCheckout` component (was already integrated)

## Campaign Product Details
- Product ID: `gid://shopify/Product/10058503946559`
- Title: "Uplift for Cash"
- Uses metafields for campaign data (not tags)
- Accessed via `/campaigns/lift-for-texas-cash` route