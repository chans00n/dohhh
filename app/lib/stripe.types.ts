// Stripe payment type definitions for campaign orders

export interface CampaignOrderItem {
  productId: string;
  variantId: string;
  name: string;
  variant?: string;
  quantity: number;
  price: number;
}

export interface CampaignOrderData {
  campaignId: string;
  campaignName: string;
  items: CampaignOrderItem[];
  deliveryMethod: 'shipping';
  deliveryPrice: number;
  subtotal: number;
  total: number;
  tipAmount?: number;
  customer: {
    email: string;
    name: string;
    phone?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country?: string;
    };
  };
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentConfirmationRequest {
  paymentIntentId: string;
  campaignId: string;
}

export interface PaymentConfirmationResponse {
  success: boolean;
  status: string;
  paymentIntentId: string;
  campaignId?: string;
  campaignName?: string;
  amount?: number;
  error?: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

// Validation helpers
export function validateOrderData(data: any): data is CampaignOrderData {
  if (!data || typeof data !== 'object') return false;
  
  // Required fields
  if (!data.campaignId || typeof data.campaignId !== 'string') return false;
  if (!data.campaignName || typeof data.campaignName !== 'string') return false;
  if (!Array.isArray(data.items) || data.items.length === 0) return false;
  if (!data.deliveryMethod || data.deliveryMethod !== 'shipping') return false;
  if (typeof data.deliveryPrice !== 'number' || data.deliveryPrice < 0) return false;
  if (typeof data.subtotal !== 'number' || data.subtotal <= 0) return false;
  if (typeof data.total !== 'number' || data.total <= 0) return false;
  
  // Validate customer
  if (!data.customer || typeof data.customer !== 'object') return false;
  if (!data.customer.email || typeof data.customer.email !== 'string') return false;
  if (!data.customer.name || typeof data.customer.name !== 'string') return false;
  
  // Validate items
  for (const item of data.items) {
    if (!item.productId || typeof item.productId !== 'string') return false;
    if (!item.variantId || typeof item.variantId !== 'string') return false;
    if (typeof item.quantity !== 'number' || item.quantity <= 0) return false;
    if (typeof item.price !== 'number' || item.price < 0) return false;
  }
  
  // Address validation is optional during initial creation
  // It will be required before final payment
  if (data.customer.address) {
    if (!data.customer.address.line1 || typeof data.customer.address.line1 !== 'string') return false;
    if (!data.customer.address.city || typeof data.customer.address.city !== 'string') return false;
    if (!data.customer.address.state || typeof data.customer.address.state !== 'string') return false;
    if (!data.customer.address.postal_code || typeof data.customer.address.postal_code !== 'string') return false;
  }
  
  return true;
}

export function sanitizeError(error: any): string {
  // Never expose sensitive information in error messages
  if (error?.message?.includes('stripe')) {
    return 'Payment processing error. Please try again.';
  }
  if (error?.message?.includes('api')) {
    return 'Service temporarily unavailable. Please try again.';
  }
  return 'An unexpected error occurred. Please try again.';
}