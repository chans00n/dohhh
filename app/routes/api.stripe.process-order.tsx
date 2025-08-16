import {type ActionFunctionArgs} from '@shopify/remix-oxygen';
import {retrievePaymentIntent, updatePaymentIntent} from '~/lib/stripe-fetch.server';
import {createOrderWithRetry} from '~/services/shopify-order-v2.server';
// Use V4 for direct order with email notification (V3 draft orders causing duplicates)
import {createOrderWithEmail} from '~/services/shopify-order-v4.server';
import type {CampaignOrderData} from '~/lib/stripe.types';
import type {CreateOrderResponse} from '~/types/shopify-order.types';

interface ProcessOrderRequest {
  paymentIntentId: string;
  orderData: CampaignOrderData;
}

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

/**
 * Process order creation after successful Stripe payment
 * This endpoint is called after payment confirmation to create the Shopify order
 */
export async function action({request, context}: ActionFunctionArgs) {
  // Only accept POST requests
  if (request.method !== 'POST') {
    return jsonResponse({error: 'Method not allowed'}, {status: 405});
  }

  // Debug: Log available env vars
  console.log('Available env vars:', {
    hasPrivateToken: !!context.env.PRIVATE_ADMIN_API_ACCESS_TOKEN,
    hasStoreDomain: !!context.env.PUBLIC_STORE_DOMAIN,
    hasStripeKey: !!context.env.STRIPE_SECRET_KEY,
  });

  try {
    // Parse request body
    const data = await request.json() as ProcessOrderRequest;

    // Validate required fields
    if (!data.paymentIntentId || !data.orderData) {
      return jsonResponse(
        {error: 'Missing required fields: paymentIntentId and orderData'},
        {status: 400}
      );
    }

    // Retrieve and verify payment intent
    const paymentIntent = await retrievePaymentIntent(data.paymentIntentId, context.env.STRIPE_SECRET_KEY);

    // Verify payment was successful
    if (paymentIntent.status !== 'succeeded') {
      return jsonResponse(
        {
          error: `Payment not successful. Status: ${paymentIntent.status}`,
          success: false
        },
        {status: 400}
      );
    }

    // Verify amount matches
    const expectedAmount = Math.round(data.orderData.total * 100);
    if (Math.abs(paymentIntent.amount - expectedAmount) > 1) {
      console.error('Amount mismatch:', {
        stripeAmount: paymentIntent.amount,
        expectedAmount,
        orderTotal: data.orderData.total
      });
      return jsonResponse(
        {
          error: 'Payment amount mismatch',
          success: false
        },
        {status: 400}
      );
    }

    // Check if order was already created (idempotency)
    const existingOrderId = paymentIntent.metadata?.shopify_order_id;
    if (existingOrderId) {
      console.log('Order already exists:', existingOrderId);
      return jsonResponse({
        success: true,
        orderId: existingOrderId,
        orderName: paymentIntent.metadata?.shopify_order_name || `#DOHHH_${existingOrderId}`,
        message: 'Order already processed'
      });
    }

    // Create Shopify order using V4 (direct order with email notification)
    // V3 draft orders were causing duplicate issues
    const orderResponse = await createOrderWithEmail(
      paymentIntent,
      data.orderData,
      context.env
    );

    if (!orderResponse.success) {
      // Log failure for manual recovery
      console.error('Failed to create Shopify order after payment:', {
        paymentIntentId: paymentIntent.id,
        customerEmail: data.orderData.customer.email,
        error: orderResponse.error
      });

      // Save failure in Stripe metadata for recovery
      await updatePaymentIntent(paymentIntent.id, {
        metadata: {
          ...paymentIntent.metadata,
          shopify_order_failed: 'true',
          shopify_order_error: orderResponse.error || 'Unknown error',
          shopify_order_attempt_time: new Date().toISOString()
        }
      }, context.env.STRIPE_SECRET_KEY);

      return jsonResponse(
        {
          success: false,
          error: orderResponse.error || 'Failed to create order',
          paymentIntentId: paymentIntent.id,
          requiresManualProcessing: true
        },
        {status: 500}
      );
    }

    // Update Stripe payment intent with order information
    if (orderResponse.orderId && orderResponse.orderName) {
      await updatePaymentIntent(paymentIntent.id, {
        metadata: {
          ...paymentIntent.metadata,
          shopify_order_id: orderResponse.orderId,
          shopify_order_name: orderResponse.orderName,
          shopify_order_created: new Date().toISOString()
        }
      }, context.env.STRIPE_SECRET_KEY);
    }

    // Return success response
    const response: CreateOrderResponse & {paymentIntentId: string} = {
      success: true,
      orderId: orderResponse.orderId,
      orderName: orderResponse.orderName,
      paymentIntentId: paymentIntent.id
    };

    console.log('Order processed successfully:', {
      orderId: orderResponse.orderId,
      orderName: orderResponse.orderName,
      paymentIntentId: paymentIntent.id,
      campaignId: data.orderData.campaignId
    });

    return jsonResponse(response, {status: 200});
  } catch (error: any) {
    console.error('Order processing error:', error);

    // Handle specific errors
    if (error.type === 'StripeInvalidRequestError') {
      return jsonResponse(
        {
          success: false,
          error: 'Invalid payment information'
        },
        {status: 400}
      );
    }

    // Generic error response
    return jsonResponse(
      {
        success: false,
        error: 'Failed to process order. Support has been notified.',
        requiresManualProcessing: true
      },
      {status: 500}
    );
  }
}

// GET requests not supported
export async function loader() {
  return jsonResponse({error: 'This endpoint only accepts POST requests'}, {status: 405});
}