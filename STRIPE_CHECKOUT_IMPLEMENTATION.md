# Stripe Checkout Component Implementation

## Overview
This document describes the custom Stripe checkout component implementation for campaign orders. The component provides a branded, campaign-aware checkout experience using Stripe Elements.

## Architecture

### Component Structure
```
app/components/checkout/
├── StripeProvider.tsx       # Stripe context provider
├── StripeCheckout.tsx       # Main checkout component
├── CheckoutModal.tsx        # Modal and page wrappers
└── CheckoutIntegrationExample.tsx  # Integration examples

app/types/
└── stripe-checkout.types.ts # TypeScript definitions

app/utils/
└── checkout-validation.ts   # Form validation utilities

app/styles/
└── checkout-animations.css  # Animations and transitions
```

## Key Features

### 1. Multi-Step Checkout Flow
- **Step 1**: Customer information (email, name, phone)
- **Step 2**: Delivery method selection (pickup, local delivery, shipping)
- **Step 3**: Tip selection (percentage-based or custom amount)
- **Step 4**: Payment information (Stripe Elements)

### 2. Delivery Options
```typescript
// Three delivery methods with different pricing
const DELIVERY_PRICING = {
  pickup: 0,          // Free store pickup
  local_delivery: 5,  // $5 for local delivery
  shipping: 8,        // $8 for standard shipping
};
```

### 3. Tip Selection
- Pre-calculated percentage options (10%, 15%, 20%)
- Custom tip amount input
- No tip option
- Tips calculated based on subtotal

### 4. Real-Time Validation
- Email format validation
- Phone number formatting (US format)
- Address validation for delivery
- ZIP code format validation
- Required field validation

## Integration Guide

### Basic Setup

1. **Import the checkout components**:
```tsx
import {CheckoutModal} from '~/components/checkout/CheckoutModal';
import type {CampaignOrderItem} from '~/lib/stripe.types';
```

2. **Prepare order items**:
```tsx
const items: CampaignOrderItem[] = [{
  id: 'variant-id',
  name: 'Campaign Name',
  price: 6.99,
  quantity: 2
}];
```

3. **Add the checkout modal to your component**:
```tsx
<CheckoutModal
  isOpen={showCheckout}
  onClose={() => setShowCheckout(false)}
  campaignId={campaign.id}
  campaignName={campaign.name}
  campaignImage={campaign.image}
  items={items}
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

### Campaign Page Integration

```tsx
export default function CampaignPage() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const {campaign} = useLoaderData<typeof loader>();
  
  const handleOrder = () => {
    const items = [{
      id: campaign.defaultVariant.id,
      name: campaign.name,
      price: parseFloat(campaign.defaultVariant.price.amount),
      quantity: orderQuantity
    }];
    
    setShowCheckout(true);
  };
  
  const handleSuccess = (result) => {
    console.log('Order completed:', result);
    // Show success message or redirect
  };
  
  return (
    <>
      {/* Campaign content */}
      <button onClick={handleOrder}>
        Order Now - ${(price * orderQuantity).toFixed(2)}
      </button>
      
      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        campaignId={campaign.id}
        campaignName={campaign.name}
        items={items}
        onSuccess={handleSuccess}
      />
    </>
  );
}
```

## Checkout Flow

### 1. Payment Intent Creation
When the checkout component mounts, it automatically creates a Stripe payment intent:

```typescript
// Automatic payment intent creation
fetch('/api/stripe/create-payment-intent', {
  method: 'POST',
  body: JSON.stringify({
    campaignId,
    campaignName,
    items,
    deliveryMethod,
    total
  })
});
```

### 2. Form Submission
The checkout form collects and validates:
- Customer information
- Delivery address (if not pickup)
- Tip amount
- Payment details (via Stripe Elements)

### 3. Payment Processing
```typescript
// Payment confirmation with Stripe
const {error, paymentIntent} = await stripe.confirmPayment({
  elements,
  confirmParams: {
    payment_method_data: {
      billing_details: {
        name: customer.name,
        email: customer.email,
        // ... other details
      }
    }
  },
  redirect: 'if_required'
});
```

### 4. Order Creation
After successful payment, the component automatically creates a Shopify order:

```typescript
// Automatic order creation
fetch('/api/stripe/process-order', {
  method: 'POST',
  body: JSON.stringify({
    paymentIntentId: paymentIntent.id,
    orderData: {
      campaignId,
      items,
      customer,
      // ... other order details
    }
  })
});
```

## Customization

### Styling
The component uses Tailwind CSS classes and can be customized via:

1. **Stripe appearance**:
```typescript
// In StripeProvider.tsx
const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#000000',
    fontFamily: 'system-ui',
    borderRadius: '8px',
  }
};
```

2. **Component styles**:
- Modify Tailwind classes in component files
- Add custom CSS in `checkout-animations.css`

### Delivery Methods
Customize delivery options in `stripe-checkout.types.ts`:

```typescript
export const DELIVERY_PRICING: Record<DeliveryMethod, number> = {
  pickup: 0,
  local_delivery: 5,
  shipping: 8,
  express: 15, // Add new method
};
```

### Tip Options
Customize tip percentages in `stripe-checkout.types.ts`:

```typescript
export const DEFAULT_TIP_OPTIONS: TipOption[] = [
  {label: 'No Tip', value: 0},
  {label: '10%', value: 0, percentage: 10},
  {label: '15%', value: 0, percentage: 15},
  {label: '20%', value: 0, percentage: 20},
  {label: '25%', value: 0, percentage: 25}, // Add new option
];
```

## Testing

### Test Card Numbers
Use these test card numbers in development:

| Scenario | Card Number | Details |
|----------|------------|---------|
| Success | 4242 4242 4242 4242 | Always succeeds |
| Decline | 4000 0000 0000 0002 | Always declines |
| Auth Required | 4000 0025 0000 3155 | Requires 3D Secure |
| Insufficient Funds | 4000 0000 0000 9995 | Decline: insufficient funds |

Use any future expiry date and any 3-digit CVC.

### Testing Checkout Flow

1. **Test Modal Display**:
```tsx
import {CheckoutTestComponent} from '~/components/checkout/CheckoutIntegrationExample';

// Add to your test page
<CheckoutTestComponent />
```

2. **Test Payment Processing**:
- Enter test card details
- Complete all form steps
- Verify payment intent creation in Stripe Dashboard
- Check order creation in Shopify Admin

3. **Test Error Handling**:
- Use decline test cards
- Leave required fields empty
- Test network failures

## Error Handling

### Payment Errors
The component handles various payment errors:

```typescript
if (error.type === 'card_error') {
  // Card was declined
  setPaymentError(error.message);
} else if (error.type === 'validation_error') {
  // Invalid input
  setPaymentError('Please check your information');
} else {
  // Generic error
  setPaymentError('Payment failed. Please try again.');
}
```

### Order Creation Errors
If payment succeeds but order creation fails:
- Payment is still captured
- Webhook will retry order creation
- Manual recovery process available

## Security Considerations

### Data Validation
- All inputs are sanitized before submission
- HTML tags are stripped from text inputs
- Input length is limited to prevent abuse

### PCI Compliance
- Card details never touch your server
- Stripe Elements handles sensitive data
- All payment processing through Stripe's secure infrastructure

### Webhook Security
- Webhook signatures are verified
- Idempotency prevents duplicate orders
- Failed orders logged for manual recovery

## Performance Optimization

### Code Splitting
The checkout components are loaded on-demand:

```tsx
// Lazy load checkout modal
const CheckoutModal = lazy(() => import('~/components/checkout/CheckoutModal'));
```

### Caching
- Payment intents are reused if checkout is reopened
- Form state persists during navigation
- Validation results are memoized

### Bundle Size
- Stripe libraries loaded asynchronously
- Unused Stripe features excluded
- Tree-shaking removes unused code

## Monitoring

### Key Metrics
- Payment success rate
- Average checkout completion time
- Form abandonment rate
- Error frequency by type

### Logging
Important events are logged:
```typescript
console.log('Payment intent created:', paymentIntentId);
console.log('Payment successful:', paymentIntent.id);
console.error('Payment failed:', error);
```

### Analytics Integration
Track checkout events:
```typescript
// Track checkout started
analytics.track('Checkout Started', {
  campaignId,
  itemCount: items.length,
  total: summary.total
});

// Track payment completed
analytics.track('Payment Completed', {
  orderId: result.orderId,
  amount: summary.total
});
```

## Troubleshooting

### Common Issues

1. **"Payment system not configured"**
   - Check STRIPE_PUBLISHABLE_KEY in .env
   - Verify key is passed to StripeProvider

2. **Payment intent creation fails**
   - Check STRIPE_SECRET_KEY in .env
   - Verify API route is accessible
   - Check server logs for errors

3. **Order creation fails after payment**
   - Check Shopify API credentials
   - Verify product/variant IDs
   - Check webhook processing

4. **Validation errors**
   - Ensure all required fields are filled
   - Check email/phone format
   - Verify address for delivery orders

### Debug Mode
Enable debug logging:
```typescript
// In StripeCheckout.tsx
const DEBUG = true;

if (DEBUG) {
  console.log('Form state:', formState);
  console.log('Validation errors:', errors);
  console.log('Payment intent:', paymentIntent);
}
```

## Next Steps

### Potential Enhancements
1. Save customer information for repeat orders
2. Add multiple payment method support
3. Implement subscription/recurring payments
4. Add order tracking integration
5. Create mobile-optimized checkout
6. Add internationalization support
7. Implement saved addresses
8. Add gift message options
9. Create express checkout option
10. Add order confirmation emails

### Integration with Existing Systems
- Connect to customer accounts
- Sync with inventory management
- Integrate with shipping providers
- Add to analytics platforms
- Connect to email marketing

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review test examples in CheckoutIntegrationExample.tsx
3. Check Stripe Dashboard for payment details
4. Review server logs for API errors
5. Test with Stripe CLI for webhook debugging