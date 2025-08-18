/**
 * Account Activation Route Handler
 * Redirects account activation links from emails to Shopify backend
 * Example: /account/activate/9725469458751/18c1db94218b787d83ba1cd65f3a2761-1755491741
 */

import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({params, request}: LoaderFunctionArgs) {
  const {id, token} = params;
  const url = new URL(request.url);
  
  // Log activation attempt (without exposing the full token)
  console.log('Account activation redirect:', {
    customerId: id,
    tokenPrefix: token?.substring(0, 8) + '...',
    timestamp: new Date().toISOString(),
  });

  // Validate parameters
  if (!id || !token) {
    console.error('Invalid activation parameters');
    return redirect('/account/login?error=invalid_activation_link', 302);
  }

  // Build the Shopify backend activation URL
  const shopifyDomain = 'https://c530bh-ki.myshopify.com';
  const redirectUrl = `${shopifyDomain}/account/activate/${id}/${token}${url.search}`;

  // Redirect to Shopify for activation
  return redirect(redirectUrl, 302);
}