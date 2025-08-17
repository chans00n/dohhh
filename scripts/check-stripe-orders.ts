#!/usr/bin/env npx tsx

/**
 * Stripe Order Status Check Script
 * 
 * Usage: npx tsx scripts/check-stripe-orders.ts [hours]
 * Example: npx tsx scripts/check-stripe-orders.ts 24
 * 
 * This script checks recent Stripe payments and shows which ones have/haven't created Shopify orders
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Missing STRIPE_SECRET_KEY');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

async function checkOrders(hoursBack: number = 24) {
  try {
    const since = Math.floor(Date.now() / 1000) - (hoursBack * 3600);
    
    console.log(`\n🔍 Checking payments from last ${hoursBack} hours...\n`);
    
    const paymentIntents = await stripe.paymentIntents.list({
      created: { gte: since },
      limit: 100,
    });
    
    const succeeded = paymentIntents.data.filter(pi => pi.status === 'succeeded');
    const withOrders = succeeded.filter(pi => pi.metadata.shopify_order_id);
    const withoutOrders = succeeded.filter(pi => !pi.metadata.shopify_order_id);
    
    console.log(`📊 Summary:`);
    console.log(`   Total succeeded payments: ${succeeded.length}`);
    console.log(`   ✅ With Shopify orders: ${withOrders.length}`);
    console.log(`   ❌ Without Shopify orders: ${withoutOrders.length}`);
    
    if (withoutOrders.length > 0) {
      console.log(`\n⚠️  Payments missing Shopify orders:\n`);
      withoutOrders.forEach(pi => {
        const date = new Date(pi.created * 1000).toLocaleString();
        console.log(`   ID: ${pi.id}`);
        console.log(`   Amount: $${(pi.amount / 100).toFixed(2)}`);
        console.log(`   Customer: ${pi.metadata.customerEmail || pi.receipt_email || 'Unknown'}`);
        console.log(`   Campaign: ${pi.metadata.campaignName || 'Unknown'}`);
        console.log(`   Date: ${date}`);
        console.log(`   Recovery command: npx tsx scripts/recover-stripe-order.ts ${pi.id}`);
        console.log(`   ---`);
      });
      
      console.log(`\n💡 To recover all missing orders, run:`);
      console.log(`   npx tsx scripts/recover-all-orders.ts\n`);
    } else {
      console.log(`\n✅ All successful payments have Shopify orders!\n`);
    }
    
    // Show recent successful orders for verification
    if (withOrders.length > 0) {
      console.log(`📦 Recent successful orders (last 5):\n`);
      withOrders.slice(0, 5).forEach(pi => {
        const date = new Date(pi.created * 1000).toLocaleString();
        console.log(`   Order: ${pi.metadata.shopify_order_name}`);
        console.log(`   Payment: ${pi.id}`);
        console.log(`   Amount: $${(pi.amount / 100).toFixed(2)}`);
        console.log(`   Date: ${date}`);
        console.log(`   ---`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking orders:', error);
  }
}

// Main execution
const hours = parseInt(process.argv[2] || '24');
checkOrders(hours).then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});