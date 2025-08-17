#!/usr/bin/env npx tsx

/**
 * Batch Order Recovery Script
 * 
 * Usage: npx tsx scripts/recover-all-orders.ts [hours]
 * Example: npx tsx scripts/recover-all-orders.ts 48
 * 
 * This script finds and recovers ALL missing orders from the specified time period
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

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

async function recoverAllOrders(hoursBack: number = 24) {
  try {
    const since = Math.floor(Date.now() / 1000) - (hoursBack * 3600);
    
    console.log(`\n🔍 Finding missing orders from last ${hoursBack} hours...\n`);
    
    const paymentIntents = await stripe.paymentIntents.list({
      created: { gte: since },
      limit: 100,
    });
    
    const withoutOrders = paymentIntents.data.filter(
      pi => pi.status === 'succeeded' && !pi.metadata.shopify_order_id
    );
    
    if (withoutOrders.length === 0) {
      console.log(`✅ No missing orders found!\n`);
      return;
    }
    
    console.log(`📊 Found ${withoutOrders.length} payments without orders\n`);
    
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    const answer = await new Promise<string>((resolve) => {
      rl.question(`⚠️  Recover all ${withoutOrders.length} orders? (yes/no): `, resolve);
    });
    rl.close();
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Recovery cancelled');
      return;
    }
    
    console.log(`\n🚀 Starting batch recovery...\n`);
    
    let recovered = 0;
    let failed = 0;
    
    for (const pi of withoutOrders) {
      console.log(`\n📦 Processing ${pi.id}...`);
      console.log(`   Customer: ${pi.metadata.customerEmail || 'Unknown'}`);
      console.log(`   Amount: $${(pi.amount / 100).toFixed(2)}`);
      
      try {
        // Use the recovery script for each payment
        execSync(`npx tsx ${join(__dirname, 'recover-stripe-order.ts')} ${pi.id}`, {
          stdio: 'inherit',
        });
        recovered++;
      } catch (error) {
        console.error(`   ❌ Failed to recover`);
        failed++;
      }
      
      // Add a small delay between recoveries
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n✨ Batch recovery complete!`);
    console.log(`   ✅ Recovered: ${recovered}`);
    console.log(`   ❌ Failed: ${failed}`);
    
  } catch (error) {
    console.error('❌ Error in batch recovery:', error);
  }
}

// Main execution
const hours = parseInt(process.argv[2] || '24');
recoverAllOrders(hours).then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});