/**
 * Shopify Order Creation Service
 * Creates orders in Shopify after successful Stripe payments
 * Maintains compatibility with existing webhook system
 */

import type Stripe from 'stripe';
import type {CampaignOrderData} from '~/lib/stripe.types';
import type {
  ShopifyOrderInput,
  ShopifyOrder,
  CreateOrderResponse,
} from '~/types/shopify-order.types';
import {stripeToShopifyOrder} from '~/types/shopify-order.types';

/**
 * Create a Shopify order after successful Stripe payment
 */
export async function createOrderAfterPayment(
  stripePaymentIntent: Stripe.PaymentIntent,
  campaignOrderData: CampaignOrderData,
  env?: any
): Promise<CreateOrderResponse> {
  try {
    // Validate environment variables
    const accessToken = env?.PRIVATE_ADMIN_API_ACCESS_TOKEN || process.env?.PRIVATE_ADMIN_API_ACCESS_TOKEN;
    const storeDomain = env?.PUBLIC_STORE_DOMAIN || process.env?.PUBLIC_STORE_DOMAIN;
    const apiVersion = env?.SHOPIFY_ADMIN_API_VERSION || process.env?.SHOPIFY_ADMIN_API_VERSION || '2024-10';

    if (!accessToken || !storeDomain) {
      throw new Error('Shopify configuration missing');
    }

    // Convert Stripe data to Shopify order format
    const orderInput = stripeToShopifyOrder(stripePaymentIntent, campaignOrderData);

    // Add campaign-specific metafields for webhook processing
    orderInput.metafields = [
      {
        namespace: 'campaign',
        key: 'campaign_id',
        value: campaignOrderData.campaignId,
        type: 'single_line_text_field'
      },
      {
        namespace: 'campaign',
        key: 'campaign_name',
        value: campaignOrderData.campaignName,
        type: 'single_line_text_field'
      },
      {
        namespace: 'payment',
        key: 'stripe_payment_intent_id',
        value: stripePaymentIntent.id,
        type: 'single_line_text_field'
      },
      {
        namespace: 'payment',
        key: 'stripe_amount',
        value: (stripePaymentIntent.amount / 100).toFixed(2),
        type: 'number_decimal'
      }
    ];

    // Create order via Shopify Admin API
    const response = await createShopifyOrder(
      orderInput,
      storeDomain,
      accessToken,
      apiVersion
    );

    if (!response.success || !response.order) {
      throw new Error(response.error || 'Failed to create order');
    }

    // Log successful order creation
    console.log('Shopify order created successfully:', {
      orderId: response.order.id,
      orderName: response.order.name,
      campaignId: campaignOrderData.campaignId,
      stripePaymentIntentId: stripePaymentIntent.id,
      total: campaignOrderData.total
    });

    // Update campaign progress (this would trigger webhooks)
    await updateCampaignProgress(
      campaignOrderData.campaignId,
      campaignOrderData.items,
      campaignOrderData.total,
      storeDomain,
      accessToken,
      apiVersion
    );

    return {
      success: true,
      order: response.order,
      orderName: response.order.name,
      orderId: response.order.id
    };
  } catch (error: any) {
    console.error('Failed to create Shopify order:', error);

    // Log detailed error for debugging
    console.error('Error details:', {
      message: error.message,
      campaignId: campaignOrderData.campaignId,
      stripePaymentIntentId: stripePaymentIntent.id,
      customerEmail: campaignOrderData.customer.email
    });

    return {
      success: false,
      error: sanitizeOrderError(error)
    };
  }
}

/**
 * Create order via Shopify Admin REST API
 */
async function createShopifyOrder(
  orderInput: ShopifyOrderInput,
  storeDomain: string,
  accessToken: string,
  apiVersion: string
): Promise<{success: boolean; order?: ShopifyOrder; error?: string}> {
  try {
    const url = `https://${storeDomain}/admin/api/${apiVersion}/orders.json`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({order: orderInput}),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Shopify API error:', data);
      
      // Handle specific Shopify errors
      if (data.errors) {
        const errorMessages = [];
        for (const [field, messages] of Object.entries(data.errors)) {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(', ')}`);
          } else {
            errorMessages.push(`${field}: ${messages}`);
          }
        }
        return {
          success: false,
          error: `Order creation failed: ${errorMessages.join('; ')}`
        };
      }

      return {
        success: false,
        error: data.message || 'Failed to create order in Shopify'
      };
    }

    return {
      success: true,
      order: data.order
    };
  } catch (error: any) {
    console.error('Shopify API request failed:', error);
    return {
      success: false,
      error: 'Network error while creating order'
    };
  }
}

/**
 * Update campaign progress metafields after order creation
 * This ensures the campaign tracking stays in sync
 */
async function updateCampaignProgress(
  campaignId: string,
  items: CampaignOrderData['items'],
  totalAmount: number,
  storeDomain: string,
  accessToken: string,
  apiVersion: string
): Promise<void> {
  try {
    // Extract product ID from campaign ID
    const productId = campaignId.replace('gid://shopify/Product/', '');
    
    // Calculate total quantity sold
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    // Get current campaign metafields
    const currentMetafields = await getCampaignMetafields(
      productId,
      storeDomain,
      accessToken,
      apiVersion
    );

    // Update metafields with new values
    const updates = {
      current_quantity: (currentMetafields.current_quantity || 0) + totalQuantity,
      backer_count: (currentMetafields.backer_count || 0) + 1,
      total_raised: (currentMetafields.total_raised || 0) + totalAmount,
    };

    // Update each metafield
    await updateProductMetafields(
      productId,
      updates,
      storeDomain,
      accessToken,
      apiVersion
    );

    console.log('Campaign progress updated:', {
      campaignId,
      newQuantity: updates.current_quantity,
      newBackerCount: updates.backer_count,
      newTotalRaised: updates.total_raised
    });
  } catch (error) {
    // Log error but don't fail the order creation
    console.error('Failed to update campaign progress:', error);
  }
}

/**
 * Get current campaign metafield values
 */
async function getCampaignMetafields(
  productId: string,
  storeDomain: string,
  accessToken: string,
  apiVersion: string
): Promise<any> {
  try {
    const url = `https://${storeDomain}/admin/api/${apiVersion}/products/${productId}/metafields.json`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch metafields');
    }

    const data = await response.json();
    const metafields = data.metafields || [];

    // Parse metafield values
    const values: any = {};
    for (const field of metafields) {
      if (field.namespace === 'campaign' || field.namespace === 'custom') {
        const key = field.key.replace('campaign_', '');
        if (['current_quantity', 'backer_count', 'total_raised'].includes(key)) {
          values[key] = parseFloat(field.value) || 0;
        }
      }
    }

    return values;
  } catch (error) {
    console.error('Failed to get campaign metafields:', error);
    return {};
  }
}

/**
 * Update product metafields
 */
async function updateProductMetafields(
  productId: string,
  updates: Record<string, number>,
  storeDomain: string,
  accessToken: string,
  apiVersion: string
): Promise<void> {
  try {
    // Update each metafield individually
    for (const [key, value] of Object.entries(updates)) {
      const metafield = {
        namespace: 'campaign',
        key: `campaign_${key}`,
        value: value.toString(),
        type: key === 'total_raised' ? 'number_decimal' : 'number_integer'
      };

      const url = `https://${storeDomain}/admin/api/${apiVersion}/products/${productId}/metafields.json`;

      await fetch(url, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({metafield}),
      });
    }
  } catch (error) {
    console.error('Failed to update product metafields:', error);
    throw error;
  }
}

/**
 * Sanitize error messages for client response
 */
function sanitizeOrderError(error: any): string {
  // Never expose sensitive information
  if (error?.message?.includes('token') || error?.message?.includes('key')) {
    return 'Order processing configuration error';
  }
  if (error?.message?.includes('variant')) {
    return 'Product configuration error. Please contact support.';
  }
  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return 'Connection error. Please try again.';
  }
  return 'Failed to create order. Please contact support.';
}

/**
 * Retry logic for failed order creation
 */
export async function retryOrderCreation(
  stripePaymentIntent: Stripe.PaymentIntent,
  campaignOrderData: CampaignOrderData,
  maxRetries: number = 3,
  env?: any
): Promise<CreateOrderResponse> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Order creation attempt ${attempt} of ${maxRetries}`);
      
      const result = await createOrderAfterPayment(
        stripePaymentIntent,
        campaignOrderData,
        env
      );
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error;
      
      // Don't retry on certain errors
      if (result.error?.includes('configuration') || 
          result.error?.includes('Product')) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    } catch (error) {
      lastError = error;
      console.error(`Order creation attempt ${attempt} failed:`, error);
    }
  }
  
  return {
    success: false,
    error: lastError || 'Failed to create order after multiple attempts'
  };
}