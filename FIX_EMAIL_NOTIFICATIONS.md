# Fix Shopify Order Confirmation Emails

## The Problem
Orders created via Admin API don't automatically send confirmation emails even when `send_receipt: true` is set. This is a known Shopify limitation.

## Solution Options

### Option 1: Enable Notifications in Shopify Admin (Recommended)
1. Go to **Shopify Admin > Settings > Notifications**
2. Click on **Order confirmation** email template
3. Scroll down and check: **"Send this notification for orders created through the API"**
4. Save the changes

This setting ensures API-created orders trigger email notifications.

### Option 2: Use Draft Orders Instead
We could modify the code to create draft orders first, then complete them, which triggers notifications more reliably:

```typescript
// Instead of creating order directly:
// 1. Create draft order
// 2. Complete draft order with payment
// 3. This triggers email automatically
```

### Option 3: Manual Email Trigger via API
After creating the order, we can explicitly trigger the notification:

```typescript
// After order creation, send notification
const sendNotification = await fetch(
  `https://${storeDomain}/admin/api/${apiVersion}/orders/${orderId}/transactions.json`,
  {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transaction: {
        kind: 'capture',
        status: 'success',
        amount: total,
        send_receipt: true
      }
    })
  }
);
```

### Option 4: Use Shopify Flow (Automation)
1. Go to **Shopify Admin > Apps > Shopify Flow**
2. Create a new workflow:
   - **Trigger**: Order created
   - **Condition**: Order tags contains "stripe-payment"
   - **Action**: Send email notification

## Quick Fix - Try This First

1. **Check your Shopify notification settings:**
   - Go to: Settings > Notifications > Order confirmation
   - Make sure it's enabled
   - Check the box for "Send for API orders"

2. **Test with a real email:**
   - Some email providers block test emails
   - Try with a Gmail or real customer email

3. **Check spam folder:**
   - Shopify emails sometimes go to spam initially

## Current Code Status
✅ The code IS correctly setting `send_receipt: true`
✅ Orders are being created successfully
✅ All order data is correct

The issue is purely with Shopify's email notification system for API-created orders.

## Verification Steps
1. Check Shopify Admin > Settings > Notifications > Order confirmation
2. Look for "Staff notification emails" - these usually work even when customer emails don't
3. Check order timeline in Shopify Admin to see if email was attempted
4. Review Settings > Notifications > Customer notifications to ensure they're enabled globally