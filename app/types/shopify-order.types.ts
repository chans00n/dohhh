/**
 * Shopify Order Types for Admin API
 * Used for creating orders after Stripe payment processing
 */

import type {CampaignOrderData} from '~/lib/stripe.types';
import type Stripe from 'stripe';

export interface ShopifyLineItem {
  variant_id: string;
  quantity: number;
  price?: string;
  title?: string;
  product_id?: string;
  properties?: Array<{
    name: string;
    value: string;
  }>;
}

export interface ShopifyShippingLine {
  title: string;
  price: string;
  code: string;
  source?: string;
}

export interface ShopifyCustomer {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface ShopifyAddress {
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone?: string;
}

export interface ShopifyOrderMetafield {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export interface ShopifyOrderInput {
  email: string;
  line_items: ShopifyLineItem[];
  shipping_lines?: ShopifyShippingLine[];
  customer?: ShopifyCustomer;
  billing_address?: ShopifyAddress;
  shipping_address?: ShopifyAddress;
  financial_status?: 'pending' | 'paid' | 'refunded' | 'voided';
  transactions?: Array<{
    kind: 'sale' | 'authorization' | 'capture';
    status: 'success' | 'pending' | 'failure' | 'error';
    amount: string;
    gateway: string;
    source_name?: string;
  }>;
  tags?: string;
  note?: string;
  note_attributes?: Array<{
    name: string;
    value: string;
  }>;
  metafields?: ShopifyOrderMetafield[];
  source_identifier?: string;
  source_name?: string;
  inventory_behaviour?: 'bypass' | 'decrement_ignoring_policy' | 'decrement_obeying_policy';
  send_receipt?: boolean;
  send_fulfillment_receipt?: boolean;
}

export interface ShopifyOrder {
  id: string;
  admin_graphql_api_id: string;
  name: string;
  order_number: number;
  email: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  currency: string;
  financial_status: string;
  fulfillment_status?: string;
  line_items: Array<{
    id: string;
    variant_id: string;
    product_id: string;
    quantity: number;
    price: string;
    title: string;
  }>;
  customer: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  tags?: string;
  note?: string;
  source_identifier?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  order?: ShopifyOrder;
  error?: string;
  orderName?: string;
  orderId?: string;
}

// Helper to convert Stripe payment data to Shopify order format
export function stripeToShopifyOrder(
  paymentIntent: Stripe.PaymentIntent,
  orderData: CampaignOrderData
): ShopifyOrderInput {
  // Parse customer name
  const nameParts = orderData.customer.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Format line items
  const lineItems: ShopifyLineItem[] = [
    ...orderData.items.map(item => ({
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
    })),
    // Add tip as a custom line item if present
    ...(orderData.tipAmount && orderData.tipAmount > 0 ? [{
      title: 'Campaign Support Tip',
      price: orderData.tipAmount.toFixed(2),
      quantity: 1,
      requires_shipping: false,
      taxable: false,
    } as any] : [])
  ];

  // Format shipping lines
  const shippingLines: ShopifyShippingLine[] = [];
  if (orderData.deliveryPrice > 0) {
    shippingLines.push({
      title: orderData.deliveryMethod === 'local_delivery' 
        ? 'Local Delivery' 
        : orderData.deliveryMethod === 'shipping' 
        ? 'Standard Shipping' 
        : 'Pickup',
      price: orderData.deliveryPrice.toFixed(2),
      code: orderData.deliveryMethod.toUpperCase(),
      source: 'stripe_checkout'
    });
  }

  // Format addresses if provided
  let shippingAddress: ShopifyAddress | undefined;
  let billingAddress: ShopifyAddress | undefined;
  
  if (orderData.customer.address) {
    const address: ShopifyAddress = {
      first_name: firstName,
      last_name: lastName,
      address1: orderData.customer.address.line1,
      address2: orderData.customer.address.line2,
      city: orderData.customer.address.city,
      province: orderData.customer.address.state,
      country: orderData.customer.address.country || 'US',
      zip: orderData.customer.address.postal_code,
      phone: orderData.customer.phone
    };
    shippingAddress = address;
    billingAddress = address;
  }

  // Create order input
  const order: ShopifyOrderInput = {
    email: orderData.customer.email,
    line_items: lineItems,
    shipping_lines: shippingLines,
    customer: {
      email: orderData.customer.email,
      first_name: firstName,
      last_name: lastName,
      phone: orderData.customer.phone
    },
    billing_address: billingAddress,
    shipping_address: shippingAddress,
    financial_status: 'paid',
    transactions: [
      {
        kind: 'sale',
        status: 'success',
        amount: orderData.total.toFixed(2),
        gateway: 'stripe',
        source_name: 'stripe'
      }
    ],
    tags: 'campaign, stripe-payment',
    note: `Campaign: ${orderData.campaignName}\nPayment Intent: ${paymentIntent.id}`,
    note_attributes: [
      {
        name: 'stripe_payment_intent_id',
        value: paymentIntent.id
      },
      {
        name: 'campaign_id',
        value: orderData.campaignId
      },
      {
        name: 'campaign_name',
        value: orderData.campaignName
      },
      ...(orderData.tipAmount && orderData.tipAmount > 0 ? [{
        name: 'tip_amount',
        value: `$${orderData.tipAmount.toFixed(2)}`
      }] : [])
    ],
    source_identifier: paymentIntent.id,
    source_name: 'stripe',
    inventory_behaviour: 'decrement_ignoring_policy',
    send_receipt: true,
    send_fulfillment_receipt: true
  };

  return order;
}