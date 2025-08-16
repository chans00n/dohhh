/**
 * Test Examples for Stripe API Routes
 * 
 * These examples show how to test the Stripe payment routes
 * Use these with tools like Postman, cURL, or your frontend code
 */

// ============================================
// 1. CREATE PAYMENT INTENT
// ============================================

// TEST: Valid payment intent creation
const validPaymentIntentRequest = {
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
  deliveryMethod: "shipping", // 'pickup' | 'local_delivery' | 'shipping'
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
};

// cURL example:
const curlCreatePaymentIntent = `
curl -X POST http://localhost:3000/api/stripe/create-payment-intent \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(validPaymentIntentRequest, null, 2)}'
`;

// Expected successful response:
const successfulPaymentIntentResponse = {
  clientSecret: "pi_1234567890_secret_abcdef",
  paymentIntentId: "pi_1234567890",
  amount: 2198, // in cents
  currency: "usd",
  status: "requires_payment_method"
};

// TEST: Invalid data (missing required fields)
const invalidPaymentIntentRequest = {
  campaignId: "123",
  // missing items, customer, etc.
};
// Expected response: 400 Bad Request
// { "error": "Invalid order data. Please check all required fields." }

// TEST: Total mismatch
const mismatchedTotalRequest = {
  ...validPaymentIntentRequest,
  total: 100.00 // doesn't match subtotal + delivery
};
// Expected response: 400 Bad Request
// { "error": "Order total mismatch. Please recalculate." }

// ============================================
// 2. CONFIRM PAYMENT
// ============================================

// TEST: Valid payment confirmation
const validConfirmationRequest = {
  paymentIntentId: "pi_1234567890",
  campaignId: "gid://shopify/Product/10058503946559"
};

// cURL example:
const curlConfirmPayment = `
curl -X POST http://localhost:3000/api/stripe/confirm-payment \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(validConfirmationRequest, null, 2)}'
`;

// Expected successful response:
const successfulConfirmationResponse = {
  success: true,
  status: "succeeded",
  paymentIntentId: "pi_1234567890",
  campaignId: "gid://shopify/Product/10058503946559",
  campaignName: "Uplift for Cash",
  amount: 21.98
};

// TEST: Invalid payment intent ID
const invalidConfirmationRequest = {
  paymentIntentId: "invalid_id"
};
// Expected response: 404 Not Found
// { "success": false, "status": "not_found", "error": "Payment not found. Please check your payment ID." }

// TEST: Failed payment confirmation
// Expected response for failed payment:
const failedConfirmationResponse = {
  success: false,
  status: "requires_payment_method",
  paymentIntentId: "pi_1234567890",
  error: "Payment was not successful. Please try again."
};

// ============================================
// 3. WEBHOOK HANDLER
// ============================================

// TEST: Valid webhook event
// Note: Webhooks must be properly signed by Stripe
// Use Stripe CLI for local testing: stripe listen --forward-to localhost:3000/webhooks/stripe

// Example webhook payload (payment_intent.succeeded):
const webhookPayload = {
  id: "evt_1234567890",
  type: "payment_intent.succeeded",
  data: {
    object: {
      id: "pi_1234567890",
      amount: 2198,
      currency: "usd",
      status: "succeeded",
      metadata: {
        campaignId: "gid://shopify/Product/10058503946559",
        campaignName: "Uplift for Cash",
        customerEmail: "customer@example.com",
        customerName: "John Doe",
        deliveryMethod: "shipping",
        itemCount: "2",
        items: '[{"id":"gid://shopify/ProductVariant/123456789","qty":2,"price":6.99}]'
      }
    }
  }
};

// Webhook testing with Stripe CLI:
const stripeCliTest = `
# Install Stripe CLI first
# https://stripe.com/docs/stripe-cli

# Login to your Stripe account
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.succeeded
`;

// ============================================
// 4. ERROR SCENARIOS TO TEST
// ============================================

const errorScenarios = [
  {
    scenario: "Network timeout",
    test: "Set a very short timeout on the request",
    expectedBehavior: "Returns 500 with generic error message"
  },
  {
    scenario: "Invalid Stripe API key",
    test: "Use incorrect STRIPE_SECRET_KEY in .env",
    expectedBehavior: "Returns 500 with 'Payment processing error'"
  },
  {
    scenario: "Webhook signature verification failure",
    test: "Send webhook without proper signature",
    expectedBehavior: "Returns 401 with 'Invalid signature'"
  },
  {
    scenario: "Missing environment variables",
    test: "Remove STRIPE_SECRET_KEY from .env",
    expectedBehavior: "Returns 500 with appropriate error"
  },
  {
    scenario: "Malformed JSON in request",
    test: "Send invalid JSON body",
    expectedBehavior: "Returns 400 with parsing error"
  },
  {
    scenario: "Rate limiting",
    test: "Send many requests rapidly",
    expectedBehavior: "Stripe SDK handles rate limiting automatically"
  }
];

// ============================================
// 5. INTEGRATION TEST EXAMPLE
// ============================================

async function integrationTest() {
  // 1. Create payment intent
  const createResponse = await fetch('/api/stripe/create-payment-intent', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(validPaymentIntentRequest)
  });
  
  const {clientSecret, paymentIntentId} = await createResponse.json();
  
  // 2. Process payment on frontend (using Stripe.js)
  // This would be done in the browser with Stripe Elements
  
  // 3. Confirm payment
  const confirmResponse = await fetch('/api/stripe/confirm-payment', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      paymentIntentId,
      campaignId: validPaymentIntentRequest.campaignId
    })
  });
  
  const confirmation = await confirmResponse.json();
  console.log('Payment status:', confirmation.success ? 'Success' : 'Failed');
  
  // 4. Webhook will be triggered automatically by Stripe
}

// ============================================
// 6. SECURITY TESTING
// ============================================

const securityTests = [
  {
    test: "SQL Injection in campaign ID",
    payload: {
      ...validPaymentIntentRequest,
      campaignId: "'; DROP TABLE users; --"
    },
    expected: "Input validation should reject invalid campaign ID format"
  },
  {
    test: "XSS in customer name",
    payload: {
      ...validPaymentIntentRequest,
      customer: {
        ...validPaymentIntentRequest.customer,
        name: "<script>alert('XSS')</script>"
      }
    },
    expected: "Should be safely handled by Stripe and not executed"
  },
  {
    test: "Price manipulation",
    payload: {
      ...validPaymentIntentRequest,
      items: [{
        ...validPaymentIntentRequest.items[0],
        price: -10.00
      }]
    },
    expected: "Validation should reject negative prices"
  },
  {
    test: "Total manipulation",
    payload: {
      ...validPaymentIntentRequest,
      total: 0.01 // Much less than actual total
    },
    expected: "Server should recalculate and reject mismatched totals"
  }
];

export default function TestExamples() {
  return (
    <div style={{padding: '20px', fontFamily: 'monospace'}}>
      <h1>Stripe API Test Examples</h1>
      <p>View source code for comprehensive test examples</p>
      <pre>{JSON.stringify({
        endpoints: [
          '/api/stripe/create-payment-intent',
          '/api/stripe/confirm-payment',
          '/webhooks/stripe'
        ],
        testWithStripe: 'Use Stripe CLI for webhook testing',
        documentation: 'https://stripe.com/docs/testing'
      }, null, 2)}</pre>
    </div>
  );
}