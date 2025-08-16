// Dynamic import for Stripe to work with Cloudflare Workers
let stripeInstance: any = null;

// Initialize Stripe with error handling
export async function getStripe() {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    
    // Dynamic import to avoid require issues
    const {default: Stripe} = await import('stripe');
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
      httpClient: Stripe.createFetchHttpClient(), // Use fetch-based client for Workers
    });
  }
  
  return stripeInstance;
}

// Verify webhook signature
export async function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  webhookSecret: string
): Promise<any> {
  const stripe = await getStripe();
  
  if (!signature) {
    throw new Error('No webhook signature provided');
  }
  
  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error: any) {
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
}

// Format amount for Stripe (convert dollars to cents)
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100);
}

// Format amount from Stripe (convert cents to dollars)
export function formatAmountFromStripe(amount: number): number {
  return amount / 100;
}