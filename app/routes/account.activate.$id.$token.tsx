/**
 * Account Activation Route Handler
 * Processes account activation and shows branded success page
 * Example: /account/activate/9725469458751/18c1db94218b787d83ba1cd65f3a2761-1755491741
 */

import {json, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData} from 'react-router';
import {SuccessPage, ErrorPage} from '~/components/account/BrandedConfirmation';
import {activateAccountWithShopify} from '~/lib/shopify-account.server';

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const {id, token} = params;
  const url = new URL(request.url);
  
  // Log activation attempt (without exposing the full token)
  console.log('Account activation:', {
    customerId: id,
    tokenPrefix: token?.substring(0, 8) + '...',
    timestamp: new Date().toISOString(),
  });

  // Validate parameters
  if (!id || !token) {
    console.error('Invalid activation parameters');
    return json({
      success: false,
      error: 'DOHHH! INVALID ACTIVATION LINK',
      suggestion: 'This link may be expired or incorrect. Check your email for a fresh one.'
    });
  }

  try {
    // Process the account activation with Shopify
    const result = await activateAccountWithShopify(id, token, context);
    
    if (result.success) {
      // Store customer info if needed (could set cookies/session here)
      return json({ 
        success: true, 
        message: 'SWEET SUCCESS! YOUR ACCOUNT IS ACTIVE!',
        nextSteps: 'Time to explore campaigns and back some cookie dreams!',
        customer: result.customer
      });
    } else {
      return json({ 
        success: false, 
        error: 'ACTIVATION FAILED',
        suggestion: result.message || 'This link may be expired. Request a new activation email.'
      });
    }
  } catch (error) {
    console.error('Activation error:', error);
    return json({ 
      success: false, 
      error: 'CRUMBLED! ACTIVATION ERROR',
      suggestion: 'Something went wrong. Please try again or contact support.'
    });
  }
}

export default function AccountActivation() {
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
      retryLink="/account/register"
    />
  );
}