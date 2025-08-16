import {type ActionFunctionArgs} from '@shopify/remix-oxygen';
import {updatePaymentIntent, formatAmountForStripe} from '~/lib/stripe-fetch.server';

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

interface UpdatePaymentIntentRequest {
  paymentIntentId: string;
  customer?: {
    email: string;
    name: string;
    phone?: string;
  };
  delivery?: {
    method: string;
    address?: any;
  };
  tipAmount?: number;
  total?: number;
}

// Only allow POST requests
export async function action({request, context}: ActionFunctionArgs) {
  // Verify request method
  if (request.method !== 'POST') {
    return jsonResponse({error: 'Method not allowed'}, {status: 405});
  }

  try {
    // Parse request body
    const data = await request.json() as UpdatePaymentIntentRequest;
    
    if (!data.paymentIntentId) {
      return jsonResponse(
        {error: 'Missing paymentIntentId'},
        {status: 400}
      );
    }

    // Build update params
    const updateParams: any = {};

    // Update amount if provided
    if (data.total !== undefined) {
      updateParams.amount = formatAmountForStripe(data.total);
    }

    // Update metadata
    const metadata: any = {};
    
    if (data.customer) {
      metadata.customerEmail = data.customer.email;
      metadata.customerName = data.customer.name;
      if (data.customer.phone) {
        metadata.customerPhone = data.customer.phone;
      }
      
      // Also update receipt email
      updateParams.receipt_email = data.customer.email;
    }

    if (data.delivery) {
      metadata.deliveryMethod = data.delivery.method;
      if (data.delivery.address) {
        metadata.shippingAddress = JSON.stringify(data.delivery.address).substring(0, 500);
      }
    }

    if (data.tipAmount !== undefined) {
      metadata.tipAmount = data.tipAmount.toString();
    }

    if (Object.keys(metadata).length > 0) {
      updateParams.metadata = metadata;
    }

    // Update shipping if address provided
    if (data.customer && data.delivery?.address) {
      updateParams.shipping = {
        name: data.customer.name,
        phone: data.customer.phone,
        address: {
          line1: data.delivery.address.line1,
          line2: data.delivery.address.line2,
          city: data.delivery.address.city,
          state: data.delivery.address.state,
          postal_code: data.delivery.address.postal_code,
          country: data.delivery.address.country || 'US',
        },
      };
    }

    // Update the payment intent
    const paymentIntent = await updatePaymentIntent(
      data.paymentIntentId,
      updateParams,
      context.env.STRIPE_SECRET_KEY
    );

    return jsonResponse({
      success: true,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
    }, {
      status: 200,
    });
  } catch (error: any) {
    console.error('Payment intent update error:', error);

    // Check for specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return jsonResponse({error: 'Invalid request. Please check your details.'}, {status: 400});
    }

    // Generic error response
    return jsonResponse(
      {error: 'Failed to update payment intent'},
      {status: 500}
    );
  }
}

// GET requests not supported
export async function loader() {
  return jsonResponse({error: 'This endpoint only accepts POST requests'}, {status: 405});
}