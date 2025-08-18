/**
 * Marketing Subscription Confirmation Route Handler
 * Redirects marketing subscription confirmation links to Shopify backend
 * Example: /account/subscribe?syclid=xyz&token=abc123
 */

import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  
  // Log subscription confirmation (without exposing tokens)
  console.log('Marketing subscription redirect:', {
    hasToken: url.searchParams.has('token'),
    hasSyclid: url.searchParams.has('syclid'),
    timestamp: new Date().toISOString(),
  });

  // Build the Shopify backend subscription URL
  const shopifyDomain = 'https://c530bh-ki.myshopify.com';
  const redirectUrl = `${shopifyDomain}/account/subscribe${url.search}`;

  // Redirect to Shopify for subscription confirmation
  return redirect(redirectUrl, 302);
}

// Handle POST requests for subscription forms
export async function action({request}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  
  console.log('Marketing subscription POST redirect:', {
    method: 'POST',
    timestamp: new Date().toISOString(),
  });

  // Build the Shopify backend subscription URL
  const shopifyDomain = 'https://c530bh-ki.myshopify.com';
  const redirectUrl = `${shopifyDomain}/account/subscribe${url.search}`;

  // Redirect POST requests to Shopify backend
  return redirect(redirectUrl, 307); // 307 preserves the request method
}