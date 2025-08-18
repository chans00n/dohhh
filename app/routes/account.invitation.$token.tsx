/**
 * Account Invitation Route Handler
 * Redirects account invitation links from emails to Shopify backend
 * Example: /account/invitation/abc123def456ghi789
 */

import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({params, request}: LoaderFunctionArgs) {
  const {token} = params;
  const url = new URL(request.url);
  
  // Log invitation attempt (without exposing the full token)
  console.log('Account invitation redirect:', {
    tokenPrefix: token?.substring(0, 8) + '...',
    timestamp: new Date().toISOString(),
  });

  // Validate parameters
  if (!token) {
    console.error('Invalid invitation token');
    return redirect('/account/register?error=invalid_invitation', 302);
  }

  // Build the Shopify backend invitation URL
  const shopifyDomain = 'https://c530bh-ki.myshopify.com';
  const redirectUrl = `${shopifyDomain}/account/invitation/${token}${url.search}`;

  // Redirect to Shopify for account invitation
  return redirect(redirectUrl, 302);
}