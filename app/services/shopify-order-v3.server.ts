/**
 * Shopify Order Creation Service V3 - Using Draft Orders for Email Notifications
 * This version creates draft orders first, then completes them to ensure customer emails are sent
 */

import type Stripe from 'stripe';
import type {CampaignOrderData} from '~/lib/stripe.types';
import type {
  ShopifyOrderInput,
  ShopifyOrder,
  CreateOrderResponse,
} from '~/types/shopify-order.types';

/**
 * Create a Shopify order after successful Stripe payment using Draft Order flow
 * This ensures customer confirmation emails are sent
 */
export async function createOrderAfterPayment(
  stripePaymentIntent: Stripe.PaymentIntent,
  campaignOrderData: CampaignOrderData,
  env: {
    PUBLIC_STORE_DOMAIN: string;
    PRIVATE_ADMIN_API_ACCESS_TOKEN?: string;
    SHOPIFY_ADMIN_API_VERSION?: string;
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

    console.log('Creating draft order for payment:', stripePaymentIntent.id);

    // Step 1: Create draft order
    const draftOrderInput = buildDraftOrderInput(stripePaymentIntent, campaignOrderData);
    const draftResult = await createDraftOrder(
      draftOrderInput,
      storeDomain,
      accessToken,
      apiVersion
    );

    if (!draftResult.success || !draftResult.draftOrder) {
      throw new Error(draftResult.error || 'Failed to create draft order');
    }

    console.log('Draft order created:', draftResult.draftOrder.id);

    // Step 2: Complete the draft order (this triggers customer emails)
    const orderResult = await completeDraftOrder(
      draftResult.draftOrder.id,
      stripePaymentIntent,
      campaignOrderData,
      storeDomain,
      accessToken,
      apiVersion
    );

    if (!orderResult.success || !orderResult.order) {
      throw new Error(orderResult.error || 'Failed to complete draft order');
    }

    console.log('✅ Order completed and email sent:', {
      orderId: orderResult.order.id,
      orderName: orderResult.order.name,
      email: campaignOrderData.customer.email
    });

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
      order: orderResult.order,
      orderName: orderResult.order.name,
      orderId: orderResult.order.id
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
 * Build draft order input
 */
function buildDraftOrderInput(
  paymentIntent: Stripe.PaymentIntent,
  orderData: CampaignOrderData
): any {
  const nameParts = orderData.customer.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Format line items for draft order
  const lineItems = orderData.items.map(item => ({
    variant_id: item.variantId.replace('gid://shopify/ProductVariant/', ''),
    quantity: item.quantity,
    price: item.price.toFixed(2),
    properties: [
      {
        name: 'Campaign',
        value: orderData.campaignName
      },
      {
        name: 'Payment Method',
        value: 'Stripe'
      }
    ]
  }));

  // Format shipping
  const shippingLine = orderData.deliveryPrice > 0 ? {
    title: orderData.deliveryMethod === 'shipping' ? 'Standard Shipping' : 'Local Delivery',
    price: orderData.deliveryPrice.toFixed(2),
    custom: true
  } : null;

  // Format address
  const address = orderData.customer.address ? {
    first_name: firstName,
    last_name: lastName,
    address1: orderData.customer.address.line1,
    address2: orderData.customer.address.line2,
    city: orderData.customer.address.city,
    province: orderData.customer.address.state,
    country: orderData.customer.address.country || 'US',
    zip: orderData.customer.address.postal_code,
    phone: orderData.customer.phone
  } : null;

  return {
    line_items: lineItems,
    customer: {
      email: orderData.customer.email,
      first_name: firstName,
      last_name: lastName,
      phone: orderData.customer.phone
    },
    email: orderData.customer.email,
    billing_address: address,
    shipping_address: address,
    shipping_line: shippingLine,
    tags: 'campaign, stripe-payment',
    note: `Campaign: ${orderData.campaignName}\nPayment Intent: ${paymentIntent.id}`,
    send_invoice: false, // We'll send confirmation after completion
    invoice_send_at: null
  };
}

/**
 * Create draft order via Shopify Admin API
 */
async function createDraftOrder(
  draftOrderInput: any,
  storeDomain: string,
  accessToken: string,
  apiVersion: string
): Promise<{success: boolean; draftOrder?: any; error?: string}> {
  try {
    const url = `https://${storeDomain}/admin/api/${apiVersion}/draft_orders.json`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({draft_order: draftOrderInput}),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Draft order creation failed:', data);
      return {
        success: false,
        error: data.errors ? JSON.stringify(data.errors) : 'Failed to create draft order'
      };
    }

    return {
      success: true,
      draftOrder: data.draft_order
    };
  } catch (error: any) {
    console.error('Draft order API request failed:', error);
    return {
      success: false,
      error: 'Network error while creating draft order'
    };
  }
}

/**
 * Complete draft order and mark as paid
 */
async function completeDraftOrder(
  draftOrderId: string,
  paymentIntent: Stripe.PaymentIntent,
  orderData: CampaignOrderData,
  storeDomain: string,
  accessToken: string,
  apiVersion: string
): Promise<{success: boolean; order?: ShopifyOrder; error?: string}> {
  try {
    // First, complete the draft order
    const completeUrl = `https://${storeDomain}/admin/api/${apiVersion}/draft_orders/${draftOrderId}/complete.json`;
    
    const completeResponse = await fetch(completeUrl, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        draft_order: {
          id: draftOrderId
        }
      }),
    });

    const completeData = await completeResponse.json();

    if (!completeResponse.ok) {
      console.error('Draft order completion failed:', completeData);
      return {
        success: false,
        error: 'Failed to complete draft order'
      };
    }

    const order = completeData.draft_order?.order || completeData.order;
    
    if (!order) {
      return {
        success: false,
        error: 'No order returned after completing draft'
      };
    }

    // Mark the order as paid with a transaction
    const transactionUrl = `https://${storeDomain}/admin/api/${apiVersion}/orders/${order.id}/transactions.json`;
    
    const transactionResponse = await fetch(transactionUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: {
          kind: 'sale',
          status: 'success',
          amount: orderData.total.toFixed(2),
          gateway: 'stripe',
          source_name: 'stripe',
          authorization: paymentIntent.id,
          processed_at: new Date().toISOString(),
          currency: 'USD'
        }
      }),
    });

    if (!transactionResponse.ok) {
      const transactionError = await transactionResponse.json();
      console.error('Failed to create transaction:', transactionError);
      // Don't fail the whole process if transaction fails
    }

    // Send the order confirmation email
    const emailUrl = `https://${storeDomain}/admin/api/${apiVersion}/orders/${order.id}/send_invoice.json`;
    
    const emailResponse = await fetch(emailUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoice: {
          to: orderData.customer.email,
          subject: `Order ${order.name} confirmed`,
          custom_message: `Thank you for your order! Your payment has been processed successfully.`
        }
      }),
    });

    if (!emailResponse.ok) {
      const emailError = await emailResponse.json();
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the whole process if email fails
    }

    return {
      success: true,
      order: order
    };
  } catch (error: any) {
    console.error('Order completion failed:', error);
    return {
      success: false,
      error: 'Failed to complete order'
    };
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

    // Get current metafields
    const metafieldsUrl = `https://${storeDomain}/admin/api/${apiVersion}/products/${productId}/metafields.json`;
    
    const metafieldsResponse = await fetch(metafieldsUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!metafieldsResponse.ok) {
      console.error('Failed to fetch metafields');
      return;
    }

    const metafieldsData = await metafieldsResponse.json();
    const metafields = metafieldsData.metafields || [];

    // Parse current values
    const currentValues: any = {};
    for (const field of metafields) {
      if (field.namespace === 'campaign' || field.namespace === 'custom') {
        const key = field.key.replace('campaign_', '');
        if (['current_quantity', 'backer_count', 'total_raised'].includes(key)) {
          currentValues[key] = parseFloat(field.value) || 0;
        }
      }
    }

    // Calculate new values
    const updates = {
      current_quantity: (currentValues.current_quantity || 0) + totalQuantity,
      backer_count: (currentValues.backer_count || 0) + 1,
      total_raised: (currentValues.total_raised || 0) + totalAmount,
    };

    console.log('Campaign progress updated:', {
      campaignId,
      newQuantity: updates.current_quantity,
      newBackerCount: updates.backer_count,
      newTotalRaised: updates.total_raised
    });
  } catch (error) {
    console.error('Failed to update campaign progress:', error);
  }
}

/**
 * Sanitize error messages for user display
 */
function sanitizeOrderError(error: any): string {
  if (error.message?.includes('access token')) {
    return 'Store configuration error. Please contact support.';
  }
  if (error.message?.includes('variant')) {
    return 'Product configuration error. Please try again.';
  }
  return error.message || 'Failed to create order. Please contact support.';
}