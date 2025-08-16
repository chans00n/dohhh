import {type ActionFunctionArgs} from '@shopify/remix-oxygen';
import {retrievePaymentIntent, formatAmountFromStripe} from '~/lib/stripe-fetch.server';
import {
  sanitizeError,
  type PaymentConfirmationRequest,
  type PaymentConfirmationResponse,
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
export async function action({request}: ActionFunctionArgs) {
  // Verify request method
  if (request.method !== 'POST') {
    return jsonResponse({error: 'Method not allowed'}, {status: 405});
  }

  try {
    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.paymentIntentId || typeof data.paymentIntentId !== 'string') {
      return jsonResponse(
        {error: 'Payment Intent ID is required'},
        {status: 400}
      );
    }

    const confirmationRequest = data as PaymentConfirmationRequest;

    // Retrieve the payment intent from Stripe
    const paymentIntent = await retrievePaymentIntent(
      confirmationRequest.paymentIntentId
    );

    // Check payment status
    const isSuccessful = 
      paymentIntent.status === 'succeeded' || 
      paymentIntent.status === 'processing';

    // Build response with payment details
    const response: PaymentConfirmationResponse = {
      success: isSuccessful,
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
      campaignId: paymentIntent.metadata?.campaignId,
      campaignName: paymentIntent.metadata?.campaignName,
      amount: formatAmountFromStripe(paymentIntent.amount),
    };

    // If payment requires further action
    if (paymentIntent.status === 'requires_action' || 
        paymentIntent.status === 'requires_confirmation') {
      response.error = 'Payment requires additional confirmation';
    }

    // If payment failed
    if (paymentIntent.status === 'canceled' || 
        paymentIntent.status === 'requires_payment_method') {
      response.success = false;
      response.error = 'Payment was not successful. Please try again.';
    }

    // Log successful payments for debugging
    if (isSuccessful) {
      console.log('Payment confirmed:', {
        paymentIntentId: paymentIntent.id,
        campaignId: paymentIntent.metadata?.campaignId,
        amount: formatAmountFromStripe(paymentIntent.amount),
        customerEmail: paymentIntent.metadata?.customerEmail,
      });
    }

    return jsonResponse(response, {
      status: isSuccessful ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Payment confirmation error:', error);

    // Check for specific Stripe errors
    if (error.code === 'resource_missing') {
      const errorResponse: PaymentConfirmationResponse = {
        success: false,
        status: 'not_found',
        paymentIntentId: '',
        error: 'Payment not found. Please check your payment ID.',
      };
      return jsonResponse(errorResponse, {status: 404});
    }

    // Generic error response
    const errorResponse: PaymentConfirmationResponse = {
      success: false,
      status: 'error',
      paymentIntentId: '',
      error: sanitizeError(error),
    };
    
    return jsonResponse(errorResponse, {status: 500});
  }
}

// GET requests not supported
export async function loader() {
  return jsonResponse({error: 'This endpoint only accepts POST requests'}, {status: 405});
}