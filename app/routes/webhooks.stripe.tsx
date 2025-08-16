import {type ActionFunctionArgs} from '@shopify/remix-oxygen';
import {verifyWebhookSignature, formatAmountFromStripe} from '~/lib/stripe-fetch.server';
import type {StripeWebhookEvent, CampaignOrderData} from '~/lib/stripe.types';
import {createShopifyOrderV2} from '~/services/shopify-order-v2.server';

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

// Webhook endpoint for Stripe events
export async function action({request, context}: ActionFunctionArgs) {
  // Only accept POST requests
  if (request.method !== 'POST') {
    return jsonResponse({error: 'Method not allowed'}, {status: 405});
  }

  const webhookSecret = context.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return jsonResponse({error: 'Webhook not configured'}, {status: 500});
  }

  try {
    // Get the raw body and signature
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    // Verify webhook signature
    const event = verifyWebhookSignature(payload, signature, webhookSecret);

    // Log all events for debugging
    console.log(`Stripe webhook received: ${event.type}`, {
      eventId: event.id,
      type: event.type,
    });

    // Handle specific event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event, context);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event);
        break;

      case 'charge.succeeded':
        await handleChargeSucceeded(event);
        break;

      case 'charge.failed':
        await handleChargeFailed(event);
        break;

      case 'payment_method.attached':
        console.log('Payment method attached:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Always return 200 to acknowledge receipt
    return jsonResponse({received: true}, {status: 200});
  } catch (error: any) {
    console.error('Webhook error:', error.message);

    // Return error status for Stripe to retry
    if (error.message?.includes('signature verification')) {
      return jsonResponse({error: 'Invalid signature'}, {status: 401});
    }

    return jsonResponse({error: 'Webhook processing failed'}, {status: 500});
  }
}

// Handle successful payment
async function handlePaymentIntentSucceeded(event: any, context: any) {
  const paymentIntent = event.data.object as any;
  
  console.log('Payment succeeded:', {
    paymentIntentId: paymentIntent.id,
    amount: formatAmountFromStripe(paymentIntent.amount),
    currency: paymentIntent.currency,
    campaignId: paymentIntent.metadata?.campaignId,
    campaignName: paymentIntent.metadata?.campaignName,
    customerEmail: paymentIntent.metadata?.customerEmail,
    deliveryMethod: paymentIntent.metadata?.deliveryMethod,
    itemCount: paymentIntent.metadata?.itemCount,
  });

  // Check if order was already created (idempotency)
  if (paymentIntent.metadata?.shopify_order_id) {
    console.log('Order already created for this payment:', {
      orderId: paymentIntent.metadata.shopify_order_id,
      orderName: paymentIntent.metadata.shopify_order_name
    });
    return;
  }

  // Skip webhook order creation for now since frontend handles it
  console.log('Webhook received but skipping order creation (handled by frontend):', {
    paymentIntentId: paymentIntent.id,
    campaignId: paymentIntent.metadata?.campaignId,
  });
  return;

  try {
    // Parse items from metadata
    const items = paymentIntent.metadata?.items 
      ? JSON.parse(paymentIntent.metadata.items)
      : [];

    // Reconstruct order data from payment intent metadata
    const campaignOrderData: CampaignOrderData = {
      campaignId: paymentIntent.metadata?.campaignId || '',
      campaignName: paymentIntent.metadata?.campaignName || '',
      items: items.map((item: any) => ({
        productId: paymentIntent.metadata?.campaignId || '', // Use campaign ID as product ID
        variantId: item.id,
        quantity: item.qty,
        price: item.price
      })),
      deliveryMethod: (paymentIntent.metadata?.deliveryMethod as 'pickup' | 'local_delivery' | 'shipping') || 'pickup',
      deliveryPrice: 0, // Will be calculated based on delivery method
      subtotal: 0, // Will be calculated from items
      total: formatAmountFromStripe(paymentIntent.amount),
      customer: {
        email: paymentIntent.metadata?.customerEmail || paymentIntent.receipt_email || '',
        name: paymentIntent.metadata?.customerName || '',
        phone: paymentIntent.shipping?.phone,
        address: paymentIntent.shipping?.address ? {
          line1: paymentIntent.shipping.address.line1 || '',
          line2: paymentIntent.shipping.address.line2,
          city: paymentIntent.shipping.address.city || '',
          state: paymentIntent.shipping.address.state || '',
          postal_code: paymentIntent.shipping.address.postal_code || '',
          country: paymentIntent.shipping.address.country || 'US'
        } : undefined
      }
    };

    // Calculate subtotal and delivery price
    campaignOrderData.subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0);
    
    // Set delivery price based on method
    if (campaignOrderData.deliveryMethod === 'local_delivery') {
      campaignOrderData.deliveryPrice = 5;
    } else if (campaignOrderData.deliveryMethod === 'shipping') {
      campaignOrderData.deliveryPrice = 8;
    }

    // Log order creation attempt
    console.log('Creating Shopify order from webhook:', {
      campaignId: campaignOrderData.campaignId,
      paymentIntentId: paymentIntent.id,
      total: campaignOrderData.total,
      customer: campaignOrderData.customer.email
    });

    // Create order in Shopify
    const orderResult = await createShopifyOrderV2(
      context.env,
      paymentIntent,
      campaignOrderData
    );

    if (orderResult.success) {
      console.log('✅ Shopify order created successfully via webhook:', {
        orderId: orderResult.orderId,
        orderName: orderResult.orderName,
        paymentIntentId: paymentIntent.id
      });

      // Note: The createOrderAfterPayment function already updates the payment intent metadata
      // and campaign progress, so we don't need to do it here
    } else {
      console.error('❌ Failed to create Shopify order via webhook:', {
        error: orderResult.error,
        paymentIntentId: paymentIntent.id,
        campaignId: campaignOrderData.campaignId
      });

      // Log for manual recovery
      console.error('MANUAL RECOVERY NEEDED:', {
        paymentIntentId: paymentIntent.id,
        customerEmail: campaignOrderData.customer.email,
        campaignId: campaignOrderData.campaignId,
        total: campaignOrderData.total,
        items: campaignOrderData.items
      });
    }
  } catch (error) {
    console.error('Error processing successful payment in webhook:', error);
    
    // Log detailed error for debugging
    console.error('WEBHOOK PROCESSING FAILED:', {
      paymentIntentId: paymentIntent.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: paymentIntent.metadata
    });
  }
}

// Handle failed payment
async function handlePaymentIntentFailed(event: any) {
  const paymentIntent = event.data.object as any;
  
  console.error('Payment failed:', {
    paymentIntentId: paymentIntent.id,
    campaignId: paymentIntent.metadata?.campaignId,
    customerEmail: paymentIntent.metadata?.customerEmail,
    lastError: paymentIntent.last_payment_error?.message,
  });

  // TODO: Send failure notification email to customer
  // TODO: Log failed attempt for analytics
}

// Handle canceled payment
async function handlePaymentIntentCanceled(event: any) {
  const paymentIntent = event.data.object as any;
  
  console.log('Payment canceled:', {
    paymentIntentId: paymentIntent.id,
    campaignId: paymentIntent.metadata?.campaignId,
    customerEmail: paymentIntent.metadata?.customerEmail,
  });

  // TODO: Clean up any pending order records
  // TODO: Log cancellation for analytics
}

// Handle successful charge
async function handleChargeSucceeded(event: any) {
  const charge = event.data.object as any;
  
  console.log('Charge succeeded:', {
    chargeId: charge.id,
    amount: formatAmountFromStripe(charge.amount),
    paymentIntentId: charge.payment_intent,
    receiptUrl: charge.receipt_url,
  });

  // TODO: Store receipt URL for customer access
  // TODO: Update payment record with charge details
}

// Handle failed charge
async function handleChargeFailed(event: any) {
  const charge = event.data.object as any;
  
  console.error('Charge failed:', {
    chargeId: charge.id,
    paymentIntentId: charge.payment_intent,
    failureCode: charge.failure_code,
    failureMessage: charge.failure_message,
  });

  // TODO: Handle charge failure (retry logic, customer notification)
}

// GET requests not supported
export async function loader() {
  return jsonResponse({error: 'Webhook endpoint - POST only'}, {status: 405});
}