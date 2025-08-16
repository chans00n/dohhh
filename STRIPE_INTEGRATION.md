# Stripe Payment Integration Documentation

## Overview
This implementation provides secure Stripe payment processing for campaign orders in a Shopify Hydrogen application. It replaces the standard Shopify checkout with a custom Stripe payment flow.

## Setup Instructions

### 1. Environment Variables
Add these to your `.env` file:
```env
# Get from https://dashboard.stripe.com/apikeys
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Get after creating webhook endpoint in Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

### 2. Stripe Dashboard Configuration

1. **Create Webhook Endpoint**
   - Go to https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - URL: `https://yourdomain.com/webhooks/stripe`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
     - `charge.succeeded`
     - `charge.failed`

2. **Configure Payment Methods**
   - Enable the payment methods you want to accept
   - Recommended: Card, Apple Pay, Google Pay

## API Endpoints

### 1. Create Payment Intent
**Endpoint:** `POST /api/stripe/create-payment-intent`

Creates a Stripe Payment Intent for a campaign order.

**Request Body:**
```json
{
  "campaignId": "gid://shopify/Product/123",
  "campaignName": "Campaign Name",
  "items": [
    {
      "productId": "gid://shopify/Product/123",
      "variantId": "gid://shopify/ProductVariant/456",
      "quantity": 2,
      "price": 6.99
    }
  ],
  "deliveryMethod": "shipping",
  "deliveryPrice": 8.00,
  "subtotal": 13.98,
  "total": 21.98,
  "customer": {
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "address": {
      "line1": "123 Main St",
      "city": "Los Angeles",
      "state": "CA",
      "postal_code": "90001"
    }
  }
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 2198,
  "currency": "usd",
  "status": "requires_payment_method"
}
```

### 2. Confirm Payment
**Endpoint:** `POST /api/stripe/confirm-payment`

Verifies payment status after frontend processing.

**Request Body:**
```json
{
  "paymentIntentId": "pi_xxx",
  "campaignId": "gid://shopify/Product/123"
}
```

**Response:**
```json
{
  "success": true,
  "status": "succeeded",
  "paymentIntentId": "pi_xxx",
  "campaignId": "gid://shopify/Product/123",
  "campaignName": "Campaign Name",
  "amount": 21.98
}
```

### 3. Webhook Handler
**Endpoint:** `POST /webhooks/stripe`

Handles Stripe webhook events. Automatically processes:
- Payment success/failure
- Charge events
- Cancellations

## Security Features

1. **Input Validation**
   - All required fields are validated
   - Price calculations verified server-side
   - Delivery method validation
   - Email and address format validation

2. **Webhook Security**
   - Signature verification for all webhook events
   - Raw body parsing for signature validation
   - Proper error handling without exposing details

3. **Error Handling**
   - Sanitized error messages for clients
   - Detailed logging for debugging
   - No sensitive data in responses

## Testing

### Local Testing with Stripe CLI
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your account
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
```

### Test Card Numbers
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires auth: `4000 0025 0000 3155`

### Testing Checklist
- [ ] Valid payment intent creation
- [ ] Invalid data rejection
- [ ] Price calculation validation
- [ ] Payment confirmation
- [ ] Webhook signature verification
- [ ] Error handling
- [ ] Network failure scenarios

## Integration with Frontend

### Example Frontend Implementation
```javascript
// 1. Create payment intent
const response = await fetch('/api/stripe/create-payment-intent', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(orderData)
});

const {clientSecret} = await response.json();

// 2. Use Stripe.js to collect payment
const result = await stripe.confirmPayment({
  elements,
  clientSecret,
  confirmParams: {
    return_url: 'https://yourdomain.com/order-confirmation',
  },
});

// 3. Confirm payment status
const confirmResponse = await fetch('/api/stripe/confirm-payment', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    paymentIntentId: result.paymentIntent.id,
    campaignId: orderData.campaignId
  })
});
```

## TODO: Campaign Updates After Payment

The webhook handler includes TODOs for implementing:
1. Update campaign metafields (backer_count, total_raised, current_quantity)
2. Add backer to campaign backers list
3. Create order record in database
4. Send confirmation emails
5. Trigger fulfillment process

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| 400 | Invalid request data | Check required fields |
| 401 | Invalid webhook signature | Verify webhook secret |
| 404 | Payment not found | Check payment intent ID |
| 405 | Method not allowed | Use POST requests |
| 500 | Server error | Check logs, retry |

## Monitoring

### Key Metrics to Track
- Payment success rate
- Average payment amount
- Failed payment reasons
- Webhook processing time
- API response times

### Logging
All payment events are logged with:
- Payment intent ID
- Campaign information
- Customer details (email, name)
- Amount and status
- Error details (if any)

## Support

### Common Issues
1. **"Payment processing error"** - Check Stripe API keys
2. **"Invalid signature"** - Verify webhook secret
3. **"Order total mismatch"** - Recalculate prices client-side
4. **Webhook not received** - Check endpoint URL and event types

### Debugging
- Check server logs for detailed error messages
- Use Stripe Dashboard to view payment attempts
- Test with Stripe CLI for local development
- Verify environment variables are set correctly