/**
 * Email Confirmation Route Handler
 * Redirects email confirmation links to Shopify backend
 * Example: /account/confirm?token=abc123&customer_id=123456
 */

import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  
  // Log confirmation attempt (without exposing tokens)
  console.log('Email confirmation redirect:', {
    hasToken: url.searchParams.has('token'),
    hasCustomerId: url.searchParams.has('customer_id'),
    timestamp: new Date().toISOString(),
  });

  // Build the Shopify backend confirmation URL
  const shopifyDomain = 'https://c530bh-ki.myshopify.com';
  const redirectUrl = `${shopifyDomain}/account/confirm${url.search}`;

  // Redirect to Shopify for email confirmation
  return redirect(redirectUrl, 302);
}