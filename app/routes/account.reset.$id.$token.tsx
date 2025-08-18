/**
 * Password Reset Route Handler
 * Redirects password reset links from emails to Shopify backend
 * Example: /account/reset/9725469458751/abc123def456
 */

import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({params, request}: LoaderFunctionArgs) {
  const {id, token} = params;
  const url = new URL(request.url);
  
  // Log reset attempt (without exposing the full token)
  console.log('Password reset redirect:', {
    customerId: id,
    tokenPrefix: token?.substring(0, 8) + '...',
    timestamp: new Date().toISOString(),
  });

  // Validate parameters
  if (!id || !token) {
    console.error('Invalid reset parameters');
    return redirect('/account/login?error=invalid_reset_link', 302);
  }

  // Build the Shopify backend reset URL
  const shopifyDomain = 'https://c530bh-ki.myshopify.com';
  const redirectUrl = `${shopifyDomain}/account/reset/${id}/${token}${url.search}`;

  // Redirect to Shopify for password reset
  return redirect(redirectUrl, 302);
}

// Handle POST requests for password reset form submission
export async function action({params, request}: LoaderFunctionArgs) {
  const {id, token} = params;
  const url = new URL(request.url);
  
  console.log('Password reset POST redirect:', {
    customerId: id,
    method: 'POST',
    timestamp: new Date().toISOString(),
  });

  // Build the Shopify backend reset URL
  const shopifyDomain = 'https://c530bh-ki.myshopify.com';
  const redirectUrl = `${shopifyDomain}/account/reset/${id}/${token}${url.search}`;

  // Redirect POST requests to Shopify backend
  return redirect(redirectUrl, 307); // 307 preserves the request method
}