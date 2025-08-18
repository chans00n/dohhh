/**
 * Email Confirmation Route Handler
 * Processes email confirmation and shows branded success page
 * Example: /account/confirm?token=abc123&customer_id=123456
 */

import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData} from 'react-router';
import {SuccessPage, ErrorPage} from '~/components/account/BrandedConfirmation';
import {confirmSubscriptionWithShopify} from '~/lib/shopify-account.server';

export async function loader({request, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const customerId = url.searchParams.get('customer_id');
  
  // Log confirmation attempt (without exposing tokens)
  console.log('Email confirmation:', {
    hasToken: !!token,
    hasCustomerId: !!customerId,
    timestamp: new Date().toISOString(),
  });

  if (!token) {
    return json({
      success: false,
      error: 'DOHHH! MISSING CONFIRMATION INFO',
      suggestion: 'Check your email for the correct link'
    });
  }

  try {
    // Process the confirmation with Shopify
    const result = await confirmSubscriptionWithShopify(token, context);
    
    if (result.success) {
      return json({ 
        success: true, 
        message: 'EMAIL CONFIRMED! YOU\'RE ALL SET!',
        nextSteps: 'Your email is verified and ready for cookie updates!'
      });
    } else {
      return json({ 
        success: false, 
        error: 'CONFIRMATION FAILED',
        suggestion: result.message || 'Try clicking the link in your email again'
      });
    }
  } catch (error) {
    console.error('Confirmation error:', error);
    return json({ 
      success: false, 
      error: 'SOMETHING CRUMBLED!',
      suggestion: 'Please try again or contact support'
    });
  }
}

export default function EmailConfirmation() {
  const data = useLoaderData<typeof loader>();
  
  return data.success ? (
    <SuccessPage 
      message={data.message!}
      nextSteps={data.nextSteps}
      showConfetti={true}
    />
  ) : (
    <ErrorPage 
      error={data.error!}
      suggestion={data.suggestion}
      showRetry={false}
    />
  );
}