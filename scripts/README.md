# Order Recovery Scripts

These scripts help recover Stripe payments that didn't create Shopify orders due to errors.

## Prerequisites

Make sure you have the following environment variables set in your `.env` file:
- `STRIPE_SECRET_KEY`
- `PUBLIC_STORE_DOMAIN`
- `PRIVATE_ADMIN_API_ACCESS_TOKEN`
- `SHOPIFY_ADMIN_API_VERSION` (optional, defaults to 2024-10)

## Available Scripts

### 1. Check Order Status
Check recent Stripe payments and see which ones are missing Shopify orders:

```bash
# Check last 24 hours (default)
npx tsx scripts/check-stripe-orders.ts

# Check last 48 hours
npx tsx scripts/check-stripe-orders.ts 48
```

### 2. Recover Single Order
Manually push a specific Stripe payment to Shopify:

```bash
npx tsx scripts/recover-stripe-order.ts pi_3RwvRuAGGp9MhWwY093ogavD
```

This script will:
- Fetch the payment intent from Stripe
- Check if an order already exists (prevents duplicates)
- Create the order in Shopify with all the correct data
- Update the payment intent metadata to mark it as processed
- Send the order confirmation email to the customer

### 3. Recover All Missing Orders
Batch recover all missing orders from a time period:

```bash
# Recover all missing orders from last 24 hours
npx tsx scripts/recover-all-orders.ts

# Recover all missing orders from last 72 hours
npx tsx scripts/recover-all-orders.ts 72
```

## Common Scenarios

### Scenario 1: Production order failed
When you get an error like "Phone number is invalid" and the Stripe payment went through but no Shopify order was created:

1. First, check recent payments:
   ```bash
   npx tsx scripts/check-stripe-orders.ts 6
   ```

2. Find the payment intent ID (starts with `pi_`) from the error logs or Stripe dashboard

3. Recover the specific order:
   ```bash
   npx tsx scripts/recover-stripe-order.ts pi_3RwvRuAGGp9MhWwY093ogavD
   ```

### Scenario 2: Multiple orders failed
If the webhook was down or there were systematic failures:

1. Check how many orders are missing:
   ```bash
   npx tsx scripts/check-stripe-orders.ts 48
   ```

2. Recover all missing orders:
   ```bash
   npx tsx scripts/recover-all-orders.ts 48
   ```

### Scenario 3: Verify order creation
To verify that orders are being created correctly:

```bash
npx tsx scripts/check-stripe-orders.ts 1
```

This will show you orders from the last hour and confirm they have Shopify order IDs.

## Safety Features

- **Idempotency**: Scripts check if an order already exists before creating a new one
- **Payment Verification**: Only processes payments with status "succeeded"
- **Metadata Updates**: Updates Stripe payment intent metadata to prevent duplicate processing
- **Manual Recovery Tag**: Orders created via recovery are tagged with "manual-recovery" in Shopify

## Troubleshooting

If a recovery fails:
1. Check that all environment variables are set correctly
2. Verify the payment intent ID is correct
3. Check Stripe dashboard to confirm payment was successful
4. Review error messages for specific issues (invalid phone, missing email, etc.)

## Production Use

For production, you might want to:
1. Set up monitoring to alert when orders fail
2. Run `check-stripe-orders.ts` periodically (via cron) to catch issues early
3. Keep logs of all recovery operations
4. Consider implementing automatic retry logic in the main webhook handler