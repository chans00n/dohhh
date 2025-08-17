#!/usr/bin/env npx tsx

/**
 * Manual Order Recovery Script
 * 
 * Usage: npx tsx scripts/recover-stripe-order.ts <payment_intent_id>
 * Example: npx tsx scripts/recover-stripe-order.ts pi_3RwvRuAGGp9MhWwY093ogavD
 * 
 * This script recovers failed orders by:
 * 1. Fetching the payment intent from Stripe
 * 2. Reconstructing the order data from metadata
 * 3. Creating the order in Shopify
 * 4. Updating the payment intent to prevent duplicates
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SHOPIFY_STORE_DOMAIN = process.env.PUBLIC_STORE_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.PRIVATE_ADMIN_API_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || '2024-10';

if (!STRIPE_SECRET_KEY || !SHOPIFY_STORE_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
  console.error('❌ Missing required environment variables');
  console.error('Required: STRIPE_SECRET_KEY, PUBLIC_STORE_DOMAIN, PRIVATE_ADMIN_API_ACCESS_TOKEN');
  process.exit(1);
}

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

async function recoverOrder(paymentIntentId: string) {
  try {
    console.log(`\n🔍 Fetching payment intent: ${paymentIntentId}`);
    
    // Fetch payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Check if already processed
    if (paymentIntent.metadata.shopify_order_id) {
      console.log(`✅ Order already exists!`);
      console.log(`   Order ID: ${paymentIntent.metadata.shopify_order_id}`);
      console.log(`   Order Name: ${paymentIntent.metadata.shopify_order_name}`);
      return;
    }
    
    // Check payment status
    if (paymentIntent.status !== 'succeeded') {
      console.error(`❌ Payment not successful. Status: ${paymentIntent.status}`);
      return;
    }
    
    console.log(`\n💰 Payment Details:`);
    console.log(`   Amount: $${(paymentIntent.amount / 100).toFixed(2)}`);
    console.log(`   Customer: ${paymentIntent.metadata.customerEmail}`);
    console.log(`   Campaign: ${paymentIntent.metadata.campaignName}`);
    
    // Parse items from metadata
    const items = paymentIntent.metadata.items ? JSON.parse(paymentIntent.metadata.items) : [];
    
    if (items.length === 0) {
      console.error('❌ No items found in payment metadata');
      return;
    }
    
    // Build Shopify order
    const orderData = {
      email: paymentIntent.metadata.customerEmail,
      line_items: items.map((item: any) => ({
        variant_id: item.id.replace('gid://shopify/ProductVariant/', ''),
        quantity: item.qty,
        price: item.price.toFixed(2),
      })),
      customer: {
        email: paymentIntent.metadata.customerEmail,
        first_name: paymentIntent.metadata.customerName?.split(' ')[0] || '',
        last_name: paymentIntent.metadata.customerName?.split(' ').slice(1).join(' ') || '',
        phone: paymentIntent.metadata.customerPhone || '+15555551234',
      },
      financial_status: 'paid',
      transactions: [{
        kind: 'sale',
        status: 'success',
        amount: (paymentIntent.amount / 100).toFixed(2),
        gateway: 'stripe',
      }],
      tags: 'campaign, stripe-payment, manual-recovery',
      note: `Campaign: ${paymentIntent.metadata.campaignName}\nPayment Intent: ${paymentIntent.id}\nManually recovered`,
      source_name: 'stripe',
      inventory_behaviour: 'decrement_ignoring_policy',
      send_receipt: true,
    };
    
    // Add shipping if needed
    if (paymentIntent.metadata.deliveryMethod === 'shipping' && paymentIntent.shipping) {
      orderData.shipping_address = {
        first_name: orderData.customer.first_name,
        last_name: orderData.customer.last_name,
        address1: paymentIntent.shipping.address?.line1 || '',
        city: paymentIntent.shipping.address?.city || '',
        province: paymentIntent.shipping.address?.state || '',
        zip: paymentIntent.shipping.address?.postal_code || '',
        country: paymentIntent.shipping.address?.country || 'US',
        phone: orderData.customer.phone,
      };
      orderData.shipping_lines = [{
        title: 'Standard Shipping',
        price: '8.00',
        code: 'SHIPPING',
      }];
    } else if (paymentIntent.metadata.deliveryMethod === 'local_delivery') {
      orderData.shipping_lines = [{
        title: 'Local Delivery',
        price: '5.00',
        code: 'LOCAL_DELIVERY',
      }];
    }
    
    console.log(`\n📦 Creating Shopify order...`);
    
    // Create order in Shopify
    const createUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/orders.json`;
    const response = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order: orderData }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Failed to create order:', JSON.stringify(result.errors || result, null, 2));
      return;
    }
    
    console.log(`\n✅ Order created successfully!`);
    console.log(`   Order ID: ${result.order.id}`);
    console.log(`   Order Name: ${result.order.name}`);
    console.log(`   Order Number: ${result.order.order_number}`);
    
    // Update payment intent metadata
    console.log(`\n🔄 Updating payment intent metadata...`);
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: {
        ...paymentIntent.metadata,
        shopify_order_id: result.order.id.toString(),
        shopify_order_name: result.order.name,
        shopify_order_created: new Date().toISOString(),
        manual_recovery: 'true',
      },
    });
    
    console.log(`\n🎉 Recovery complete!`);
    console.log(`   View order: https://${SHOPIFY_STORE_DOMAIN}/admin/orders/${result.order.id}`);
    
  } catch (error) {
    console.error('\n❌ Recovery failed:', error);
    if (error instanceof Error) {
      console.error('   Error:', error.message);
    }
  }
}

// Main execution
const paymentIntentId = process.argv[2];

if (!paymentIntentId) {
  console.error('❌ Please provide a payment intent ID');
  console.error('Usage: npx tsx scripts/recover-stripe-order.ts <payment_intent_id>');
  console.error('Example: npx tsx scripts/recover-stripe-order.ts pi_3RwvRuAGGp9MhWwY093ogavD');
  process.exit(1);
}

console.log('🚀 Starting order recovery...');
recoverOrder(paymentIntentId).then(() => {
  console.log('\n✨ Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});