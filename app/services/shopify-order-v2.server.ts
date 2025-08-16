/**
 * Shopify Order Creation Service V2
 * Creates orders in Shopify using the Admin API with proper env handling
 */

import type Stripe from 'stripe';
import type {CampaignOrderData} from '~/lib/stripe.types';
import type {CreateOrderResponse} from '~/types/shopify-order.types';
import {adminFetch, setProductCampaignProgress, appendBackerFeed} from '~/lib/admin';
import {updatePaymentIntent} from '~/lib/stripe-fetch.server';

/**
 * Create a Shopify order using the REST Admin API
 */
export async function createShopifyOrderV2(
  env: any,
  stripePaymentIntent: Stripe.PaymentIntent,
  campaignOrderData: CampaignOrderData
): Promise<CreateOrderResponse> {
  try {
    // Check if order was already created (prevent duplicates)
    if (stripePaymentIntent.metadata?.shopify_order_id) {
      console.log('Order already exists for this payment intent:', {
        orderId: stripePaymentIntent.metadata.shopify_order_id,
        orderName: stripePaymentIntent.metadata.shopify_order_name,
        paymentIntentId: stripePaymentIntent.id,
      });
      return {
        success: true,
        orderId: stripePaymentIntent.metadata.shopify_order_id,
        orderName: stripePaymentIntent.metadata.shopify_order_name || '',
      };
    }
    const storeDomain = env.PUBLIC_STORE_DOMAIN;
    const accessToken = env.PRIVATE_ADMIN_API_ACCESS_TOKEN;
    const apiVersion = env.SHOPIFY_ADMIN_API_VERSION || '2024-10';

    if (!accessToken || !storeDomain) {
      throw new Error('Missing Shopify configuration');
    }

    // Extract product ID and variant IDs
    const productId = campaignOrderData.campaignId.replace('gid://shopify/Product/', '');
    
    // Build order payload
    const orderPayload = {
      order: {
        email: campaignOrderData.customer.email,
        fulfillment_status: 'unfulfilled',
        financial_status: 'paid',
        currency: 'USD',
        customer: {
          email: campaignOrderData.customer.email,
          first_name: campaignOrderData.customer.name.split(' ')[0] || campaignOrderData.customer.name,
          last_name: campaignOrderData.customer.name.split(' ').slice(1).join(' ') || '',
        },
        billing_address: campaignOrderData.customer.address ? {
          first_name: campaignOrderData.customer.name.split(' ')[0] || campaignOrderData.customer.name,
          last_name: campaignOrderData.customer.name.split(' ').slice(1).join(' ') || '',
          address1: campaignOrderData.customer.address.line1,
          address2: campaignOrderData.customer.address.line2 || '',
          city: campaignOrderData.customer.address.city,
          province: campaignOrderData.customer.address.state,
          zip: campaignOrderData.customer.address.postal_code,
          country: campaignOrderData.customer.address.country || 'US',
          phone: campaignOrderData.customer.phone || '',
        } : undefined,
        shipping_address: campaignOrderData.customer.address ? {
          first_name: campaignOrderData.customer.name.split(' ')[0] || campaignOrderData.customer.name,
          last_name: campaignOrderData.customer.name.split(' ').slice(1).join(' ') || '',
          address1: campaignOrderData.customer.address.line1,
          address2: campaignOrderData.customer.address.line2 || '',
          city: campaignOrderData.customer.address.city,
          province: campaignOrderData.customer.address.state,
          zip: campaignOrderData.customer.address.postal_code,
          country: campaignOrderData.customer.address.country || 'US',
          phone: campaignOrderData.customer.phone || '',
        } : undefined,
        line_items: [
          ...campaignOrderData.items.map(item => {
            // Clean variant ID to ensure it's just the numeric ID
            const variantId = item.variantId.replace('gid://shopify/ProductVariant/', '');
            return {
              variant_id: variantId,
              quantity: item.quantity,
              price: item.price.toFixed(2),
            };
          }),
          // Add tip as a custom line item if present
          ...(campaignOrderData.tipAmount && campaignOrderData.tipAmount > 0 ? [{
            title: 'Campaign Support Tip',
            price: campaignOrderData.tipAmount.toFixed(2),
            quantity: 1,
            requires_shipping: false,
            taxable: false,
          }] : []),
        ],
        shipping_lines: campaignOrderData.deliveryMethod === 'shipping' ? [{
          title: 'Flat Rate Shipping',
          price: '15.00',
          code: 'FLAT_RATE',
        }] : [],
        tax_lines: [],
        total_tax: '0.00',
        tags: `campaign,${campaignOrderData.campaignName}`,
        note: `Campaign: ${campaignOrderData.campaignName}\nStripe Payment ID: ${stripePaymentIntent.id}`,
        note_attributes: [
          {
            name: 'stripe_payment_intent_id',
            value: stripePaymentIntent.id,
          },
          {
            name: 'campaign_id',
            value: campaignOrderData.campaignId,
          },
          {
            name: 'campaign_name',
            value: campaignOrderData.campaignName,
          },
          {
            name: 'tip_amount',
            value: (campaignOrderData.tipAmount || 0).toFixed(2),
          },
        ],
        transactions: [{
          kind: 'sale',
          status: 'success',
          amount: campaignOrderData.total.toFixed(2),
          gateway: 'stripe',
          authorization: stripePaymentIntent.id,
        }],
      }
    };

    // Create order via REST API
    const url = `https://${storeDomain}/admin/api/${apiVersion}/orders.json`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Shopify API error:', data);
      
      // Handle specific errors
      if (data.errors) {
        const errorMessages = [];
        for (const [field, messages] of Object.entries(data.errors)) {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(', ')}`);
          } else {
            errorMessages.push(`${field}: ${messages}`);
          }
        }
        throw new Error(`Order creation failed: ${errorMessages.join('; ')}`);
      }
      
      throw new Error(data.message || 'Failed to create order in Shopify');
    }

    const order = data.order;
    
    console.log('✅ Shopify order created:', {
      orderId: order.id,
      orderName: order.name,
      orderNumber: order.order_number,
      total: order.total_price,
    });

    // Update Stripe payment intent metadata to prevent duplicate orders
    try {
      await updatePaymentIntent(stripePaymentIntent.id, {
        metadata: {
          ...stripePaymentIntent.metadata,
          shopify_order_id: order.id.toString(),
          shopify_order_name: order.name,
          shopify_order_created: new Date().toISOString(),
        }
      }, env.STRIPE_SECRET_KEY);
    } catch (metaError) {
      console.error('Failed to update payment intent metadata:', metaError);
      // Don't fail the order creation for this
    }

    // Update campaign progress using admin functions
    try {
      const totalQuantity = campaignOrderData.items.reduce((sum, item) => sum + item.quantity, 0);
      await setProductCampaignProgress(env, campaignOrderData.campaignId, {
        currentQuantityDelta: totalQuantity,
        backerCountDelta: 1,
        totalRaisedDelta: campaignOrderData.total,
      });

      // Add to backer feed
      await appendBackerFeed(env, campaignOrderData.campaignId, {
        name: campaignOrderData.customer.name,
        email: campaignOrderData.customer.email,
        quantity: totalQuantity,
        amount: campaignOrderData.total,
        orderId: `gid://shopify/Order/${order.id}`,
        createdAt: new Date().toISOString(),
        location: campaignOrderData.customer.address?.city || 'Unknown',
      });
    } catch (metaError) {
      console.error('Failed to update campaign metafields:', metaError);
      // Don't fail the order creation for metafield errors
    }

    return {
      success: true,
      orderId: order.id.toString(),
      orderName: order.name,
      order: order,
    };
  } catch (error: any) {
    console.error('Failed to create Shopify order:', error);
    return {
      success: false,
      error: error.message || 'Failed to create order',
    };
  }
}

/**
 * Create order with retry logic
 */
export async function createOrderWithRetry(
  env: any,
  stripePaymentIntent: Stripe.PaymentIntent,
  campaignOrderData: CampaignOrderData,
  maxRetries: number = 3
): Promise<CreateOrderResponse> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Order creation attempt ${attempt} of ${maxRetries}`);
      
      const result = await createShopifyOrderV2(env, stripePaymentIntent, campaignOrderData);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error;
      
      // Don't retry on certain errors
      if (result.error?.includes('configuration') || 
          result.error?.includes('variant') ||
          result.error?.includes('Invalid')) {
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
    error: lastError || 'Failed to create order after multiple attempts',
  };
}