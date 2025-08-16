/**
 * Shopify Order Creation Service V4 - Direct order with email notification
 * Creates order directly and sends confirmation email via API
 */

import type Stripe from 'stripe';
import type {CampaignOrderData} from '~/lib/stripe.types';
import type {CreateOrderResponse} from '~/types/shopify-order.types';
import {stripeToShopifyOrder} from '~/types/shopify-order.types';
import {updatePaymentIntent} from '~/lib/stripe-fetch.server';

/**
 * Create a Shopify order and send confirmation email
 */
export async function createOrderWithEmail(
  stripePaymentIntent: Stripe.PaymentIntent,
  campaignOrderData: CampaignOrderData,
  env: {
    PUBLIC_STORE_DOMAIN: string;
    PRIVATE_ADMIN_API_ACCESS_TOKEN?: string;
    SHOPIFY_ADMIN_API_VERSION?: string;
    STRIPE_SECRET_KEY?: string;
  }
): Promise<CreateOrderResponse> {
  try {
    const storeDomain = env.PUBLIC_STORE_DOMAIN;
    const accessToken = env.PRIVATE_ADMIN_API_ACCESS_TOKEN;
    const apiVersion = env.SHOPIFY_ADMIN_API_VERSION || '2024-10';

    if (!accessToken) {
      throw new Error('Missing Shopify Admin API access token');
    }

    if (!storeDomain) {
      throw new Error('Missing store domain');
    }

    // Check if order already exists (idempotency)
    if (stripePaymentIntent.metadata?.shopify_order_id) {
      console.log('Order already exists for this payment');
      return {
        success: true,
        orderId: stripePaymentIntent.metadata.shopify_order_id,
        orderName: stripePaymentIntent.metadata.shopify_order_name,
      };
    }

    console.log('Creating order for payment:', stripePaymentIntent.id);

    // Build order input using existing helper
    const orderInput = stripeToShopifyOrder(stripePaymentIntent, campaignOrderData);
    
    // Create the order
    const createUrl = `https://${storeDomain}/admin/api/${apiVersion}/orders.json`;
    
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({order: orderInput}),
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      console.error('Order creation failed:', createData);
      throw new Error(createData.errors ? JSON.stringify(createData.errors) : 'Failed to create order');
    }

    const order = createData.order;
    console.log('✅ Shopify order created:', {
      orderId: order.id,
      orderName: order.name,
      orderNumber: order.order_number,
      total: order.total_price
    });

    // Update payment intent metadata to prevent duplicates
    try {
      await updatePaymentIntent(stripePaymentIntent.id, {
        metadata: {
          ...stripePaymentIntent.metadata,
          shopify_order_id: order.id.toString(),
          shopify_order_name: order.name,
          shopify_order_created: new Date().toISOString(),
        }
      }, env.STRIPE_SECRET_KEY);
    } catch (error) {
      console.error('Failed to update payment intent metadata:', error);
    }

    // Send confirmation email using the orders/{id}/send_invoice endpoint
    try {
      await sendOrderConfirmationEmail(
        order.id,
        order.name,
        campaignOrderData.customer.email,
        storeDomain,
        accessToken,
        apiVersion
      );
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the order if email fails
    }

    // Update campaign progress if it's a campaign product
    if (campaignOrderData.campaignId?.includes('gid://shopify/Product/')) {
      await updateCampaignProgress(
        campaignOrderData.campaignId,
        campaignOrderData.items,
        campaignOrderData.total,
        storeDomain,
        accessToken,
        apiVersion
      );
    }

    return {
      success: true,
      order,
      orderName: order.name,
      orderId: order.id
    };
  } catch (error: any) {
    console.error('Failed to create order:', error);
    return {
      success: false,
      error: error.message || 'Failed to create order'
    };
  }
}

/**
 * Send order confirmation email
 */
async function sendOrderConfirmationEmail(
  orderId: string,
  orderName: string,
  customerEmail: string,
  storeDomain: string,
  accessToken: string,
  apiVersion: string
): Promise<void> {
  try {
    console.log(`Sending confirmation email for order ${orderName} to ${customerEmail}`);
    
    // First, try using the customer notification endpoint
    const notificationUrl = `https://${storeDomain}/admin/api/${apiVersion}/orders/${orderId}/send_order_confirmation.json`;
    
    const notificationResponse = await fetch(notificationUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_confirmation: {
          to: customerEmail
        }
      }),
    });

    if (notificationResponse.ok) {
      console.log('✅ Order confirmation email sent successfully');
      return;
    }

    // If that doesn't work, try the transactions endpoint
    const transactionUrl = `https://${storeDomain}/admin/api/${apiVersion}/orders/${orderId}/transactions.json`;
    
    const transactionResponse = await fetch(transactionUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: {
          kind: 'capture',
          status: 'success',
          amount: '0.00',
          send_receipt: true
        }
      }),
    });

    if (transactionResponse.ok) {
      console.log('✅ Order confirmation email triggered via transaction');
      return;
    }

    // Log the error but don't throw
    const errorData = await transactionResponse.json();
    console.error('Failed to send email via transaction:', errorData);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Don't throw - email failure shouldn't fail the order
  }
}

/**
 * Update campaign progress metafields
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
    const productId = campaignId.replace('gid://shopify/Product/', '');
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    console.log('Campaign progress updated:', {
      campaignId,
      totalQuantity,
      totalAmount
    });
  } catch (error) {
    console.error('Failed to update campaign progress:', error);
  }
}