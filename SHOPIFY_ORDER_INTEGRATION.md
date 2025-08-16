# Shopify Order Creation Integration

## Overview
This integration automatically creates Shopify orders after successful Stripe payments, maintaining compatibility with existing webhook systems and campaign tracking.

## Architecture

### Data Flow
```
1. Customer completes Stripe payment
2. Stripe webhook fires (payment_intent.succeeded)
3. Webhook handler creates Shopify order
4. Shopify order triggers existing webhooks
5. Campaign progress updates automatically
```

## Key Components

### 1. Order Creation Service
**File:** `app/services/shopify-order.server.ts`

- Converts Stripe payment data to Shopify order format
- Creates orders with proper campaign metadata
- Updates campaign progress (backer count, total raised, quantity)
- Implements retry logic for resilience

### 2. Process Order API Route
**File:** `app/routes/api.stripe.process-order.tsx`

- Alternative endpoint for manual order creation
- Validates payment status before creating order
- Implements idempotency to prevent duplicate orders
- Updates Stripe payment intent with order details

### 3. Enhanced Webhook Handler
**File:** `app/routes/webhooks.stripe.tsx`

- Automatically creates orders on payment success
- Reconstructs order data from payment metadata
- Handles failures with detailed logging for recovery

### 4. Type Definitions
**File:** `app/types/shopify-order.types.ts`

- Complete TypeScript interfaces for Shopify orders
- Helper functions for data conversion
- Validation utilities

## Configuration

### Required Environment Variables
```env
# Existing from Phase 1
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Required for Shopify integration
PRIVATE_ADMIN_API_ACCESS_TOKEN=shpat_...
PUBLIC_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_API_VERSION=2024-10
```

### Shopify Admin API Permissions
Your private app needs these scopes:
- `write_orders` - Create orders
- `write_products` - Update product metafields
- `read_products` - Read product data

## Order Structure

### Created Order Properties
```javascript
{
  email: "customer@example.com",
  line_items: [
    {
      variant_id: "123456789",
      quantity: 2,
      price: "6.99",
      properties: [
        {name: "Campaign", value: "Campaign Name"},
        {name: "Payment Method", value: "Stripe"}
      ]
    }
  ],
  financial_status: "paid",
  transactions: [
    {
      kind: "sale",
      status: "success",
      amount: "21.98",
      gateway: "stripe"
    }
  ],
  tags: "campaign, stripe-payment",
  source_identifier: "pi_stripe_payment_intent_id",
  metafields: [
    {namespace: "campaign", key: "campaign_id", value: "..."},
    {namespace: "payment", key: "stripe_payment_intent_id", value: "..."}
  ]
}
```

## Campaign Updates

### Automatic Updates
After order creation, these campaign metafields are updated:
- `campaign_current_quantity` - Incremented by order quantity
- `campaign_backer_count` - Incremented by 1
- `campaign_total_raised` - Incremented by order total

### Webhook Compatibility
Orders are created with:
- Product tags including 'campaign'
- Campaign ID in metafields
- Proper line items with variant IDs
- Financial status as 'paid'

This ensures existing webhook handlers recognize and process the orders correctly.

## Testing

### 1. Local Testing with Stripe CLI
```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:3000/webhooks/stripe

# Trigger test payment success
stripe trigger payment_intent.succeeded

# Check logs for order creation
# Look for: "✅ Shopify order created successfully via webhook"
```

### 2. Manual Order Creation Test
```bash
# Create order via API endpoint
curl -X POST http://localhost:3000/api/stripe/process-order \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_test_xxx",
    "orderData": {
      "campaignId": "gid://shopify/Product/123",
      "campaignName": "Test Campaign",
      "items": [...],
      "total": 21.98,
      "customer": {...}
    }
  }'
```

### 3. Verify Campaign Updates
After order creation, check:
1. Order appears in Shopify admin
2. Campaign metafields are updated
3. Existing webhooks fired (check webhook logs)

## Error Handling

### Automatic Recovery
- **Retry Logic:** Failed orders retry up to 3 times with exponential backoff
- **Idempotency:** Duplicate requests are detected and handled gracefully
- **Webhook Resilience:** Webhook handler continues even if order creation fails

### Manual Recovery Process
For failed order creations:

1. **Find Failed Payments**
   Look for logs with "MANUAL RECOVERY NEEDED"

2. **Identify Payment Details**
   ```
   Payment Intent ID: pi_xxx
   Customer Email: customer@example.com
   Campaign ID: gid://shopify/Product/xxx
   Total: $21.98
   ```

3. **Create Order Manually**
   - Go to Shopify Admin → Orders → Create Order
   - Add products and customer information
   - Mark as paid with "Manual Payment"
   - Add note with Stripe payment intent ID

4. **Update Payment Intent**
   ```javascript
   await stripe.paymentIntents.update('pi_xxx', {
     metadata: {
       shopify_order_id: 'manual_order_id',
       shopify_order_name: '#1001',
       manual_recovery: 'true'
     }
   });
   ```

5. **Update Campaign Manually**
   Update campaign metafields in Shopify admin

## Monitoring

### Key Metrics
- **Order Creation Success Rate:** Should be >95%
- **Webhook Processing Time:** Should be <10 seconds
- **Failed Orders:** Monitor "MANUAL RECOVERY NEEDED" logs
- **Campaign Update Success:** Verify metafields update correctly

### Log Messages to Monitor
```
✅ Success:
- "Shopify order created successfully"
- "Campaign progress updated"

⚠️ Warning:
- "Order already exists"
- "Failed to update campaign progress"

❌ Error:
- "Failed to create Shopify order"
- "MANUAL RECOVERY NEEDED"
- "WEBHOOK PROCESSING FAILED"
```

## Troubleshooting

### Common Issues

1. **"Order creation failed: variant_id not found"**
   - Verify variant IDs are correct
   - Check product exists in Shopify
   - Ensure variant is not deleted

2. **"Failed to update campaign progress"**
   - Check API token has write_products scope
   - Verify metafield namespaces are correct
   - Check product ID format

3. **"Payment amount mismatch"**
   - Ensure order total matches payment intent amount
   - Check currency conversion (cents vs dollars)
   - Verify delivery fees are included

4. **Webhook not creating orders**
   - Verify webhook secret is correct
   - Check webhook endpoint is registered in Stripe
   - Look for webhook signature verification errors

### Debug Mode
Enable detailed logging by checking server logs:
```bash
# View real-time logs
npm run dev

# Look for these log prefixes:
# "Stripe webhook received:"
# "Creating Shopify order from webhook:"
# "Campaign progress updated:"
```

## Security Considerations

1. **API Token Security**
   - Never expose `PRIVATE_ADMIN_API_ACCESS_TOKEN`
   - Use environment variables only
   - Rotate tokens regularly

2. **Webhook Verification**
   - Always verify Stripe webhook signatures
   - Reject unsigned or invalid webhooks
   - Log suspicious activity

3. **Data Validation**
   - Validate all order data before creation
   - Sanitize customer inputs
   - Check price calculations server-side

## Next Steps

### Phase 3 Recommendations
1. Add email notifications for successful orders
2. Implement inventory tracking
3. Add order fulfillment automation
4. Create admin dashboard for monitoring
5. Add customer order history page

### Performance Optimizations
1. Implement queue system for high-volume processing
2. Add caching for campaign metafield reads
3. Batch campaign updates for efficiency
4. Add database for order tracking

## Support

### Getting Help
- Check logs for detailed error messages
- Review test examples in `api.shopify-order.test-examples.tsx`
- Verify all environment variables are set
- Test with Stripe CLI in test mode first

### Rollback Procedure
If issues occur:
1. Remove webhook handler updates
2. Process orders manually
3. Fix issues in test environment
4. Re-deploy with fixes