/**
 * Generic Account Route Handler
 * Catches all unhandled account routes and redirects to Shopify backend
 * Preserves all URL parameters and tokens for proper authentication
 */

import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({request, params}: LoaderFunctionArgs) {
  // Get the full URL and extract the path after /account/
  const url = new URL(request.url);
  const splat = params['*'] || '';
  
  // Log for debugging (without exposing sensitive tokens)
  console.log('Account route redirect:', {
    path: `/account/${splat}`,
    queryParams: url.search ? 'present' : 'none',
    timestamp: new Date().toISOString(),
  });

  // Build the Shopify backend URL
  const shopifyDomain = 'https://c530bh-ki.myshopify.com';
  const redirectUrl = `${shopifyDomain}/account/${splat}${url.search}`;

  // Redirect to Shopify backend with all parameters preserved
  return redirect(redirectUrl, 302);
}

// Handle POST requests as well (for form submissions)
export async function action({request, params}: LoaderFunctionArgs) {
  // Get the full URL and extract the path after /account/
  const url = new URL(request.url);
  const splat = params['*'] || '';
  
  console.log('Account route POST redirect:', {
    path: `/account/${splat}`,
    method: 'POST',
    timestamp: new Date().toISOString(),
  });

  // Build the Shopify backend URL
  const shopifyDomain = 'https://c530bh-ki.myshopify.com';
  const redirectUrl = `${shopifyDomain}/account/${splat}${url.search}`;

  // Redirect POST requests to Shopify backend
  return redirect(redirectUrl, 307); // 307 preserves the request method
}