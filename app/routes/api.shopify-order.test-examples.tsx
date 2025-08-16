/**
 * Test Examples for Shopify Order Creation
 * 
 * These examples show how to test the Shopify order creation flow
 * after successful Stripe payments
 */

// ============================================
// 1. PROCESS ORDER AFTER PAYMENT
// ============================================

// TEST: Valid order creation request
const validProcessOrderRequest = {
  paymentIntentId: "pi_1234567890",
  orderData: {
    campaignId: "gid://shopify/Product/10058503946559",
    campaignName: "Uplift for Cash",
    items: [
      {
        productId: "gid://shopify/Product/10058503946559",
        variantId: "gid://shopify/ProductVariant/123456789",
        quantity: 2,
        price: 6.99
      }
    ],
    deliveryMethod: "shipping",
    deliveryPrice: 8.00,
    subtotal: 13.98,
    total: 21.98,
    customer: {
      email: "customer@example.com",
      name: "John Doe",
      phone: "+1234567890",
      address: {
        line1: "123 Main St",
        line2: "Apt 4B",
        city: "Los Angeles",
        state: "CA",
        postal_code: "90001",
        country: "US"
      }
    }
  }
};

// cURL example:
const curlProcessOrder = `
curl -X POST http://localhost:3000/api/stripe/process-order \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(validProcessOrderRequest, null, 2)}'
`;

// Expected successful response:
const successfulOrderResponse = {
  success: true,
  orderId: "1234567890",
  orderName: "#1001",
  paymentIntentId: "pi_1234567890"
};

// ============================================
// 2. WEBHOOK FLOW TEST
// ============================================

// The webhook automatically creates orders when payment succeeds
// Test with Stripe CLI:
const webhookTestFlow = `
# 1. Trigger a test payment success event
stripe trigger payment_intent.succeeded

# 2. Watch the logs for order creation
# You should see:
# - "Creating Shopify order from webhook"
# - "✅ Shopify order created successfully via webhook"

# 3. Check Shopify admin for the new order
# Order should have:
# - financial_status: 'paid'
# - tags: 'campaign, stripe-payment'
# - note with Stripe payment intent ID
`;

// ============================================
// 3. ERROR SCENARIOS
// ============================================

const errorScenarios = [
  {
    scenario: "Payment not successful",
    test: "Send process-order request with failed payment intent ID",
    expectedResponse: {
      error: "Payment not successful. Status: requires_payment_method",
      success: false
    }
  },
  {
    scenario: "Amount mismatch",
    test: "Send order data with total that doesn't match payment intent",
    expectedResponse: {
      error: "Payment amount mismatch",
      success: false
    }
  },
  {
    scenario: "Order already created",
    test: "Send same payment intent ID twice",
    expectedResponse: {
      success: true,
      message: "Order already processed"
    }
  },
  {
    scenario: "Invalid variant ID",
    test: "Use non-existent variant ID",
    expectedBehavior: "Order creation fails, logged for manual recovery"
  },
  {
    scenario: "Shopify API down",
    test: "Simulate network failure to Shopify",
    expectedBehavior: "Retry logic kicks in, max 3 attempts"
  }
];

// ============================================
// 4. CAMPAIGN UPDATE VERIFICATION
// ============================================

const campaignUpdateTest = `
# After order creation, verify campaign metafields are updated:

# 1. Check campaign product metafields
curl -X GET "https://YOUR_STORE.myshopify.com/admin/api/2024-10/products/PRODUCT_ID/metafields.json" \\
  -H "X-Shopify-Access-Token: YOUR_TOKEN"

# Expected updates:
# - campaign_current_quantity: increased by order quantity
# - campaign_backer_count: increased by 1
# - campaign_total_raised: increased by order total
`;

// ============================================
// 5. IDEMPOTENCY TEST
// ============================================

async function testIdempotency() {
  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 2198,
    currency: 'usd',
    metadata: {
      campaignId: 'gid://shopify/Product/123',
      campaignName: 'Test Campaign'
    }
  });

  // First order creation - should succeed
  const firstRequest = await fetch('/api/stripe/process-order', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      paymentIntentId: paymentIntent.id,
      orderData: validProcessOrderRequest.orderData
    })
  });
  
  const firstResponse = await firstRequest.json();
  console.log('First request:', firstResponse.success); // true

  // Second order creation - should detect existing order
  const secondRequest = await fetch('/api/stripe/process-order', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      paymentIntentId: paymentIntent.id,
      orderData: validProcessOrderRequest.orderData
    })
  });
  
  const secondResponse = await secondRequest.json();
  console.log('Second request:', secondResponse.message); // "Order already processed"
}

// ============================================
// 6. MANUAL RECOVERY PROCESS
// ============================================

const manualRecoveryProcess = {
  scenario: "Payment succeeded but order creation failed",
  
  steps: [
    "1. Check logs for 'MANUAL RECOVERY NEEDED' entries",
    "2. Find the payment intent ID and customer details",
    "3. Manually create order in Shopify admin",
    "4. Update payment intent metadata with order ID",
    "5. Update campaign metafields manually"
  ],
  
  updatePaymentIntentScript: `
    // Update payment intent with manual order info
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    await stripe.paymentIntents.update('pi_XXXXX', {
      metadata: {
        shopify_order_id: 'MANUAL_ORDER_ID',
        shopify_order_name: '#1001',
        manual_recovery: 'true',
        recovery_date: new Date().toISOString()
      }
    });
  `
};

// ============================================
// 7. INTEGRATION TEST
// ============================================

async function fullIntegrationTest() {
  console.log('Starting full integration test...');
  
  // 1. Create payment intent
  const createPaymentResponse = await fetch('/api/stripe/create-payment-intent', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(validProcessOrderRequest.orderData)
  });
  
  const {clientSecret, paymentIntentId} = await createPaymentResponse.json();
  console.log('✓ Payment intent created:', paymentIntentId);
  
  // 2. Simulate payment success (in real scenario, Stripe.js handles this)
  // For testing, manually mark as succeeded in Stripe Dashboard
  
  // 3. Process order creation
  const processOrderResponse = await fetch('/api/stripe/process-order', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      paymentIntentId,
      orderData: validProcessOrderRequest.orderData
    })
  });
  
  const orderResult = await processOrderResponse.json();
  console.log('✓ Order created:', orderResult.orderName);
  
  // 4. Verify order in Shopify
  // Check Shopify admin for order with matching details
  
  // 5. Verify campaign updates
  // Check campaign metafields for updated values
  
  console.log('Integration test complete!');
}

// ============================================
// 8. MONITORING CHECKLIST
// ============================================

const monitoringChecklist = [
  {
    metric: "Order creation success rate",
    query: "Count of successful vs failed order creations",
    alert: "If success rate < 95%"
  },
  {
    metric: "Webhook processing time",
    query: "Time between payment success and order creation",
    alert: "If processing time > 10 seconds"
  },
  {
    metric: "Manual recovery needed",
    query: "Count of 'MANUAL RECOVERY NEEDED' log entries",
    alert: "If any manual recovery needed"
  },
  {
    metric: "Campaign update failures",
    query: "Failed campaign metafield updates",
    alert: "If any campaign updates fail"
  },
  {
    metric: "Retry attempts",
    query: "Number of retry attempts for order creation",
    alert: "If retries > 1 frequently"
  }
];

export default function TestExamples() {
  return (
    <div style={{padding: '20px', fontFamily: 'monospace'}}>
      <h1>Shopify Order Creation Test Examples</h1>
      <p>View source code for comprehensive test examples</p>
      <pre>{JSON.stringify({
        endpoints: [
          '/api/stripe/process-order',
          '/webhooks/stripe (auto-creates orders)'
        ],
        testFlow: 'Payment → Webhook → Order → Campaign Update',
        monitoring: 'Check logs for success/failure messages'
      }, null, 2)}</pre>
    </div>
  );
}