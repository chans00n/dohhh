import {type ActionFunctionArgs} from '@shopify/remix-oxygen';
import {createPaymentIntent, formatAmountForStripe} from '~/lib/stripe-fetch.server';
import {
  validateOrderData,
  sanitizeError,
  type CampaignOrderData,
  type PaymentIntentResponse,
} from '~/lib/stripe.types';

// Helper function to return JSON responses
function jsonResponse(data: any, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...init?.headers,
      'Content-Type': 'application/json',
    },
  });
}

// Only allow POST requests
export async function action({request, context}: ActionFunctionArgs) {
  // Verify request method
  if (request.method !== 'POST') {
    return jsonResponse({error: 'Method not allowed'}, {status: 405});
  }

  try {
    // Parse and validate request body
    const data = await request.json();
    
    if (!validateOrderData(data)) {
      return jsonResponse(
        {error: 'Invalid order data. Please check all required fields.'},
        {status: 400}
      );
    }

    const orderData = data as CampaignOrderData;

    // Additional validation for amounts
    const calculatedTotal = orderData.subtotal + orderData.deliveryPrice;
    if (Math.abs(calculatedTotal - orderData.total) > 0.01) {
      return jsonResponse(
        {error: 'Order total mismatch. Please recalculate.'},
        {status: 400}
      );
    }

    // Validate individual item prices
    const itemsTotal = orderData.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    if (Math.abs(itemsTotal - orderData.subtotal) > 0.01) {
      return jsonResponse(
        {error: 'Items subtotal mismatch. Please recalculate.'},
        {status: 400}
      );
    }

    // Create payment intent with campaign metadata
    const paymentIntent = await createPaymentIntent({
      amount: formatAmountForStripe(orderData.total),
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        campaignId: orderData.campaignId,
        campaignName: orderData.campaignName,
        deliveryMethod: orderData.deliveryMethod,
        itemCount: orderData.items.reduce((sum, item) => sum + item.quantity, 0).toString(),
        customerEmail: orderData.customer.email,
        customerName: orderData.customer.name,
        // Store items as JSON string in metadata (Stripe limit: 500 chars per value)
        items: JSON.stringify(
          orderData.items.map(item => ({
            id: item.variantId,
            qty: item.quantity,
            price: item.price,
          }))
        ).substring(0, 500),
      },
      // Explicitly disable email receipts from Stripe
      receipt_email: null,
      description: `Campaign: ${orderData.campaignName}`,
      shipping: orderData.customer.address
        ? {
            name: orderData.customer.name,
            phone: orderData.customer.phone || undefined,
            address: {
              line1: orderData.customer.address.line1,
              line2: orderData.customer.address.line2,
              city: orderData.customer.address.city,
              state: orderData.customer.address.state,
              postal_code: orderData.customer.address.postal_code,
              country: orderData.customer.address.country || 'US',
            },
          }
        : undefined,
    }, context.env.STRIPE_SECRET_KEY);

    // Return client secret and payment intent details
    const response: PaymentIntentResponse = {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };

    return jsonResponse(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Payment intent creation error:', error);

    // Check for specific Stripe errors
    if (error.type === 'StripeCardError') {
      return jsonResponse({error: 'Card error. Please check your payment details.'}, {status: 400});
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return jsonResponse({error: 'Invalid request. Please check your order details.'}, {status: 400});
    }

    // Generic error response (don't expose sensitive details)
    return jsonResponse(
      {error: sanitizeError(error)},
      {status: 500}
    );
  }
}

// GET requests not supported
export async function loader() {
  return jsonResponse({error: 'This endpoint only accepts POST requests'}, {status: 405});
}