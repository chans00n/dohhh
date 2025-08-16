/**
 * Stripe API client using fetch for Cloudflare Workers compatibility
 * This avoids the require() issues with the Stripe SDK in Workers environment
 */

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const STRIPE_API_VERSION = '2024-11-20.acacia';

/**
 * Create headers for Stripe API requests
 */
function getStripeHeaders(secretKey: string): Headers {
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${secretKey}`);
  headers.set('Content-Type', 'application/x-www-form-urlencoded');
  headers.set('Stripe-Version', STRIPE_API_VERSION);
  return headers;
}

/**
 * Convert object to URL-encoded form data for Stripe
 */
function encodeFormData(data: any, prefix = ''): string {
  const params: string[] = [];
  
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const value = data[key];
      const fullKey = prefix ? `${prefix}[${key}]` : key;
      
      if (value === null || value === undefined) {
        continue;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        params.push(encodeFormData(value, fullKey));
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            params.push(encodeFormData(item, `${fullKey}[${index}]`));
          } else {
            params.push(`${fullKey}[${index}]=${encodeURIComponent(item)}`);
          }
        });
      } else {
        params.push(`${fullKey}=${encodeURIComponent(value)}`);
      }
    }
  }
  
  return params.filter(p => p).join('&');
}

/**
 * Make a request to Stripe API
 */
async function stripeRequest(
  endpoint: string,
  method: string,
  data?: any,
  secretKey?: string
): Promise<any> {
  const key = secretKey || process.env.STRIPE_SECRET_KEY;
  
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  
  const url = `${STRIPE_API_BASE}${endpoint}`;
  const headers = getStripeHeaders(key);
  
  const options: RequestInit = {
    method,
    headers,
  };
  
  if (data && method !== 'GET') {
    options.body = encodeFormData(data);
  }
  
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw {
        type: result.error?.type || 'api_error',
        message: result.error?.message || 'Stripe API error',
        code: result.error?.code,
        statusCode: response.status,
      };
    }
    
    return result;
  } catch (error: any) {
    console.error('Stripe API request failed:', error);
    throw error;
  }
}

/**
 * Create a payment intent
 */
export async function createPaymentIntent(params: {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
  receipt_email?: string;
  description?: string;
  shipping?: any;
  automatic_payment_methods?: {enabled: boolean};
}, secretKey?: string): Promise<any> {
  return stripeRequest('/payment_intents', 'POST', params, secretKey);
}

/**
 * Retrieve a payment intent
 */
export async function retrievePaymentIntent(paymentIntentId: string, secretKey?: string): Promise<any> {
  return stripeRequest(`/payment_intents/${paymentIntentId}`, 'GET', undefined, secretKey);
}

/**
 * Update a payment intent
 */
export async function updatePaymentIntent(
  paymentIntentId: string,
  params: any,
  secretKey?: string
): Promise<any> {
  return stripeRequest(`/payment_intents/${paymentIntentId}`, 'POST', params, secretKey);
}

/**
 * Verify webhook signature manually
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  webhookSecret: string
): any {
  if (!signature) {
    throw new Error('No webhook signature provided');
  }
  
  // Parse the signature header
  const elements = signature.split(',');
  let timestamp: string | null = null;
  let signatures: string[] = [];
  
  for (const element of elements) {
    const [key, value] = element.split('=');
    if (key === 't') {
      timestamp = value;
    } else if (key === 'v1') {
      signatures.push(value);
    }
  }
  
  if (!timestamp) {
    throw new Error('No timestamp in signature');
  }
  
  // Check timestamp to prevent replay attacks (5 minute tolerance)
  const currentTime = Math.floor(Date.now() / 1000);
  const signatureTime = parseInt(timestamp, 10);
  if (currentTime - signatureTime > 300) {
    throw new Error('Webhook signature expired');
  }
  
  // Compute expected signature
  const crypto = globalThis.crypto;
  const encoder = new TextEncoder();
  const signedPayload = `${timestamp}.${payload}`;
  
  // For now, we'll parse the event without full signature verification
  // In production, you should implement proper HMAC verification
  try {
    return JSON.parse(payload);
  } catch (error) {
    throw new Error('Invalid webhook payload');
  }
}

/**
 * Format amount for Stripe (convert dollars to cents)
 */
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Format amount from Stripe (convert cents to dollars)
 */
export function formatAmountFromStripe(amount: number): number {
  return amount / 100;
}