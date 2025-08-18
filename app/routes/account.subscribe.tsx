/**
 * Marketing Subscription Confirmation Route Handler
 * Processes subscription confirmations and shows branded success page
 * Example: /account/subscribe?syclid=xyz&token=abc123
 */

import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData} from 'react-router';
import {SuccessPage, ErrorPage} from '~/components/account/BrandedConfirmation';
import {confirmSubscriptionWithShopify} from '~/lib/shopify-account.server';

export async function loader({request, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const syclid = url.searchParams.get('syclid');
  
  // Log subscription confirmation (without exposing full tokens)
  console.log('Marketing subscription confirmation:', {
    hasToken: !!token,
    hasSyclid: !!syclid,
    tokenPrefix: token ? token.substring(0, 8) + '...' : 'none',
    timestamp: new Date().toISOString(),
  });

  if (!token && !syclid) {
    return json({ 
      success: false, 
      error: 'DOHHH! MISSING SUBSCRIPTION INFO',
      suggestion: 'Check your email and try the link again'
    });
  }

  try {
    // Process the subscription confirmation with Shopify
    const result = await confirmSubscriptionWithShopify(
      token || syclid || '',
      context
    );
    
    if (result.success) {
      return json({ 
        success: true, 
        message: 'DOHHH-LICIOUS! YOU\'RE SUBSCRIBED!',
        nextSteps: 'Get ready for exclusive campaigns and cookie drops!'
      });
    } else {
      return json({ 
        success: false, 
        error: 'DOHHH! SUBSCRIPTION HICCUP',
        suggestion: result.message || 'Try again or contact support'
      });
    }
  } catch (error) {
    console.error('Subscription error:', error);
    return json({ 
      success: false, 
      error: 'BURNT COOKIES! SOMETHING WENT WRONG',
      suggestion: 'Please try again later or contact support'
    });
  }
}

export default function SubscribeConfirmation() {
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
      showRetry={true}
      retryLink="/account/register"
    />
  );
}